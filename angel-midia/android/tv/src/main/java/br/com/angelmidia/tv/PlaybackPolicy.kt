package br.com.angelmidia.tv

enum class PlaybackSource { EMERGENCY, SCHEDULE, IDLE }
enum class TrimEndAction { RESTART, ADVANCE }
data class VideoPlayback(val startMs: Int, val endMs: Int?, val volume: Float)

object PlaybackPolicy {
    fun source(emergencyActive: Boolean, itemCount: Int): PlaybackSource = when {
        emergencyActive -> PlaybackSource.EMERGENCY
        itemCount > 0 -> PlaybackSource.SCHEDULE
        else -> PlaybackSource.IDLE
    }

    fun imageDurationMs(seconds: Int?): Long = ((seconds ?: 10).coerceAtLeast(1)) * 1_000L

    fun videoPlayback(startSeconds: Double?, endSeconds: Double?, volume: Double?): VideoPlayback {
        val start = ((startSeconds ?: 0.0).coerceAtLeast(0.0) * 1_000).toInt()
        val end = endSeconds?.takeIf { it > start / 1_000.0 }?.let { (it * 1_000).toInt() }
        return VideoPlayback(start, end, (volume ?: 1.0).coerceIn(0.0, 1.0).toFloat())
    }

    fun reachedTrimEnd(positionMs: Int, endMs: Int?): Boolean = endMs != null && positionMs >= endMs
    fun trimEndAction(loop: Boolean): TrimEndAction = if (loop) TrimEndAction.RESTART else TrimEndAction.ADVANCE
}
