package br.com.angelmidia.tv

import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

data class PresentationSpec(
    val fit: String = "contain", val focalX: Float = 50f, val focalY: Float = 50f,
    val zoom: Float = 1f, val rotation: Int = 0, val backgroundColor: String = "#000000",
)
data class PresentationLayout(val width: Int, val height: Int, val translationX: Float, val translationY: Float, val zoom: Float, val rotation: Float)

object PresentationPolicy {
    fun layout(cw: Int, ch: Int, mw: Int, mh: Int, spec: PresentationSpec): PresentationLayout {
        val rotated = spec.rotation == 90 || spec.rotation == 270
        val effectiveW = if (rotated) mh else mw
        val effectiveH = if (rotated) mw else mh
        val sx = cw.toFloat() / effectiveW.coerceAtLeast(1)
        val sy = ch.toFloat() / effectiveH.coerceAtLeast(1)
        val scale = if (spec.fit == "cover") max(sx, sy) else min(sx, sy)
        val finalW = if (spec.fit == "fill") cw else (effectiveW * scale).roundToInt()
        val finalH = if (spec.fit == "fill") ch else (effectiveH * scale).roundToInt()
        // LayoutParams describe the unrotated view. Swap its axes so a 90/270
        // degree rotation occupies the computed final bounding box.
        val viewW = if (rotated) finalH else finalW
        val viewH = if (rotated) finalW else finalH
        val focalX = spec.focalX.coerceIn(0f, 100f) / 100f
        val focalY = spec.focalY.coerceIn(0f, 100f) / 100f
        return PresentationLayout(viewW, viewH, (focalX - .5f) * (cw - finalW), (focalY - .5f) * (ch - finalH), spec.zoom.coerceIn(.25f, 4f), spec.rotation.toFloat())
    }

    fun color(spec: PresentationSpec): String = spec.backgroundColor.takeIf { Regex("^#[0-9a-fA-F]{6}$").matches(it) } ?: "#000000"
}
