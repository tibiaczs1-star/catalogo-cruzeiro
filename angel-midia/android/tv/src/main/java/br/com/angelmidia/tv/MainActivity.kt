package br.com.angelmidia.tv

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.BitmapFactory
import android.graphics.RenderEffect
import android.graphics.Shader
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.StatFs
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.view.animation.LinearInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.*
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import org.json.JSONObject
import org.json.JSONArray
import java.io.File
import java.io.FileOutputStream
import java.io.InterruptedIOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class MainActivity : Activity() {
    private val preferences by lazy { getSharedPreferences("angel_tv", MODE_PRIVATE) }
    private val mainHandler = Handler(Looper.getMainLooper())
    private val transfers = TransferRegistry<HttpURLConnection> { it.disconnect() }
    private val playbackSession = PlaybackSession()
    private val playbackSlot = PlaybackSlot<VideoView> { video -> runCatching { video.stopPlayback() } }
    private val telemetryExecutor = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "angel-telemetry")
    }
    private val telemetryQueue = TelemetryDispatchQueue<TelemetrySnapshot>(
        schedule = { worker -> telemetryExecutor.execute(worker) },
        deliver = { _, snapshot ->
            preferences.getString("device_token", null)?.let { token ->
                requestNoContent("PUT", "api/device/telemetry", jsonPayload(snapshot.toPayload()), token)
            }
        },
    )
    private val ackDrainRunning = AtomicBoolean(false)
    private var scheduleIndex = 0
    private var scheduleItems = JSONArray()
    private var manifestLoop = true
    private var consecutiveFailures = 0
    private var recoveryAttempt = 0
    private var scheduleVersion: String? = null
    private var scheduleExhausted = false
    private var offlinePlayback = false
    private var connectionRecovered = false
    private var resumeChecked = false
    private var pendingResumeAssetId: String? = null
    private var pendingResumePositionMs = 0
    private var currentPlaybackAssetId: String? = null
    private var currentPlaybackVideo: VideoView? = null
    private var currentPlaybackGeneration = -1
    private var activityStarted = false
    private var currentTelemetryAssetId: String? = null
    private var playbackStartedAt: String? = null
    private var telemetryDownloadState = "idle"
    private var telemetryErrorMessage: String? = null
    private val telemetryRunnable = object : Runnable {
        override fun run() {
            if (!activityStarted) return
            sendTelemetryAsync()
            mainHandler.postDelayed(this, TELEMETRY_INTERVAL_MS)
        }
    }
    private val checkpointRunnable = object : Runnable {
        override fun run() {
            if (!activityStarted || currentPlaybackGeneration < 0) return
            savePlaybackCheckpoint()
            mainHandler.postDelayed(this, PLAYBACK_CHECKPOINT_INTERVAL_MS)
        }
    }

    private fun advanceGeneration(): Int {
        val previous = playbackSession.current()
        val next = playbackSession.advance()
        transfers.cancel(previous)
        stopCurrentPlayback()
        return next
    }

    override fun onCreate(state: Bundle?) {
        setTheme(R.style.AppTheme)
        super.onCreate(state)
        val startup = StartupPresentation.tv()
        if (startup.shouldCover(StartupPhase.LOADING)) setContentView(StartupView.create(this, startup))
        enterFullscreen()
    }

    override fun onStart() {
        super.onStart()
        activityStarted = true
        playbackSession.activate()
        when {
            preferences.contains("device_token") -> showReady()
            preferences.contains("link_code") -> showPairing()
            else -> showFirstRun()
        }
        startTelemetryLoop()
        drainPendingCommandAcks()
    }

    override fun onStop() {
        activityStarted = false
        savePlaybackCheckpoint()
        shutdownPlayback()
        super.onStop()
    }

    override fun onDestroy() {
        activityStarted = false
        shutdownPlayback()
        telemetryExecutor.shutdownNow()
        super.onDestroy()
    }

    private fun shutdownPlayback() {
        val previous = playbackSession.current()
        playbackSession.deactivate()
        mainHandler.removeCallbacksAndMessages(null)
        transfers.cancel(previous)
        stopCurrentPlayback()
    }

    private fun stopCurrentPlayback() {
        savePlaybackCheckpoint()
        mainHandler.removeCallbacks(checkpointRunnable)
        currentPlaybackVideo = null
        currentPlaybackAssetId = null
        currentPlaybackGeneration = -1
        playbackSlot.clear()
    }

    private fun showContent(view: View, video: VideoView? = null) {
        playbackSlot.replace(video)
        setContentView(view)
        enterFullscreen()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) enterFullscreen()
    }

    private fun enterFullscreen() {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    }

    private fun label(value: String, size: Float = 20f) = TextView(this).apply {
        text = value; textSize = size; setTextColor(Color.WHITE)
    }

    private fun container() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER
        setPadding(72, 42, 72, 42); setBackgroundColor(Color.rgb(11, 95, 234))
    }

    private fun field(hint: String) = EditText(this).apply {
        this.hint = hint; textSize = 20f; setTextColor(Color.WHITE); setHintTextColor(Color.rgb(170, 181, 213))
        setSingleLine(true); setPadding(24, 18, 24, 18)
    }

    private fun solidShape(color: Int, radius: Float, strokeColor: Int? = null, strokeWidth: Float = 0f) =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = dp(radius).toFloat()
            if (strokeColor != null && strokeWidth > 0f) setStroke(dp(strokeWidth), strokeColor)
        }

    private fun firstRunField(hint: String) = EditText(this).apply {
        this.hint = hint
        textSize = 18f
        setTextColor(Color.rgb(12, 32, 68))
        setHintTextColor(Color.rgb(101, 116, 139))
        setSingleLine(true)
        setPadding(dp(20f), dp(6f), dp(20f), dp(6f))
        background = solidShape(Color.rgb(245, 248, 252), 12f, Color.rgb(214, 224, 238), 1f)
        minHeight = dp(58f)
    }

    private fun showFirstRun() {
        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.rgb(8, 65, 156))
            setPadding(dp(64f), dp(48f), dp(64f), dp(48f))
        }
        val stage = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val introduction = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, 0, dp(72f), 0)
        }
        introduction.addView(TextView(this).apply {
            text = "ANGEL MÍDIA  •  TV PLAYER"
            textSize = 16f
            setTextColor(Color.rgb(186, 230, 253))
            setTypeface(typeface, Typeface.BOLD)
            letterSpacing = 0.08f
        })
        introduction.addView(TextView(this).apply {
            text = "Sua tela, pronta\npara operar."
            textSize = 44f
            setTextColor(Color.WHITE)
            setTypeface(typeface, Typeface.BOLD)
            setLineSpacing(0f, 0.94f)
        }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(18f) })
        introduction.addView(TextView(this).apply {
            text = "Cadastre o ponto uma vez. Depois, playlists, notícias, campanhas e comandos chegam pelo painel."
            textSize = 19f
            setTextColor(Color.rgb(219, 234, 254))
            setLineSpacing(dp(3f).toFloat(), 1f)
        }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(18f) })
        FirstRunSetup.ONBOARDING_STEPS.forEachIndexed { index, step ->
            introduction.addView(LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                addView(TextView(this@MainActivity).apply {
                    text = "${index + 1}"
                    gravity = Gravity.CENTER
                    textSize = 15f
                    setTextColor(Color.rgb(8, 65, 156))
                    setTypeface(typeface, Typeface.BOLD)
                    background = solidShape(Color.WHITE, 18f)
                }, LinearLayout.LayoutParams(dp(34f), dp(34f)))
                addView(TextView(this@MainActivity).apply {
                    text = step
                    textSize = 17f
                    setTextColor(Color.WHITE)
                    setTypeface(typeface, Typeface.BOLD)
                }, LinearLayout.LayoutParams(-2, -2).apply { marginStart = dp(14f) })
            }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(14f) })
        }
        introduction.addView(TextView(this).apply {
            text = "VERSÃO ${BuildConfig.VERSION_NAME}  •  CONEXÃO SEGURA"
            textSize = 13f
            setTextColor(Color.rgb(186, 230, 253))
            letterSpacing = 0.06f
        }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(26f) })

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(38f), dp(34f), dp(38f), dp(34f))
            background = solidShape(Color.WHITE, 24f)
            elevation = dp(18f).toFloat()
        }
        card.addView(TextView(this).apply {
            text = "Ativar esta TV"
            textSize = 30f
            setTextColor(Color.rgb(12, 32, 68))
            setTypeface(typeface, Typeface.BOLD)
        })
        card.addView(TextView(this).apply {
            text = "Essas informações identificam o aparelho no mapa e na Central de Operações."
            textSize = 16f
            setTextColor(Color.rgb(71, 85, 105))
        }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(7f); bottomMargin = dp(18f) })

        val name = firstRunField("Nome da tela  •  ex.: TV Recepção")
        val location = firstRunField("Local ou endereço  •  ex.: Loja Centro")
        val updates = CheckBox(this).apply {
            text = "Atualizações automáticas"
            isChecked = FirstRunSetup.DEFAULT_AUTO_UPDATE
            textSize = 16f
            setTextColor(Color.rgb(12, 32, 68))
            buttonTintList = ColorStateList.valueOf(Color.rgb(8, 95, 218))
        }
        val updateHelp = TextView(this).apply {
            text = updateExplanation(true)
            textSize = 13f
            setTextColor(Color.rgb(100, 116, 139))
        }
        updates.setOnCheckedChangeListener { _, checked -> updateHelp.text = updateExplanation(checked) }
        val status = TextView(this).apply {
            textSize = 15f
            setTextColor(Color.rgb(190, 24, 93))
            gravity = Gravity.CENTER
        }
        val button = Button(this).apply {
            text = "ATIVAR E CONTINUAR"
            textSize = 17f
            setTextColor(Color.WHITE)
            setTypeface(typeface, Typeface.BOLD)
            letterSpacing = 0.04f
            backgroundTintList = ColorStateList.valueOf(Color.rgb(8, 95, 218))
            elevation = dp(8f).toFloat()
            minHeight = dp(58f)
            setOnFocusChangeListener { view, focused ->
                view.animate().scaleX(if (focused) 1.025f else 1f).scaleY(if (focused) 1.025f else 1f).setDuration(140).start()
            }
        }
        listOf(name, location, updates, updateHelp, button, status).forEach {
            card.addView(it, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(if (it === button) 20f else 11f) })
        }
        stage.addView(introduction, LinearLayout.LayoutParams(0, -1, 0.94f))
        stage.addView(card, LinearLayout.LayoutParams(0, -2, 1.06f))
        root.addView(stage, FrameLayout.LayoutParams(-1, -1, Gravity.CENTER))
        button.setOnClickListener {
            if (!FirstRunSetup.isValid(name.text.toString(), location.text.toString())) {
                status.text = "Preencha o nome da tela e o local."; return@setOnClickListener
            }
            button.isEnabled = false; status.text = "Ativando com segurança..."
            val generation = playbackSession.current()
            activate(name.text.toString().trim(), location.text.toString().trim(), updates.isChecked, generation) { result ->
                button.isEnabled = true
                if (result.isSuccess) {
                    if (preferences.contains("device_token")) showReady() else showPairing()
                } else status.text = result.exceptionOrNull()?.message ?: "Não foi possível ativar. Verifique a internet."
            }
        }
        showContent(root)
    }

    private fun updateExplanation(enabled: Boolean): String {
        val manager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        return when (UpdatePolicy.resolve(enabled, manager.isDeviceOwnerApp(packageName))) {
            UpdateMode.SILENT -> "Modo gerenciado: instalacao silenciosa habilitada para futuras versoes."
            UpdateMode.SYSTEM_CONFIRMATION -> "Atualizacoes automaticas ativadas. Em Android comum, o sistema podera pedir uma confirmacao final de seguranca."
            UpdateMode.MANUAL -> "Atualizacoes automaticas desativadas; o administrador sera avisado."
        }
    }

    private fun installationId(): String {
        val saved = preferences.getString("installation_id", null)
        if (saved != null) return saved
        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        return (androidId?.takeIf { it.isNotBlank() } ?: UUID.randomUUID().toString()).also { preferences.edit().putString("installation_id", it).apply() }
    }

    private fun activate(name: String, location: String, autoUpdate: Boolean, generation: Int, done: (Result<Unit>) -> Unit) = Thread {
        try {
            val payload = JSONObject().put("installationId", installationId()).put("name", name).put("address", location)
            val response = request("api/devices/activate", payload)
            val deviceToken = response.optString("deviceToken").takeIf { it.isNotBlank() }
            val activationToken = response.optString("activationToken").takeIf { it.isNotBlank() }
            if (FirstRunSetup.destination(deviceToken, activationToken) == ActivationDestination.ERROR) {
                throw IllegalStateException("O servidor nao devolveu a credencial da TV.")
            }
            if (!playbackSession.accepts(generation)) return@Thread
            preferences.edit().putString("device_name", name).putString("location", location).putBoolean("auto_update", autoUpdate)
                .putString("link_code", response.optString("linkCode"))
                .apply {
                    if (deviceToken != null) putString("device_token", deviceToken).remove("activation_token")
                    if (activationToken != null) putString("activation_token", activationToken)
                }.apply()
            mainHandler.post { if (playbackSession.accepts(generation)) done(Result.success(Unit)) }
        } catch (error: Exception) { mainHandler.post { if (playbackSession.accepts(generation)) done(Result.failure(error)) } }
    }.start()

    private fun showPairing() {
        val root = container()
        root.addView(label("ANGEL MIDIA PLAY", 32f)); root.addView(label(preferences.getString("device_name", "Esta TV") ?: "Esta TV", 25f))
        root.addView(label(preferences.getString("location", "") ?: "", 18f)); root.addView(label("Codigo para vincular no painel", 18f))
        root.addView(label(preferences.getString("link_code", "------") ?: "------", 42f))
        val status = label("Aguardando aprovacao do administrador...", 18f); root.addView(status)
        showContent(root); claimWhenApproved(status, playbackSession.current())
    }

    private fun showReady(): Unit {
        syncAndPlay(advanceGeneration())
    }

    private fun syncAndPlay(generation: Int): Unit { Thread {
        try {
            val token = preferences.getString("device_token", null) ?: return@Thread
            val state = getJson("api/device/sync", token)
            if (!playbackSession.accepts(generation)) return@Thread
            val emergency = state.optJSONObject("emergency")
            val remoteCommand = state.optJSONObject("remoteCommand")
            val schedule = state.optJSONObject("schedule")
            val items = schedule?.optJSONArray("items") ?: JSONArray()
            val loop = PlaybackPolicy.shouldLoop(schedule?.let { if (it.has("loop")) it.optBoolean("loop") else null })
            // Old servers did not expose version. The manifest itself is a stable fallback
            // so a changed legacy schedule can leave the completed state.
            val version = schedule?.optString("version")?.takeIf { it.isNotBlank() } ?: schedule?.toString()
            if (schedule != null) preferences.edit().putString(PREF_LAST_SCHEDULE, schedule.toString()).apply()
            mainHandler.post {
                if (!playbackSession.accepts(generation)) return@post
                if (remoteCommand != null && handleRemoteCommand(remoteCommand, generation)) return@post
                offlinePlayback = false
                connectionRecovered = false
                if (scheduleVersion != version) {
                    scheduleIndex = 0
                    scheduleExhausted = false
                }
                scheduleVersion = version
                scheduleItems = items
                manifestLoop = loop
                restorePlaybackCheckpoint(items)
                when (PlaybackPolicy.source(emergency != null, items.length())) {
                    PlaybackSource.EMERGENCY -> playEmergency(emergency!!, generation)
                    PlaybackSource.SCHEDULE -> {
                        if (!loop && scheduleExhausted) {
                            showScheduleComplete(generation)
                            return@post
                        }
                        if (scheduleIndex >= items.length()) scheduleIndex = 0
                        scheduleEmergencyCheck(generation, 0)
                        playMedia(items.getJSONObject(scheduleIndex), false, generation)
                    }
                    PlaybackSource.IDLE -> showIdle(generation)
                }
            }
        } catch (_: Exception) {
            mainHandler.post {
                if (!playbackSession.accepts(generation)) return@post
                if (!startOfflinePlayback(generation)) showIdle(generation, "Sem internet e sem mídia salva. Tentando novamente...")
            }
        }
    }.start() }

    private fun startOfflinePlayback(generation: Int): Boolean {
        if (!playbackSession.accepts(generation)) return false
        val saved = preferences.getString(PREF_LAST_SCHEDULE, null)?.let { runCatching { JSONObject(it) }.getOrNull() } ?: return false
        val sourceItems = saved.optJSONArray("items") ?: return false
        val available = OfflinePlaybackPolicy.availableIndexes((0 until sourceItems.length()).map { index ->
            sourceItems.optJSONObject(index)?.let(::cachedMediaFile)?.let { it.exists() && it.length() > 0 } == true
        })
        if (available.isEmpty()) return false

        val currentAsset = currentPlaybackAssetId
        val currentOriginalIndex = (0 until sourceItems.length()).firstOrNull {
            sourceItems.optJSONObject(it)?.optString("assetId") == currentAsset
        } ?: scheduleIndex
        val selectedOriginalIndex = OfflinePlaybackPolicy.startIndex(currentOriginalIndex, available) ?: return false
        val cachedItems = JSONArray()
        available.forEach { index -> cachedItems.put(sourceItems.getJSONObject(index)) }

        scheduleItems = cachedItems
        scheduleIndex = available.indexOf(selectedOriginalIndex).coerceAtLeast(0)
        manifestLoop = true
        scheduleExhausted = false
        offlinePlayback = true
        connectionRecovered = false
        scheduleVersion = saved.optString("version").takeIf { it.isNotBlank() } ?: saved.toString()
        restorePlaybackCheckpoint(cachedItems)
        scheduleEmergencyCheck(generation, OFFLINE_SYNC_INTERVAL_MS)
        playMedia(cachedItems.getJSONObject(scheduleIndex), false, generation)
        return true
    }

    private fun cachedMediaFile(item: JSONObject): File {
        val extension = if (item.optString("type").startsWith("video/")) ".mp4" else ".img"
        return File(cacheDir, "${item.optString("assetId")}$extension")
    }

    private fun savePlaybackCheckpoint() {
        val assetId = currentPlaybackAssetId?.takeIf { it.isNotBlank() } ?: return
        val positionMs = currentPlaybackVideo?.currentPosition?.coerceAtLeast(0) ?: 0
        val checkpoint = JSONObject()
            .put("assetId", assetId)
            .put("scheduleIndex", scheduleIndex)
            .put("positionMs", positionMs)
            .put("savedAtEpochMs", System.currentTimeMillis())
        preferences.edit().putString(PREF_PLAYBACK_CHECKPOINT, checkpoint.toString()).apply()
    }

    private fun clearPlaybackCheckpoint() {
        mainHandler.removeCallbacks(checkpointRunnable)
        currentPlaybackAssetId = null
        currentPlaybackVideo = null
        currentPlaybackGeneration = -1
        pendingResumeAssetId = null
        pendingResumePositionMs = 0
        preferences.edit().remove(PREF_PLAYBACK_CHECKPOINT).apply()
    }

    private fun restorePlaybackCheckpoint(items: JSONArray) {
        if (resumeChecked || items.length() == 0) return
        resumeChecked = true
        val saved = preferences.getString(PREF_PLAYBACK_CHECKPOINT, null)
            ?.let { runCatching { JSONObject(it) }.getOrNull() }
        val checkpoint = saved?.let {
            PlaybackCheckpoint(
                assetId = it.optString("assetId"),
                scheduleIndex = it.optInt("scheduleIndex", 0),
                positionMs = it.optInt("positionMs", 0),
                savedAtEpochMs = it.optLong("savedAtEpochMs", 0L),
            )
        }
        val assetIds = (0 until items.length()).map { items.optJSONObject(it)?.optString("assetId").orEmpty() }
        val decision = PlaybackResumePolicy.restore(checkpoint, assetIds, System.currentTimeMillis())
        if (decision == null) {
            preferences.edit().remove(PREF_PLAYBACK_CHECKPOINT).apply()
            return
        }
        scheduleIndex = decision.index
        pendingResumeAssetId = assetIds[decision.index]
        pendingResumePositionMs = decision.positionMs
    }

    private fun playEmergency(item: JSONObject, generation: Int): Unit {
        if (item.optString("mode") == "message") {
            val root = container().apply { setBackgroundColor(Color.rgb(160, 0, 28)) }
            root.addView(label("⚠ ALERTA GERAL ANGEL MÍDIA", 28f))
            root.addView(label(item.optString("title", "ATENÇÃO"), 54f))
            root.addView(label(item.optString("message"), 32f))
            showContent(root)
            mainHandler.postDelayed({ if (playbackSession.accepts(generation)) syncAndPlay(generation) }, 5_000)
        } else playMedia(emergencyMediaItem(item), true, generation)
    }

    private fun emergencyMediaItem(item: JSONObject): JSONObject {
        val presentation = PlaybackPolicy.apiPresentation(
            item.opt("fit_mode") as? String, PlaybackPolicy.finiteNumber(item.opt("focal_x")),
            PlaybackPolicy.finiteNumber(item.opt("focal_y")), PlaybackPolicy.finiteNumber(item.opt("zoom")),
            PlaybackPolicy.finiteNumber(item.opt("rotation")), item.opt("background_color") as? String,
        )
        val presentationJson = JSONObject().put("fitMode", presentation.fit).put("focalX", presentation.focalX)
            .put("focalY", presentation.focalY).put("zoom", presentation.zoom).put("rotation", presentation.rotation)
            .put("backgroundColor", presentation.backgroundColor)
        val playbackJson = JSONObject()
        if (item.has("trim_start_seconds")) playbackJson.put("trimStartSeconds", item.opt("trim_start_seconds"))
        if (item.has("trim_end_seconds")) playbackJson.put("trimEndSeconds", item.opt("trim_end_seconds"))
        if (item.has("volume")) playbackJson.put("volume", item.opt("volume"))
        return JSONObject().put("assetId", item.optString("asset_id")).put("type", item.optString("content_type"))
            .put("durationSeconds", item.optInt("duration_seconds", 10)).put("presentation", presentationJson)
            .put("playback", playbackJson)
    }

    private fun playMedia(item: JSONObject, emergency: Boolean, generation: Int) {
        updateTelemetryForDownload(item.optString("assetId"))
        Thread {
        try {
            val token = preferences.getString("device_token", null) ?: return@Thread
            val assetId = item.getString("assetId")
            val type = item.optString("type")
            val presentation = item.optJSONObject("presentation") ?: JSONObject()
            val file = downloadMedia(assetId, token, type, generation)
            mainHandler.post {
                if (!playbackSession.accepts(generation)) return@post
                if (type.startsWith("video/")) {
                    val playbackJson = item.optJSONObject("playback") ?: JSONObject()
                    val playback = PlaybackPolicy.videoPlayback(
                        PlaybackPolicy.finiteNumber(playbackJson.opt("trimStartSeconds")),
                        PlaybackPolicy.finiteNumber(playbackJson.opt("trimEndSeconds")),
                        PlaybackPolicy.finiteNumber(playbackJson.opt("volume")),
                    )
                    val stage = FrameLayout(this).apply { setBackgroundColor(presentationColor(presentation)) }
                    val video = VideoView(this).apply {
                        setVideoPath(file.absolutePath)
                        setOnPreparedListener { player ->
                            if (!playbackSession.accepts(generation) || !playbackSlot.isCurrent(this)) {
                                player.release()
                                return@setOnPreparedListener
                            }
                            applyPresentation(this, stage, player.videoWidth, player.videoHeight, presentation)
                            player.isLooping = emergency && playback.endMs == null
                            player.setVolume(playback.volume, playback.volume)
                            val resumeAt = if (!emergency && pendingResumeAssetId == assetId) {
                                PlaybackResumePolicy.seekPosition(playback.startMs, pendingResumePositionMs, playback.endMs)
                            } else playback.startMs
                            currentPlaybackAssetId = assetId.takeUnless { emergency }
                            currentPlaybackVideo = this.takeUnless { emergency }
                            currentPlaybackGeneration = generation.takeUnless { emergency } ?: -1
                            pendingResumeAssetId = null
                            pendingResumePositionMs = 0
                            seekTo(resumeAt)
                            start()
                            if (!emergency) {
                                mainHandler.removeCallbacks(checkpointRunnable)
                                checkpointRunnable.run()
                            }
                            updateTelemetryForPlayback(assetId)
                            if (!emergency) prefetchNext(generation)
                            if (playback.endMs != null) monitorTrimEnd(this, assetId, emergency, generation, playback, item)
                            if (!emergency) PlaybackPolicy.videoWatchdogMs(resumeAt, playback.endMs, player.duration)?.let { timeout ->
                                mainHandler.postDelayed({ finishMedia(assetId, false, generation, item) }, timeout)
                            }
                        }
                        setOnCompletionListener {
                            if (PlaybackPolicy.trimEndAction(emergency) == TrimEndAction.RESTART && playback.endMs != null) {
                                seekTo(playback.startMs); start()
                            } else finishMedia(assetId, emergency, generation, item)
                        }
                        setOnErrorListener { _, what, extra ->
                            failMedia(assetId, emergency, generation, "video_error_$what/$extra", item)
                            true
                        }
                    }
                    stage.addView(video, FrameLayout.LayoutParams(-1, -1, Gravity.CENTER))
                    applyDynamicInsertion(stage, item, emergency)
                    if (!emergency) addOfflineIndicator(stage)
                    showContent(stage, video); video.start()
                    if (emergency) mainHandler.postDelayed({ if (playbackSession.accepts(generation)) syncAndPlay(generation) }, 5_000)
                } else {
                    val stage = FrameLayout(this).apply { setBackgroundColor(presentationColor(presentation)) }
                    val bitmap = BitmapFactory.decodeFile(file.absolutePath)
                    if (bitmap == null) {
                        failMedia(assetId, emergency, generation, "image_decode_failed", item)
                        return@post
                    }
                    val image = ImageView(this).apply { scaleType = ImageView.ScaleType.FIT_XY; setImageBitmap(bitmap) }
                    stage.addView(image, FrameLayout.LayoutParams(-1, -1, Gravity.CENTER))
                    applyDynamicInsertion(stage, item, emergency)
                    if (!emergency) addOfflineIndicator(stage)
                    showContent(stage); stage.post { if (playbackSession.accepts(generation)) applyPresentation(image, stage, bitmap.width, bitmap.height, presentation) }
                    if (!emergency) {
                        currentPlaybackAssetId = assetId
                        currentPlaybackVideo = null
                        currentPlaybackGeneration = generation
                        pendingResumeAssetId = null
                        pendingResumePositionMs = 0
                        savePlaybackCheckpoint()
                    }
                    updateTelemetryForPlayback(assetId)
                    if (!emergency) prefetchNext(generation)
                    mainHandler.postDelayed({ finishMedia(assetId, emergency, generation, item) }, if (emergency) 5_000 else PlaybackPolicy.imageDurationMs(item.optInt("durationSeconds").takeIf { item.has("durationSeconds") }))
                }
            }
        } catch (error: Exception) {
            val assetId = item.optString("assetId")
            mainHandler.post { failMedia(assetId, emergency, generation, error.message ?: "media_load_failed", item) }
        }
        }.start()
    }

    private fun dp(value: Float): Int = (value * resources.displayMetrics.density).toInt()

    private fun applyDynamicInsertion(stage: FrameLayout, item: JSONObject, emergency: Boolean) {
        if (emergency || item.optJSONObject("insertion") == null) return
        val effectJson = item.optJSONObject("visualEffect") ?: JSONObject()
        val effect = TvVisualEffects.resolve(effectJson.optString("transition"), effectJson.optString("intensity"))
        if (effectJson.optBoolean("overlay", false)) {
            val insertion = item.optJSONObject("insertion") ?: JSONObject()
            val kind = insertion.optString("kind")
            TvVisualEffects.insertionLabel(kind)?.let { text ->
                val color = when (kind) {
                    "news" -> Color.rgb(8, 145, 178)
                    "meme" -> Color.rgb(234, 88, 12)
                    else -> Color.rgb(37, 99, 235)
                }
                val badge = TextView(this).apply {
                    this.text = text
                    textSize = 13f
                    setTextColor(Color.WHITE)
                    setTypeface(typeface, Typeface.BOLD)
                    letterSpacing = .08f
                    setPadding(dp(14f), dp(9f), dp(14f), dp(9f))
                    background = GradientDrawable().apply { setColor(color); cornerRadius = dp(9f).toFloat() }
                    elevation = dp(8f).toFloat()
                }
                stage.addView(badge, FrameLayout.LayoutParams(-2, -2, Gravity.TOP or Gravity.END).apply {
                    topMargin = dp(24f); marginEnd = dp(24f)
                })
            }
        }
        addDynamicTicker(stage, effectJson)
        when (effect.transition) {
            "fade" -> stage.alpha = .15f
            "slide" -> { stage.alpha = .25f; stage.translationX = dp(effect.startTranslationDp).toFloat() }
            "zoom" -> { stage.alpha = .25f; stage.scaleX = effect.startScale; stage.scaleY = effect.startScale }
            "wipe" -> { stage.alpha = .3f; stage.pivotX = 0f; stage.scaleX = .08f }
            "rise" -> { stage.alpha = .25f; stage.translationY = dp(effect.startTranslationYDp).toFloat() }
            "flip" -> { stage.alpha = .2f; stage.rotationY = effect.startRotationY }
            "blur" -> {
                stage.alpha = .25f
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) stage.setRenderEffect(RenderEffect.createBlurEffect(22f, 22f, Shader.TileMode.CLAMP))
            }
            "impact" -> { stage.alpha = .25f; stage.scaleX = .82f; stage.scaleY = .82f }
            else -> return
        }
        stage.post {
            stage.animate().alpha(1f).translationX(0f).translationY(0f).rotationY(0f).scaleX(1f).scaleY(1f)
                .setDuration(effect.durationMs)
                .setInterpolator(if (effect.overshoot) OvershootInterpolator(.85f) else DecelerateInterpolator())
                .withEndAction { if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && effect.usesBlur) stage.setRenderEffect(null) }
                .start()
        }
    }

    private fun addOfflineIndicator(stage: FrameLayout) {
        if (!offlinePlayback) return
        val badge = TextView(this).apply {
            text = "MODO OFFLINE  •  EXIBINDO MÍDIA SALVA"
            textSize = 12f
            setTextColor(Color.WHITE)
            setTypeface(typeface, Typeface.BOLD)
            letterSpacing = .08f
            setPadding(dp(14f), dp(9f), dp(14f), dp(9f))
            background = solidShape(Color.argb(220, 15, 23, 42), 10f, Color.argb(120, 255, 255, 255), 1f)
        }
        stage.addView(badge, FrameLayout.LayoutParams(-2, -2, Gravity.TOP or Gravity.END).apply {
            topMargin = dp(22f)
            marginEnd = dp(22f)
        })
    }

    private fun addDynamicTicker(stage: FrameLayout, effectJson: JSONObject) {
        val tickerJson = effectJson.optJSONObject("ticker") ?: return
        if (!tickerJson.optBoolean("enabled", false)) return
        val headline = tickerJson.optString("text").trim()
        if (headline.isEmpty()) return
        val spec = TvVisualEffects.ticker(tickerJson.optString("speed"), tickerJson.optString("position"))
        val barHeight = dp(58f)
        val bar = FrameLayout(this).apply {
            background = GradientDrawable().apply { setColor(Color.rgb(7, 35, 78)) }
            elevation = dp(14f).toFloat()
        }
        val source = TextView(this).apply {
            text = tickerJson.optString("source", "ANGEL MÍDIA").trim().uppercase().take(22)
            textSize = 14f
            setTextColor(Color.rgb(8, 35, 74))
            setTypeface(typeface, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(dp(16f), 0, dp(16f), 0)
            background = GradientDrawable().apply { setColor(Color.rgb(56, 189, 248)) }
        }
        val ticker = TextView(this).apply {
            text = headline
            textSize = 21f
            setTextColor(Color.WHITE)
            setTypeface(typeface, Typeface.BOLD)
            gravity = Gravity.CENTER_VERTICAL
            setSingleLine(true)
        }
        bar.addView(ticker, FrameLayout.LayoutParams(-2, barHeight, Gravity.CENTER_VERTICAL).apply { leftMargin = dp(154f) })
        bar.addView(source, FrameLayout.LayoutParams(dp(154f), barHeight, Gravity.START))
        val tickerGravity = if (spec.position == "top") Gravity.TOP else Gravity.BOTTOM
        stage.addView(bar, FrameLayout.LayoutParams(-1, barHeight, tickerGravity))
        bar.post {
            val start = bar.width.toFloat()
            val finish = -ticker.width.toFloat()
            ObjectAnimator.ofFloat(ticker, View.TRANSLATION_X, start, finish).apply {
                duration = spec.durationMs
                repeatCount = ValueAnimator.INFINITE
                interpolator = LinearInterpolator()
                start()
            }
        }

        val qrJson = effectJson.optJSONObject("qrCode") ?: return
        if (!qrJson.optBoolean("enabled", false)) return
        val target = TvVisualEffects.safeCzsUrl(qrJson.optString("url")) ?: return
        val qrPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(9f), dp(9f), dp(9f), dp(8f))
            background = GradientDrawable().apply { setColor(Color.WHITE); cornerRadius = dp(12f).toFloat() }
            elevation = dp(16f).toFloat()
        }
        qrPanel.addView(ImageView(this).apply { setImageBitmap(buildQrCode(target, dp(112f))) }, LinearLayout.LayoutParams(dp(112f), dp(112f)))
        qrPanel.addView(TextView(this).apply {
            text = "APONTE A CÂMERA"
            textSize = 10f
            setTextColor(Color.rgb(7, 35, 78))
            setTypeface(typeface, Typeface.BOLD)
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(-1, dp(24f)))
        val qrGravity = (if (spec.position == "top") Gravity.BOTTOM else Gravity.TOP) or Gravity.END
        stage.addView(qrPanel, FrameLayout.LayoutParams(-2, -2, qrGravity).apply { topMargin = dp(24f); bottomMargin = dp(24f); marginEnd = dp(24f) })
    }

    private fun buildQrCode(value: String, size: Int): Bitmap {
        val matrix = QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, size, size)
        val pixels = IntArray(size * size)
        for (y in 0 until size) for (x in 0 until size) pixels[y * size + x] = if (matrix[x, y]) Color.BLACK else Color.WHITE
        return Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888).apply { setPixels(pixels, 0, size, 0, 0, size, size) }
    }

    private fun presentationColor(presentation: JSONObject): Int = runCatching {
        Color.parseColor(PresentationPolicy.color(presentationSpec(presentation)))
    }.getOrDefault(Color.BLACK)

    private fun presentationSpec(json: JSONObject) = PresentationSpec(
        fit = json.optString("fitMode", "contain").takeIf { it in setOf("contain", "cover", "fill") } ?: "contain",
        focalX = (PlaybackPolicy.finiteNumber(json.opt("focalX")) ?: 50.0).toFloat(),
        focalY = (PlaybackPolicy.finiteNumber(json.opt("focalY")) ?: 50.0).toFloat(),
        zoom = (PlaybackPolicy.finiteNumber(json.opt("zoom")) ?: 1.0).toFloat(),
        rotation = (PlaybackPolicy.finiteNumber(json.opt("rotation")) ?: 0.0).toInt().takeIf { it in setOf(0, 90, 180, 270) } ?: 0,
        backgroundColor = json.opt("backgroundColor") as? String ?: "#000000",
    )

    private fun applyPresentation(view: View, stage: FrameLayout, mediaWidth: Int, mediaHeight: Int, json: JSONObject) {
        val layout = PresentationPolicy.layout(stage.width, stage.height, mediaWidth, mediaHeight, presentationSpec(json))
        view.layoutParams = FrameLayout.LayoutParams(layout.width, layout.height, Gravity.CENTER)
        view.translationX = layout.translationX; view.translationY = layout.translationY
        view.scaleX = layout.zoom; view.scaleY = layout.zoom; view.rotation = layout.rotation
    }

    private fun finishMedia(assetId: String, emergency: Boolean, generation: Int, item: JSONObject? = null): Unit {
        if (!playbackSession.accepts(generation)) return
        updateTelemetryForIdle()
        if (emergency) {
            syncAndPlay(advanceGeneration())
            return
        }

        reportPlaybackEvent(assetId, "completed", item = item)
        consecutiveFailures = 0
        recoveryAttempt = 0
        clearPlaybackCheckpoint()
        val next = nextPlayableScheduleIndex()
        if (next == null) scheduleExhausted = true else scheduleIndex = next
        val nextGeneration = advanceGeneration()
        when {
            scheduleExhausted -> showScheduleComplete(nextGeneration)
            connectionRecovered -> syncAndPlay(nextGeneration)
            else -> {
                scheduleEmergencyCheck(nextGeneration, if (offlinePlayback) OFFLINE_SYNC_INTERVAL_MS else 0)
                playMedia(scheduleItems.getJSONObject(scheduleIndex), false, nextGeneration)
            }
        }
    }

    private fun failMedia(assetId: String, emergency: Boolean, generation: Int, reason: String, item: JSONObject? = null) {
        if (!playbackSession.accepts(generation)) return
        updateTelemetryForFailure(assetId, reason)
        reportPlaybackEvent(assetId, "error", reason, item)
        clearPlaybackCheckpoint()
        val next = if (emergency) null else nextPlayableScheduleIndex()
        if (next != null) scheduleIndex = next
        val nextGeneration = advanceGeneration()
        if (emergency) {
            syncAndPlay(nextGeneration)
            return
        }
        consecutiveFailures += 1
        if (next == null || PlaybackPolicy.completedFailedCycle(consecutiveFailures, scheduleItems.length())) {
            consecutiveFailures = 0
            recoveryAttempt += 1
            showRecovery(nextGeneration)
        } else if (connectionRecovered) {
            syncAndPlay(nextGeneration)
        } else {
            scheduleEmergencyCheck(nextGeneration, if (offlinePlayback) OFFLINE_SYNC_INTERVAL_MS else 0)
            playMedia(scheduleItems.getJSONObject(scheduleIndex), false, nextGeneration)
        }
    }

    private fun nextPlayableScheduleIndex(): Int? {
        if (!offlinePlayback) return PlaybackPolicy.nextIndexOrNull(scheduleIndex, scheduleItems.length(), manifestLoop)
        val available = OfflinePlaybackPolicy.availableIndexes((0 until scheduleItems.length()).map { index ->
            scheduleItems.optJSONObject(index)?.let(::cachedMediaFile)?.let { it.exists() && it.length() > 0 } == true
        })
        return OfflinePlaybackPolicy.nextIndex(scheduleIndex, available)
    }

    private fun showRecovery(generation: Int) {
        if (!playbackSession.accepts(generation)) return
        val root = container()
        root.addView(label("ANGEL MIDIA PLAY", 34f))
        root.addView(label("Estamos recuperando a reproducao", 25f))
        root.addView(label("As midias serao verificadas novamente em instantes.", 18f))
        showContent(root)
        val delay = PlaybackPolicy.retryBackoffMs(recoveryAttempt)
        scheduleEmergencyCheck(generation, 0)
        mainHandler.postDelayed({
            if (playbackSession.accepts(generation)) {
                val nextGeneration = advanceGeneration()
                if (!offlinePlayback || !startOfflinePlayback(nextGeneration)) syncAndPlay(nextGeneration)
            }
        }, delay)
    }

    private fun showScheduleComplete(generation: Int) {
        if (!playbackSession.accepts(generation)) return
        val root = container()
        root.addView(label("ANGEL MIDIA PLAY", 34f))
        root.addView(label("Programacao concluida", 25f))
        root.addView(label("Aguardando uma nova programacao ou aviso de emergencia.", 18f))
        showContent(root)
        scheduleEmergencyCheck(generation, 0)
        mainHandler.postDelayed({
            if (playbackSession.accepts(generation)) {
                syncAndPlay(advanceGeneration())
            }
        }, 5_000)
    }

    private fun prefetchNext(generation: Int) {
        if (!playbackSession.accepts(generation) || offlinePlayback || scheduleItems.length() == 0) return
        val next = PlaybackPolicy.nextIndex(scheduleIndex, scheduleItems.length())
        val item = scheduleItems.optJSONObject(next) ?: return
        val token = preferences.getString("device_token", null) ?: return
        Thread {
            runCatching { downloadMedia(item.getString("assetId"), token, item.optString("type"), generation) }
        }.start()
    }

    private fun monitorTrimEnd(video: VideoView, assetId: String, emergency: Boolean, generation: Int, playback: VideoPlayback, item: JSONObject) {
        mainHandler.postDelayed(object : Runnable {
            override fun run() {
                if (!playbackSession.accepts(generation)) return
                if (PlaybackPolicy.reachedTrimEnd(video.currentPosition, playback.endMs)) {
                    if (PlaybackPolicy.trimEndAction(emergency) == TrimEndAction.RESTART) {
                        video.seekTo(playback.startMs); video.start(); mainHandler.postDelayed(this, 100)
                    } else finishMedia(assetId, false, generation, item)
                } else mainHandler.postDelayed(this, 100)
            }
        }, 100)
    }

    private fun scheduleEmergencyCheck(generation: Int, delayMs: Long = 1_000): Unit {
        mainHandler.postDelayed({
            if (!playbackSession.accepts(generation)) return@postDelayed
            Thread {
                if (!playbackSession.accepts(generation)) return@Thread
                val token = preferences.getString("device_token", null)
                val state = token?.let { runCatching { getJson("api/device/sync", it) }.getOrNull() }
                val emergency = state?.optJSONObject("emergency")
                val remoteCommand = state?.optJSONObject("remoteCommand")
                val incomingSchedule = state?.optJSONObject("schedule")
                val incomingVersion = incomingSchedule?.optString("version")?.takeIf { it.isNotBlank() }
                    ?: incomingSchedule?.toString()
                mainHandler.post {
                    if (!playbackSession.accepts(generation)) return@post
                    if (state == null) {
                        offlinePlayback = true
                        connectionRecovered = false
                    } else if (offlinePlayback || incomingVersion != scheduleVersion) {
                        connectionRecovered = true
                    }
                    if (remoteCommand != null && handleRemoteCommand(remoteCommand, generation)) return@post
                    if (emergency != null && PlaybackPolicy.shouldInterruptForEmergency(true, true)) {
                        playEmergency(emergency, advanceGeneration())
                    } else scheduleEmergencyCheck(generation, if (offlinePlayback && !connectionRecovered) OFFLINE_SYNC_INTERVAL_MS else 1_000)
                }
            }.start()
        }, delayMs)
    }

    private fun startTelemetryLoop() {
        mainHandler.removeCallbacks(telemetryRunnable)
        telemetryRunnable.run()
    }

    private fun updateTelemetryForDownload(assetId: String) {
        currentTelemetryAssetId = apiUuidOrNull(assetId)
        playbackStartedAt = null
        telemetryDownloadState = "downloading"
        telemetryErrorMessage = null
        sendTelemetryAsync()
    }

    private fun updateTelemetryForPlayback(assetId: String) {
        currentTelemetryAssetId = apiUuidOrNull(assetId)
        playbackStartedAt = java.time.Instant.now().toString()
        telemetryDownloadState = "ready"
        telemetryErrorMessage = null
        sendTelemetryAsync()
    }

    private fun updateTelemetryForFailure(assetId: String, reason: String) {
        currentTelemetryAssetId = apiUuidOrNull(assetId)
        telemetryDownloadState = "failed"
        telemetryErrorMessage = reason.take(1_000)
        sendTelemetryAsync()
    }

    private fun updateTelemetryForIdle() {
        currentTelemetryAssetId = null
        playbackStartedAt = null
        telemetryDownloadState = "idle"
        telemetryErrorMessage = null
        sendTelemetryAsync()
    }

    private fun sendTelemetryAsync() {
        if (!preferences.contains("device_token")) return
        val snapshot = TelemetrySnapshot(
            currentAssetId = currentTelemetryAssetId,
            nextAssetId = nextTelemetryAssetId(),
            playlistPosition = scheduleIndex.coerceAtLeast(0),
            playbackStartedAt = playbackStartedAt,
            downloadState = telemetryDownloadState,
            errorMessage = telemetryErrorMessage,
            freeStorageBytes = runCatching { StatFs(cacheDir.absolutePath).availableBytes.coerceAtLeast(0L) }.getOrDefault(0L),
            appVersion = BuildConfig.VERSION_NAME.take(40),
        )
        telemetryQueue.enqueue(snapshot)
    }

    private fun nextTelemetryAssetId(): String? {
        if (scheduleItems.length() == 0) return null
        val currentIndex = scheduleIndex.coerceIn(0, scheduleItems.length() - 1)
        val nextIndex = PlaybackPolicy.nextIndexOrNull(currentIndex, scheduleItems.length(), manifestLoop) ?: return null
        return apiUuidOrNull(scheduleItems.optJSONObject(nextIndex)?.optString("assetId"))
    }

    private fun apiUuidOrNull(value: String?): String? = value
        ?.takeIf { it.isNotBlank() }
        ?.takeIf { runCatching { UUID.fromString(it) }.isSuccess }

    private fun handleRemoteCommand(commandJson: JSONObject, generation: Int): Boolean {
        if (!playbackSession.accepts(generation)) return false
        val command = DeviceRemoteCommand(
            id = commandJson.optString("id").trim(),
            type = DeviceCommandPolicy.resolveType(
                commandJson.optString("commandType"),
                commandJson.optString("type"),
            ),
            leaseToken = commandJson.optString("leaseToken").trim(),
        )
        return when (val decision = DeviceCommandPolicy.decide(command, commandJournalSnapshot().resultFor(command.id))) {
            is DeviceCommandDecision.Execute -> {
                val execution = DeviceCommandPolicy.executeAfterDurableReservation(
                    reserve = { mutateCommandJournal { it.prepare(decision.commandId) } },
                    execute = {
                        val mustRestartPlayback = decision.action != DeviceCommandAction.REFRESH_SYNC
                        val nextGeneration = if (mustRestartPlayback) advanceGeneration() else generation
                        val ack = DeviceCommandPolicy.ackAfterExecution(
                            decision.commandId,
                            decision.leaseToken,
                            executeDeviceCommand(decision.action),
                        )
                        Triple(mustRestartPlayback, nextGeneration, ack)
                    },
                ) ?: return false
                val (mustRestartPlayback, nextGeneration, ack) = execution
                if (mutateCommandJournal { it.complete(ack) }) drainPendingCommandAcks()
                if (mustRestartPlayback) syncAndPlay(nextGeneration)
                mustRestartPlayback
            }
            is DeviceCommandDecision.Acknowledge -> {
                if (mutateCommandJournal { it.enqueue(decision.ack) }) drainPendingCommandAcks()
                false
            }
            is DeviceCommandDecision.Reject -> {
                if (decision.ack.commandId.isNotBlank() && decision.ack.leaseToken.isNotBlank()) {
                    if (mutateCommandJournal { it.complete(decision.ack) }) drainPendingCommandAcks()
                }
                false
            }
        }
    }

    private fun executeDeviceCommand(action: DeviceCommandAction): String? = when (action) {
        DeviceCommandAction.REFRESH_SYNC,
        DeviceCommandAction.RESTART_PLAYER -> null
        DeviceCommandAction.CLEAR_MEDIA_CACHE -> if (clearPlayerMediaCache()) null else "cache_delete_failed"
    }

    private fun clearPlayerMediaCache(): Boolean {
        return DeviceCommandPolicy.clearMediaCache(cacheDir.listFiles())
    }

    private fun legacyPendingCommandAck(): PendingCommandAck? {
        val commandId = preferences.getString(PREF_PENDING_ACK_ID, null)?.takeIf { it.isNotBlank() } ?: return null
        val leaseToken = preferences.getString(PREF_PENDING_ACK_LEASE_TOKEN, null)?.takeIf { it.isNotBlank() } ?: return null
        val outcome = preferences.getString(PREF_PENDING_ACK_OUTCOME, null)?.takeIf { it == "succeeded" || it == "failed" } ?: return null
        return PendingCommandAck(commandId, leaseToken, outcome, preferences.getString(PREF_PENDING_ACK_ERROR, null))
    }

    @Synchronized
    private fun commandJournalSnapshot(): DeviceCommandJournal = loadCommandJournal()

    @Synchronized
    private fun mutateCommandJournal(transform: (DeviceCommandJournal) -> DeviceCommandJournal): Boolean {
        val updated = transform(loadCommandJournal())
        return preferences.edit()
            .putString(PREF_COMMAND_JOURNAL, DeviceCommandJournalCodec.encode(updated))
            .remove(PREF_APPLIED_COMMAND_IDS)
            .remove(PREF_PENDING_ACK_ID)
            .remove(PREF_PENDING_ACK_LEASE_TOKEN)
            .remove(PREF_PENDING_ACK_OUTCOME)
            .remove(PREF_PENDING_ACK_ERROR)
            .commit()
    }

    private fun loadCommandJournal(): DeviceCommandJournal {
        preferences.getString(PREF_COMMAND_JOURNAL, null)?.let {
            return DeviceCommandJournalCodec.decode(it)
        }
        val applied = preferences.getStringSet(PREF_APPLIED_COMMAND_IDS, emptySet()).orEmpty()
            .toList()
            .takeLast(DeviceCommandJournal.DEFAULT_MAX_APPLIED)
            .map { AppliedCommandResult(it, "succeeded") }
        val migrated = DeviceCommandJournal(appliedResults = applied)
        return legacyPendingCommandAck()?.let { migrated.complete(it) } ?: migrated
    }

    private fun drainPendingCommandAcks() {
        if (!ackDrainRunning.compareAndSet(false, true)) return
        Thread {
            val attempted = mutableSetOf<Pair<String, String>>()
            try {
                while (true) {
                    val ack = commandJournalSnapshot().pendingAcks.firstOrNull {
                        (it.commandId to it.leaseToken) !in attempted
                    } ?: break
                    attempted += ack.commandId to ack.leaseToken
                    val token = preferences.getString("device_token", null) ?: break
                    val sent = runCatching {
                        requestNoContent(
                            "POST",
                            "api/device/remote-commands/${ack.commandId}/ack",
                            JSONObject(ack.toPayload()),
                            token,
                        )
                    }.isSuccess
                    if (sent) {
                        mutateCommandJournal { it.removePending(ack.commandId, ack.leaseToken) }
                    }
                }
            } finally {
                ackDrainRunning.set(false)
                val unattempted = commandJournalSnapshot().pendingAcks.any {
                    (it.commandId to it.leaseToken) !in attempted
                }
                if (unattempted) drainPendingCommandAcks()
            }
        }.start()
    }

    private fun jsonPayload(values: Map<String, Any?>): JSONObject = JSONObject().apply {
        values.forEach { (key, value) -> put(key, value ?: JSONObject.NULL) }
    }

    private fun reportPlaybackEvent(assetId: String, type: String, error: String? = null, item: JSONObject? = null) = Thread {
        runCatching {
            if (assetId.isBlank()) return@runCatching
            val detail = JSONObject().put("source", "tv-player")
            error?.take(160)?.let { detail.put("error", it) }
            item?.optJSONObject("insertion")?.let { insertion ->
                detail.put("dynamicInsertion", JSONObject()
                    .put("kind", insertion.optString("kind"))
                    .put("sourceType", insertion.optString("sourceType"))
                    .put("label", insertion.optString("label"))
                    .put("billable", insertion.optBoolean("billable", false)))
            }
            item?.optJSONObject("visualEffect")?.let { effect ->
                detail.put("visualEffect", JSONObject()
                    .put("transition", effect.optString("transition"))
                    .put("intensity", effect.optString("intensity"))
                    .put("overlay", effect.optBoolean("overlay", false)))
            }
            val event = JSONObject().put("eventId", UUID.randomUUID().toString()).put("assetId", assetId).put("type", type)
                .put("occurredAt", java.time.Instant.now().toString()).put("detail", detail)
            requestArray("api/device/events", JSONArray().put(event), preferences.getString("device_token", null)!!)
        }
    }.start()

    private fun showIdle(generation: Int, message: String = "TV ativa. Aguardando programacao...") {
        if (!playbackSession.accepts(generation)) return
        val root = container(); root.addView(label("ANGEL MIDIA PLAY", 34f)); root.addView(label(message, 22f)); showContent(root)
        scheduleEmergencyCheck(generation, 0)
        mainHandler.postDelayed({
            if (playbackSession.accepts(generation)) {
                syncAndPlay(advanceGeneration())
            }
        }, 10_000)
    }

    private fun getJson(path: String, bearer: String): JSONObject {
        val c = URL(BuildConfig.BASE_URL + path).openConnection() as HttpURLConnection
        c.requestMethod = "GET"; c.connectTimeout = 15_000; c.readTimeout = 15_000; c.setRequestProperty("Authorization", "Bearer $bearer")
        if (c.responseCode !in 200..299) throw IllegalStateException("sync_failed")
        return JSONObject(c.inputStream.bufferedReader().use { it.readText() })
    }

    private fun downloadMedia(assetId: String, bearer: String, type: String, generation: Int): File {
        val extension = if (type.startsWith("video/")) ".mp4" else ".img"
        val target = File(cacheDir, "$assetId$extension")
        if (target.exists() && target.length() > 0) return target
        val pending = File(cacheDir, PlaybackPolicy.cacheTempName(assetId, UUID.randomUUID().toString()))
        val c = URL(BuildConfig.BASE_URL + "api/device/media/$assetId").openConnection() as HttpURLConnection
        if (!transfers.register(generation, c)) throw InterruptedIOException("stale_transfer")
        try {
            if (!playbackSession.accepts(generation)) throw InterruptedIOException("stale_transfer")
            c.connectTimeout = 30_000; c.readTimeout = 60_000; c.setRequestProperty("Authorization", "Bearer $bearer")
            if (c.responseCode !in 200..299) throw IllegalStateException("media_failed")
            c.inputStream.use { input ->
                FileOutputStream(pending).use { output ->
                    val buffer = ByteArray(64 * 1024)
                    while (true) {
                        if (!playbackSession.accepts(generation)) throw InterruptedIOException("stale_transfer")
                        val read = input.read(buffer)
                        if (read < 0) break
                        output.write(buffer, 0, read)
                    }
                }
            }
            if (!playbackSession.accepts(generation)) throw InterruptedIOException("stale_transfer")
            if (!target.exists() && !pending.renameTo(target)) throw IllegalStateException("media_cache_failed")
        } finally {
            transfers.unregister(generation, c)
            c.disconnect()
            if (pending.exists()) pending.delete()
        }
        return target
    }

    private fun requestArray(path: String, payload: JSONArray, bearer: String) {
        val c = URL(BuildConfig.BASE_URL + path).openConnection() as HttpURLConnection
        c.requestMethod = "POST"; c.connectTimeout = 15_000; c.readTimeout = 15_000; c.setRequestProperty("Content-Type", "application/json"); c.setRequestProperty("Authorization", "Bearer $bearer"); c.doOutput = true
        c.outputStream.use { it.write(payload.toString().toByteArray()) }; if (c.responseCode !in 200..299) throw IllegalStateException("event_failed")
    }

    private fun requestNoContent(method: String, path: String, payload: JSONObject, bearer: String) {
        val connection = URL(BuildConfig.BASE_URL + path).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = method
            connection.connectTimeout = 15_000
            connection.readTimeout = 15_000
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Authorization", "Bearer $bearer")
            connection.doOutput = true
            connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
            if (connection.responseCode !in 200..299) throw IllegalStateException("request_failed")
        } finally {
            connection.disconnect()
        }
    }

    private fun claimWhenApproved(status: TextView, generation: Int) {
        val token = preferences.getString("activation_token", null)
        if (token.isNullOrBlank()) { status.text = "TV aprovada e pronta para receber a programacao."; return }
        Thread {
            try {
                val result = request("api/device/claim", JSONObject(), token)
                if (!playbackSession.accepts(generation)) return@Thread
                val deviceToken = result.optString("deviceToken")
                if (deviceToken.isNotBlank()) preferences.edit().putString("device_token", deviceToken).remove("activation_token").apply()
                mainHandler.post { if (playbackSession.accepts(generation)) status.text = "TV aprovada e pronta para receber a programacao." }
            } catch (_: Exception) {
                mainHandler.postDelayed({ if (playbackSession.accepts(generation)) claimWhenApproved(status, generation) }, 15_000)
            }
        }.start()
    }

    private fun request(path: String, payload: JSONObject, bearer: String? = null): JSONObject {
        val connection = URL(BuildConfig.BASE_URL + path).openConnection() as HttpURLConnection
        connection.requestMethod = "POST"; connection.connectTimeout = 15_000; connection.readTimeout = 15_000
        connection.setRequestProperty("Content-Type", "application/json"); if (bearer != null) connection.setRequestProperty("Authorization", "Bearer $bearer")
        connection.doOutput = true; connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
        val code = connection.responseCode
        val body = (if (code in 200..299) connection.inputStream else connection.errorStream)?.bufferedReader()?.use { it.readText() }.orEmpty()
        if (code !in 200..299) {
            val serverError = runCatching { JSONObject(body).optString("error") }.getOrNull()
            throw IllegalStateException(if (code == 409) "Esta instalacao ja esta cadastrada." else "Falha no cadastro (codigo $code${serverError?.takeIf { it.isNotBlank() }?.let { ": $it" } ?: ""}).")
        }
        return JSONObject(body)
    }

    private companion object {
        const val TELEMETRY_INTERVAL_MS = 30_000L
        const val PLAYBACK_CHECKPOINT_INTERVAL_MS = 5_000L
        const val OFFLINE_SYNC_INTERVAL_MS = 15_000L
        const val PREF_LAST_SCHEDULE = "last_schedule_v1"
        const val PREF_PLAYBACK_CHECKPOINT = "playback_checkpoint_v1"
        const val PREF_COMMAND_JOURNAL = "remote_command_journal_v1"
        const val PREF_APPLIED_COMMAND_IDS = "remote_command_applied_ids"
        const val PREF_PENDING_ACK_ID = "remote_command_pending_ack_id"
        const val PREF_PENDING_ACK_LEASE_TOKEN = "remote_command_pending_ack_lease_token"
        const val PREF_PENDING_ACK_OUTCOME = "remote_command_pending_ack_outcome"
        const val PREF_PENDING_ACK_ERROR = "remote_command_pending_ack_error"
    }
}
