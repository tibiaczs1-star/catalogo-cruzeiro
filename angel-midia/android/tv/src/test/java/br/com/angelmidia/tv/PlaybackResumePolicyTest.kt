package br.com.angelmidia.tv

import org.junit.Assert.assertEquals
import org.junit.Test

class PlaybackResumePolicyTest {
    @Test fun restoresByAssetIdEvenWhenTheScheduleOrderChanged() {
        val checkpoint = PlaybackCheckpoint("asset-b", 0, 12_500, 1_000_000)
        assertEquals(
            ResumeDecision(2, 12_500),
            PlaybackResumePolicy.restore(checkpoint, listOf("asset-a", "asset-c", "asset-b"), 1_100_000),
        )
    }

    @Test fun rejectsExpiredOrMissingCheckpoints() {
        val stale = PlaybackCheckpoint("asset-a", 0, 4_000, 1_000)
        assertEquals(null, PlaybackResumePolicy.restore(stale, listOf("asset-a"), 50_000, ttlMs = 10_000))
        val missing = PlaybackCheckpoint("gone", 0, 4_000, 10_000)
        assertEquals(null, PlaybackResumePolicy.restore(missing, listOf("asset-a"), 11_000))
    }

    @Test fun resumeSeekNeverEscapesTheConfiguredTrimRange() {
        assertEquals(8_000, PlaybackResumePolicy.seekPosition(3_000, 8_000, 20_000))
        assertEquals(3_000, PlaybackResumePolicy.seekPosition(3_000, 1_000, 20_000))
        assertEquals(3_000, PlaybackResumePolicy.seekPosition(3_000, 25_000, 20_000))
    }
}
