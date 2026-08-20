package br.com.angelmidia.tv

import java.util.concurrent.ConcurrentHashMap

enum class PlaybackSource { EMERGENCY, SCHEDULE, IDLE }
enum class TrimEndAction { RESTART, ADVANCE }
data class VideoPlayback(val startMs: Int, val endMs: Int?, val volume: Float)

class TransferRegistry<T>(private val cancelTransfer: (T) -> Unit) {
    private val transfers = ConcurrentHashMap<Int, MutableSet<T>>()

    fun register(generation: Int, transfer: T) {
        transfers.computeIfAbsent(generation) { ConcurrentHashMap.newKeySet() }.add(transfer)
    }

    fun unregister(generation: Int, transfer: T) {
        transfers[generation]?.let { active ->
            active.remove(transfer)
            if (active.isEmpty()) transfers.remove(generation, active)
        }
    }

    fun cancel(generation: Int) {
        transfers.remove(generation)?.forEach(cancelTransfer)
    }
}

object PlaybackPolicy {
    fun nextIndex(current: Int, itemCount: Int): Int =
        if (itemCount <= 0) 0 else Math.floorMod(current + 1, itemCount)

    fun completedFailedCycle(consecutiveFailures: Int, itemCount: Int): Boolean =
        itemCount > 0 && consecutiveFailures >= itemCount

    fun retryBackoffMs(attempt: Int): Long {
        val shift = (attempt - 1).coerceIn(0, 4)
        return (2_000L * (1L shl shift)).coerceAtMost(30_000L)
    }

    fun shouldLoop(loop: Boolean?): Boolean = loop != false

    fun nextIndexOrNull(current: Int, itemCount: Int, loop: Boolean): Int? = when {
        itemCount <= 0 -> null
        current + 1 < itemCount -> current + 1
        loop -> 0
        else -> null
    }

    fun shouldInterruptForEmergency(generationCurrent: Boolean, emergencyActive: Boolean): Boolean =
        generationCurrent && emergencyActive

    fun transferAllowed(expectedGeneration: Int, currentGeneration: Int): Boolean =
        expectedGeneration == currentGeneration

    fun cacheTempName(assetId: String, requestId: String): String = ".$assetId-$requestId.part"

    fun finiteNumber(value: Any?): Double? = (value as? Number)?.toDouble()?.takeIf { it.isFinite() }
    fun source(emergencyActive: Boolean, itemCount: Int): PlaybackSource = when {
        emergencyActive -> PlaybackSource.EMERGENCY
        itemCount > 0 -> PlaybackSource.SCHEDULE
        else -> PlaybackSource.IDLE
    }

    fun imageDurationMs(seconds: Int?): Long = ((seconds ?: 10).coerceAtLeast(1)) * 1_000L

    fun videoPlayback(startSeconds: Double?, endSeconds: Double?, volume: Double?): VideoPlayback {
        val start = ((startSeconds?.takeIf { it.isFinite() } ?: 0.0).coerceAtLeast(0.0) * 1_000).toInt()
        val end = endSeconds?.takeIf { it.isFinite() && it > start / 1_000.0 }?.let { (it * 1_000).toInt() }
        return VideoPlayback(start, end, (volume?.takeIf { it.isFinite() } ?: 1.0).coerceIn(0.0, 1.0).toFloat())
    }

    fun reachedTrimEnd(positionMs: Int, endMs: Int?): Boolean = endMs != null && positionMs >= endMs
    fun trimEndAction(loop: Boolean): TrimEndAction = if (loop) TrimEndAction.RESTART else TrimEndAction.ADVANCE
}
