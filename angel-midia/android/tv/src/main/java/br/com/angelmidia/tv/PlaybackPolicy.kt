package br.com.angelmidia.tv

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

enum class PlaybackSource { EMERGENCY, SCHEDULE, IDLE }
enum class TrimEndAction { RESTART, ADVANCE }
data class VideoPlayback(val startMs: Int, val endMs: Int?, val volume: Float)

class PlaybackSession {
    private val generation = AtomicInteger(0)
    @Volatile private var active = false

    fun activate(): Int { val next = generation.incrementAndGet(); active = true; return next }
    fun deactivate(): Int { active = false; return generation.incrementAndGet() }
    fun advance(): Int = generation.incrementAndGet()
    fun current(): Int = generation.get()
    fun accepts(expectedGeneration: Int): Boolean = active && generation.get() == expectedGeneration
}

class PlaybackSlot<T>(private val stop: (T) -> Unit) {
    @Volatile private var current: T? = null
    fun replace(next: T?) {
        val previous = current
        if (previous !== next) previous?.let(stop)
        current = next
    }
    fun clear() = replace(null)
    fun isCurrent(value: T): Boolean = current === value
}

class TransferRegistry<T>(private val cancelTransfer: (T) -> Unit) {
    private val transfers = ConcurrentHashMap<Int, MutableSet<T>>()
    private val cancelled = ConcurrentHashMap.newKeySet<Int>()

    fun register(generation: Int, transfer: T): Boolean {
        if (cancelled.contains(generation)) { cancelTransfer(transfer); return false }
        val active = transfers.computeIfAbsent(generation) { ConcurrentHashMap.newKeySet() }
        active.add(transfer)
        if (cancelled.contains(generation)) {
            if (active.remove(transfer)) cancelTransfer(transfer)
            return false
        }
        return true
    }

    fun unregister(generation: Int, transfer: T) {
        transfers[generation]?.let { active ->
            active.remove(transfer)
            if (active.isEmpty()) transfers.remove(generation, active)
        }
    }

    fun cancel(generation: Int) {
        cancelled.add(generation)
        transfers.remove(generation)?.forEach(cancelTransfer)
    }
}

object PlaybackPolicy {
    fun apiPresentation(
        fitMode: String?, focalX: Double?, focalY: Double?, zoom: Double?,
        rotation: Double?, backgroundColor: String?,
    ) = PresentationSpec(
        fit = fitMode?.takeIf { it in setOf("contain", "cover", "fill") } ?: "contain",
        focalX = (focalX ?: 50.0).toFloat(), focalY = (focalY ?: 50.0).toFloat(),
        zoom = (zoom ?: 1.0).toFloat(),
        rotation = (rotation ?: 0.0).toInt().takeIf { it in setOf(0, 90, 180, 270) } ?: 0,
        backgroundColor = backgroundColor ?: "#000000",
    )
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
