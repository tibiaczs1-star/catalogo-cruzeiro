package br.com.angelmidia.tv

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.graphics.Color
import android.graphics.BitmapFactory
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.widget.*
import org.json.JSONObject
import org.json.JSONArray
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

class MainActivity : Activity() {
    private val preferences by lazy { getSharedPreferences("angel_tv", MODE_PRIVATE) }
    private val mainHandler = Handler(Looper.getMainLooper())
    private var playbackGeneration = 0
    private var scheduleIndex = 0

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        enterFullscreen()
        when {
            preferences.contains("device_token") -> showReady()
            preferences.contains("link_code") -> showPairing()
            else -> showFirstRun()
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) enterFullscreen()
    }

    private fun enterFullscreen() {
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    }

    private fun label(value: String, size: Float = 20f) = TextView(this).apply {
        text = value; textSize = size; setTextColor(Color.WHITE)
    }

    private fun container() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER
        setPadding(72, 42, 72, 42); setBackgroundColor(Color.rgb(8, 14, 53))
    }

    private fun field(hint: String) = EditText(this).apply {
        this.hint = hint; textSize = 20f; setTextColor(Color.WHITE); setHintTextColor(Color.rgb(170, 181, 213))
        setSingleLine(true); setPadding(24, 18, 24, 18)
    }

    private fun showFirstRun() {
        val root = container()
        root.addView(label("ANGEL MIDIA PLAY", 34f)); root.addView(label("Configure esta TV", 26f))
        root.addView(label("Informe os dados que aparecerao no mapa e no painel.", 18f))
        val name = field("Nome do aparelho (ex.: TV Recepcao)")
        val location = field("Local ou endereco (ex.: Loja Centro - Recepcao)")
        val updates = CheckBox(this).apply {
            text = "Ativar atualizacoes automaticas (recomendado)"
            isChecked = FirstRunSetup.DEFAULT_AUTO_UPDATE
            textSize = 18f
            setTextColor(Color.WHITE)
        }
        val updateHelp = label(updateExplanation(true), 15f)
        updates.setOnCheckedChangeListener { _, checked -> updateHelp.text = updateExplanation(checked) }
        val status = label("", 17f)
        val button = Button(this).apply { text = "Cadastrar esta TV"; textSize = 20f }
        listOf(name, location, updates, updateHelp, button, status).forEach { root.addView(it, LinearLayout.LayoutParams(-1, -2).apply { setMargins(0, 12, 0, 0) }) }
        button.setOnClickListener {
            if (!FirstRunSetup.isValid(name.text.toString(), location.text.toString())) {
                status.text = "Preencha o nome da TV e o local."; return@setOnClickListener
            }
            button.isEnabled = false; status.text = "Cadastrando com seguranca..."
            activate(name.text.toString().trim(), location.text.toString().trim(), updates.isChecked) { result ->
                button.isEnabled = true
                if (result.isSuccess) {
                    if (preferences.contains("device_token")) showReady() else showPairing()
                } else status.text = result.exceptionOrNull()?.message ?: "Nao foi possivel cadastrar. Verifique a internet."
            }
        }
        setContentView(root)
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

    private fun activate(name: String, location: String, autoUpdate: Boolean, done: (Result<Unit>) -> Unit) = Thread {
        try {
            val payload = JSONObject().put("installationId", installationId()).put("name", name).put("address", location)
            val response = request("api/devices/activate", payload)
            val deviceToken = response.optString("deviceToken").takeIf { it.isNotBlank() }
            val activationToken = response.optString("activationToken").takeIf { it.isNotBlank() }
            if (FirstRunSetup.destination(deviceToken, activationToken) == ActivationDestination.ERROR) {
                throw IllegalStateException("O servidor nao devolveu a credencial da TV.")
            }
            preferences.edit().putString("device_name", name).putString("location", location).putBoolean("auto_update", autoUpdate)
                .putString("link_code", response.optString("linkCode"))
                .apply {
                    if (deviceToken != null) putString("device_token", deviceToken).remove("activation_token")
                    if (activationToken != null) putString("activation_token", activationToken)
                }.apply()
            mainHandler.post { done(Result.success(Unit)) }
        } catch (error: Exception) { mainHandler.post { done(Result.failure(error)) } }
    }.start()

    private fun showPairing() {
        val root = container()
        root.addView(label("ANGEL MIDIA PLAY", 32f)); root.addView(label(preferences.getString("device_name", "Esta TV") ?: "Esta TV", 25f))
        root.addView(label(preferences.getString("location", "") ?: "", 18f)); root.addView(label("Codigo para vincular no painel", 18f))
        root.addView(label(preferences.getString("link_code", "------") ?: "------", 42f))
        val status = label("Aguardando aprovacao do administrador...", 18f); root.addView(status)
        setContentView(root); claimWhenApproved(status)
    }

    private fun showReady(): Unit {
        playbackGeneration += 1
        syncAndPlay(playbackGeneration)
    }

    private fun syncAndPlay(generation: Int): Unit { Thread {
        try {
            val token = preferences.getString("device_token", null) ?: return@Thread
            val state = getJson("api/device/sync", token)
            if (generation != playbackGeneration) return@Thread
            val emergency = state.optJSONObject("emergency")
            val items = state.optJSONObject("schedule")?.optJSONArray("items") ?: JSONArray()
            mainHandler.post {
                if (generation != playbackGeneration) return@post
                when (PlaybackPolicy.source(emergency != null, items.length())) {
                    PlaybackSource.EMERGENCY -> playEmergency(emergency!!, generation)
                    PlaybackSource.SCHEDULE -> {
                        if (scheduleIndex >= items.length()) scheduleIndex = 0
                        playMedia(items.getJSONObject(scheduleIndex), false, generation)
                    }
                    PlaybackSource.IDLE -> showIdle(generation)
                }
            }
        } catch (_: Exception) { mainHandler.post { showIdle(generation, "Sem conexao. Tentando novamente...") } }
    }.start() }

    private fun playEmergency(item: JSONObject, generation: Int): Unit {
        if (item.optString("mode") == "message") {
            val root = container().apply { setBackgroundColor(Color.rgb(160, 0, 28)) }
            root.addView(label("⚡ RELÂMPAGO MARQUINHOS", 28f))
            root.addView(label(item.optString("title", "ATENÇÃO"), 54f))
            root.addView(label(item.optString("message"), 32f))
            setContentView(root)
            mainHandler.postDelayed({ syncAndPlay(generation) }, 5_000)
        } else playMedia(JSONObject().put("assetId", item.optString("asset_id")).put("type", item.optString("content_type")).put("durationSeconds", item.optInt("duration_seconds", 10)), true, generation)
    }

    private fun playMedia(item: JSONObject, emergency: Boolean, generation: Int): Unit { Thread {
        try {
            val token = preferences.getString("device_token", null) ?: return@Thread
            val assetId = item.getString("assetId")
            val type = item.optString("type")
            val presentation = item.optJSONObject("presentation") ?: JSONObject()
            val file = downloadMedia(assetId, token, type)
            mainHandler.post {
                if (generation != playbackGeneration) return@post
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
                            applyPresentation(this, stage, player.videoWidth, player.videoHeight, presentation)
                            player.isLooping = emergency && playback.endMs == null
                            player.setVolume(playback.volume, playback.volume)
                            seekTo(playback.startMs)
                            start()
                            if (playback.endMs != null) monitorTrimEnd(this, assetId, emergency, generation, playback)
                        }
                        setOnCompletionListener {
                            if (PlaybackPolicy.trimEndAction(emergency) == TrimEndAction.RESTART && playback.endMs != null) {
                                seekTo(playback.startMs); start()
                            } else finishMedia(assetId, emergency, generation)
                        }
                        setOnErrorListener { _, _, _ -> finishMedia(assetId, emergency, generation); true }
                    }
                    stage.addView(video, FrameLayout.LayoutParams(-1, -1, Gravity.CENTER))
                    setContentView(stage); enterFullscreen(); video.start(); if (!emergency) scheduleEmergencyCheck(generation)
                    if (emergency) mainHandler.postDelayed({ syncAndPlay(generation) }, 5_000)
                } else {
                    val stage = FrameLayout(this).apply { setBackgroundColor(presentationColor(presentation)) }
                    val bitmap = BitmapFactory.decodeFile(file.absolutePath)
                    val image = ImageView(this).apply { scaleType = ImageView.ScaleType.FIT_XY; setImageBitmap(bitmap) }
                    stage.addView(image, FrameLayout.LayoutParams(-1, -1, Gravity.CENTER))
                    setContentView(stage); enterFullscreen(); stage.post { applyPresentation(image, stage, bitmap.width, bitmap.height, presentation) }
                    if (!emergency) scheduleEmergencyCheck(generation)
                    mainHandler.postDelayed({ finishMedia(assetId, emergency, generation) }, if (emergency) 5_000 else PlaybackPolicy.imageDurationMs(item.optInt("durationSeconds").takeIf { item.has("durationSeconds") }))
                }
            }
        } catch (_: Exception) { mainHandler.post { showIdle(generation, "Nao foi possivel carregar a midia. Tentando novamente...") } }
    }.start() }

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

    private fun finishMedia(assetId: String, emergency: Boolean, generation: Int): Unit {
        if (generation != playbackGeneration) return
        if (!emergency) { reportCompleted(assetId); scheduleIndex += 1 }
        playbackGeneration += 1
        syncAndPlay(playbackGeneration)
    }

    private fun monitorTrimEnd(video: VideoView, assetId: String, emergency: Boolean, generation: Int, playback: VideoPlayback) {
        mainHandler.postDelayed(object : Runnable {
            override fun run() {
                if (generation != playbackGeneration) return
                if (PlaybackPolicy.reachedTrimEnd(video.currentPosition, playback.endMs)) {
                    if (PlaybackPolicy.trimEndAction(emergency) == TrimEndAction.RESTART) {
                        video.seekTo(playback.startMs); video.start(); mainHandler.postDelayed(this, 100)
                    } else finishMedia(assetId, false, generation)
                } else mainHandler.postDelayed(this, 100)
            }
        }, 100)
    }

    private fun scheduleEmergencyCheck(generation: Int): Unit {
        mainHandler.postDelayed({
            if (generation != playbackGeneration) return@postDelayed
            Thread {
                val emergency = runCatching { getJson("api/device/sync", preferences.getString("device_token", null)!!).optJSONObject("emergency") }.getOrNull()
                if (emergency != null) mainHandler.post {
                    if (generation == playbackGeneration) { playbackGeneration += 1; playEmergency(emergency, playbackGeneration) }
                } else mainHandler.post { if (generation == playbackGeneration) scheduleEmergencyCheck(generation) }
            }.start()
        }, 5_000)
    }

    private fun reportCompleted(assetId: String) = Thread {
        runCatching {
            val event = JSONObject().put("eventId", UUID.randomUUID().toString()).put("assetId", assetId).put("type", "completed")
                .put("occurredAt", java.time.Instant.now().toString()).put("detail", JSONObject().put("source", "tv-player"))
            requestArray("api/device/events", JSONArray().put(event), preferences.getString("device_token", null)!!)
        }
    }.start()

    private fun showIdle(generation: Int, message: String = "TV ativa. Aguardando programacao...") {
        if (generation != playbackGeneration) return
        val root = container(); root.addView(label("ANGEL MIDIA PLAY", 34f)); root.addView(label(message, 22f)); setContentView(root)
        mainHandler.postDelayed({ syncAndPlay(generation) }, 10_000)
    }

    private fun getJson(path: String, bearer: String): JSONObject {
        val c = URL(BuildConfig.BASE_URL + path).openConnection() as HttpURLConnection
        c.requestMethod = "GET"; c.connectTimeout = 15_000; c.readTimeout = 15_000; c.setRequestProperty("Authorization", "Bearer $bearer")
        if (c.responseCode !in 200..299) throw IllegalStateException("sync_failed")
        return JSONObject(c.inputStream.bufferedReader().use { it.readText() })
    }

    private fun downloadMedia(assetId: String, bearer: String, type: String): File {
        val extension = if (type.startsWith("video/")) ".mp4" else ".img"
        val target = File(cacheDir, "$assetId$extension")
        if (target.exists() && target.length() > 0) return target
        val c = URL(BuildConfig.BASE_URL + "api/device/media/$assetId").openConnection() as HttpURLConnection
        c.connectTimeout = 30_000; c.readTimeout = 60_000; c.setRequestProperty("Authorization", "Bearer $bearer")
        if (c.responseCode !in 200..299) throw IllegalStateException("media_failed")
        c.inputStream.use { input -> FileOutputStream(target).use { output -> input.copyTo(output) } }
        return target
    }

    private fun requestArray(path: String, payload: JSONArray, bearer: String) {
        val c = URL(BuildConfig.BASE_URL + path).openConnection() as HttpURLConnection
        c.requestMethod = "POST"; c.connectTimeout = 15_000; c.readTimeout = 15_000; c.setRequestProperty("Content-Type", "application/json"); c.setRequestProperty("Authorization", "Bearer $bearer"); c.doOutput = true
        c.outputStream.use { it.write(payload.toString().toByteArray()) }; if (c.responseCode !in 200..299) throw IllegalStateException("event_failed")
    }

    private fun claimWhenApproved(status: TextView) {
        val token = preferences.getString("activation_token", null)
        if (token.isNullOrBlank()) { status.text = "TV aprovada e pronta para receber a programacao."; return }
        Thread {
            try {
                val result = request("api/device/claim", JSONObject(), token)
                val deviceToken = result.optString("deviceToken")
                if (deviceToken.isNotBlank()) preferences.edit().putString("device_token", deviceToken).remove("activation_token").apply()
                mainHandler.post { status.text = "TV aprovada e pronta para receber a programacao." }
            } catch (_: Exception) { mainHandler.postDelayed({ claimWhenApproved(status) }, 15_000) }
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
}
