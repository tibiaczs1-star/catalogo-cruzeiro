package br.com.angelmidia.tv

import java.net.URI

data class TvEffectSpec(
    val transition: String,
    val intensity: String,
    val durationMs: Long,
    val startTranslationDp: Float,
    val startScale: Float,
    val startTranslationYDp: Float = 0f,
    val startRotationY: Float = 0f,
    val usesBlur: Boolean = false,
    val overshoot: Boolean = false,
)

data class TvTickerSpec(val durationMs: Long, val position: String)

object TvVisualEffects {
    fun resolve(requestedTransition: String?, requestedIntensity: String?): TvEffectSpec {
        val transition = requestedTransition?.takeIf { it in setOf("none", "fade", "slide", "zoom", "wipe", "rise", "flip", "blur", "impact") } ?: "fade"
        val intensity = requestedIntensity?.takeIf { it in setOf("subtle", "balanced", "strong") } ?: "balanced"
        val duration = when (intensity) { "subtle" -> 280L; "strong" -> 620L; else -> 420L }
        val translation = when (intensity) { "subtle" -> 24f; "strong" -> 64f; else -> 42f }
        val scale = when (intensity) { "subtle" -> .98f; "strong" -> .94f; else -> .96f }
        return TvEffectSpec(
            transition = transition,
            intensity = intensity,
            durationMs = if (transition == "none") 0L else duration,
            startTranslationDp = translation,
            startScale = scale,
            startTranslationYDp = if (transition == "rise") translation else 0f,
            startRotationY = if (transition == "flip") -58f else 0f,
            usesBlur = transition == "blur",
            overshoot = transition == "impact",
        )
    }

    fun ticker(requestedSpeed: String?, requestedPosition: String?): TvTickerSpec {
        val duration = when (requestedSpeed) { "fast" -> 7_000L; "calm" -> 18_000L; else -> 11_000L }
        val position = requestedPosition?.takeIf { it in setOf("top", "bottom") } ?: "bottom"
        return TvTickerSpec(duration, position)
    }

    fun safeCzsUrl(value: String?): String? = try {
        val uri = URI(value ?: return null)
        if (uri.scheme == "https" && uri.host == "catalogo-cruzeiro-web.onrender.com"
            && (uri.path.isNullOrEmpty() || uri.path == "/") && uri.port == -1
            && uri.query == null && uri.fragment == null
        ) "https://catalogo-cruzeiro-web.onrender.com/" else null
    } catch (_: Exception) { null }

    fun insertionLabel(kind: String?): String? = when (kind) {
        "advertisement" -> "PUBLICIDADE"
        "news" -> "NOTÍCIA LOCAL"
        "meme" -> "MOMENTO LEVE"
        else -> null
    }
}
