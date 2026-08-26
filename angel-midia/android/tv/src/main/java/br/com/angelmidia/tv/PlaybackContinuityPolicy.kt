package br.com.angelmidia.tv

object BootLaunchPolicy {
    private val allowedActions = setOf(
        "android.intent.action.BOOT_COMPLETED",
        "android.intent.action.MY_PACKAGE_REPLACED",
    )

    fun shouldLaunch(action: String?): Boolean = action in allowedActions
}

object OfflinePlaybackPolicy {
    fun availableIndexes(cached: List<Boolean>): List<Int> = cached.mapIndexedNotNull { index, exists ->
        index.takeIf { exists }
    }

    fun startIndex(current: Int, available: List<Int>): Int? {
        if (available.isEmpty()) return null
        if (current in available) return current
        return available.firstOrNull { it >= current } ?: available.first()
    }

    fun nextIndex(current: Int, available: List<Int>): Int? =
        available.firstOrNull { it > current } ?: available.firstOrNull()
}

data class PlaybackCheckpoint(
    val assetId: String,
    val scheduleIndex: Int,
    val positionMs: Int,
    val savedAtEpochMs: Long,
)

data class ResumeDecision(val index: Int, val positionMs: Int)

object PlaybackResumePolicy {
    const val DEFAULT_TTL_MS = 24L * 60L * 60L * 1_000L

    fun restore(
        checkpoint: PlaybackCheckpoint?,
        assetIds: List<String>,
        nowEpochMs: Long,
        ttlMs: Long = DEFAULT_TTL_MS,
    ): ResumeDecision? {
        if (checkpoint == null || checkpoint.assetId.isBlank()) return null
        if (nowEpochMs < checkpoint.savedAtEpochMs || nowEpochMs - checkpoint.savedAtEpochMs > ttlMs) return null
        val index = assetIds.indexOf(checkpoint.assetId)
        if (index < 0) return null
        return ResumeDecision(index, checkpoint.positionMs.coerceAtLeast(0))
    }

    fun seekPosition(trimStartMs: Int, savedPositionMs: Int, trimEndMs: Int?): Int {
        val valid = savedPositionMs >= trimStartMs && (trimEndMs == null || savedPositionMs < trimEndMs)
        return if (valid) savedPositionMs else trimStartMs
    }
}
