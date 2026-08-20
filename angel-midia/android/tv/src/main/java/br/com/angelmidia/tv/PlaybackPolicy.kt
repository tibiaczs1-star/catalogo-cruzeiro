package br.com.angelmidia.tv

enum class PlaybackSource { EMERGENCY, SCHEDULE, IDLE }

object PlaybackPolicy {
    fun source(emergencyActive: Boolean, itemCount: Int): PlaybackSource = when {
        emergencyActive -> PlaybackSource.EMERGENCY
        itemCount > 0 -> PlaybackSource.SCHEDULE
        else -> PlaybackSource.IDLE
    }

    fun imageDurationMs(seconds: Int?): Long = ((seconds ?: 10).coerceAtLeast(1)) * 1_000L
}
