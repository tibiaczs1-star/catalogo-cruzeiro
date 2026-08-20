package br.com.angelmidia.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PlaybackPolicyTest {
    @Test fun lifecycleGenerationRejectsStoppedAndStaleCallbacks() {
        val session = PlaybackSession()
        val first = session.activate()
        assertTrue(session.accepts(first))

        session.deactivate()
        assertFalse(session.accepts(first))

        val resumed = session.activate()
        assertFalse(session.accepts(first))
        assertTrue(session.accepts(resumed))

        val replacement = session.advance()
        assertFalse(session.accepts(resumed))
        assertTrue(session.accepts(replacement))
    }

    @Test fun replacingPlaybackStopsThePreviousPlayerAndRejectsItsCallback() {
        val stopped = mutableListOf<String>()
        val slot = PlaybackSlot<String> { stopped.add(it) }
        val first = String(charArrayOf('a'))
        val second = String(charArrayOf('b'))
        slot.replace(first)
        slot.replace(second)
        assertEquals(listOf(first), stopped)
        assertFalse(slot.isCurrent(first))
        assertTrue(slot.isCurrent(second))
        slot.clear()
        assertEquals(listOf(first, second), stopped)
    }

    @Test fun advancesCircularlyAcrossAPlaylist() {
        assertEquals(1, PlaybackPolicy.nextIndex(0, 3))
        assertEquals(2, PlaybackPolicy.nextIndex(1, 3))
        assertEquals(0, PlaybackPolicy.nextIndex(2, 3))
    }

    @Test fun repeatsASingleItemAndSurvivesAnEmptyList() {
        assertEquals(0, PlaybackPolicy.nextIndex(0, 1))
        assertEquals(0, PlaybackPolicy.nextIndex(5, 0))
    }

    @Test fun oneCompletelyFailedCycleTriggersRecoveryWithBoundedBackoff() {
        assertEquals(false, PlaybackPolicy.completedFailedCycle(2, 3))
        assertEquals(true, PlaybackPolicy.completedFailedCycle(3, 3))
        assertEquals(false, PlaybackPolicy.completedFailedCycle(1, 0))
        assertEquals(2_000L, PlaybackPolicy.retryBackoffMs(1))
        assertEquals(4_000L, PlaybackPolicy.retryBackoffMs(2))
        assertEquals(30_000L, PlaybackPolicy.retryBackoffMs(20))
    }

    @Test fun explicitAndLegacyManifestLoopModesAreSupported() {
        assertEquals(true, PlaybackPolicy.shouldLoop(null))
        assertEquals(true, PlaybackPolicy.shouldLoop(true))
        assertEquals(false, PlaybackPolicy.shouldLoop(false))
        assertEquals(null, PlaybackPolicy.nextIndexOrNull(2, 3, false))
        assertEquals(0, PlaybackPolicy.nextIndexOrNull(2, 3, true))
    }

    @Test fun emergencyInterruptsRecoveryAndCancelsStaleTransfers() {
        assertEquals(true, PlaybackPolicy.shouldInterruptForEmergency(true, true))
        assertEquals(false, PlaybackPolicy.shouldInterruptForEmergency(false, true))
        assertEquals(false, PlaybackPolicy.transferAllowed(7, 8))
        assertEquals(true, PlaybackPolicy.transferAllowed(8, 8))
    }

    @Test fun concurrentDownloadsUseIndependentCacheFilesWithoutAGlobalLock() {
        val first = PlaybackPolicy.cacheTempName("asset", "normal")
        val emergency = PlaybackPolicy.cacheTempName("asset", "emergency")
        assertEquals(false, first == emergency)
        assertEquals(".asset-emergency.part", emergency)
    }

    @Test fun emergencyCancellationImmediatelyDisconnectsEveryNormalTransfer() {
        val cancelled = mutableListOf<String>()
        val registry = TransferRegistry<String> { cancelled.add(it) }
        registry.register(4, "playback")
        registry.register(4, "prefetch")
        registry.register(5, "emergency")

        registry.cancel(4)

        assertEquals(setOf("playback", "prefetch"), cancelled.toSet())
        registry.cancel(5)
        assertEquals(true, cancelled.contains("emergency"))
    }

    @Test fun aTransferRegisteredAfterCancellationIsRejectedAndCancelled() {
        val cancelled = mutableListOf<String>()
        val registry = TransferRegistry<String> { cancelled.add(it) }
        registry.cancel(4)

        assertFalse(registry.register(4, "late-normal"))
        assertEquals(listOf("late-normal"), cancelled)
    }

    @Test fun emergencySnakeCasePresentationAndPlaybackAreNormalized() {
        val presentation = PlaybackPolicy.apiPresentation(
            fitMode = "cover", focalX = 23.0, focalY = 71.0, zoom = 1.25,
            rotation = 90.0, backgroundColor = "#123456"
        )
        assertEquals(PresentationSpec("cover", 23f, 71f, 1.25f, 90, "#123456"), presentation)

        val playback = PlaybackPolicy.videoPlayback(3.5, 18.0, 0.4)
        assertEquals(VideoPlayback(3_500, 18_000, 0.4f), playback)
    }

    @Test fun emergencyAlwaysWinsOverTheNormalSchedule() {
        assertEquals(PlaybackSource.EMERGENCY, PlaybackPolicy.source(true, 5))
        assertEquals(PlaybackSource.SCHEDULE, PlaybackPolicy.source(false, 5))
        assertEquals(PlaybackSource.IDLE, PlaybackPolicy.source(false, 0))
    }

    @Test fun imageDurationHasASafeDefaultAndMinimum() {
        assertEquals(10_000L, PlaybackPolicy.imageDurationMs(null))
        assertEquals(1_000L, PlaybackPolicy.imageDurationMs(0))
        assertEquals(25_000L, PlaybackPolicy.imageDurationMs(25))
    }

    @Test fun videoPlaybackClampsSeekVolumeAndChoosesTrimEndAction() {
        val playback = PlaybackPolicy.videoPlayback(2.5, 12.0, 1.4)
        assertEquals(2_500, playback.startMs)
        assertEquals(12_000, playback.endMs)
        assertEquals(1f, playback.volume)
        assertEquals(false, PlaybackPolicy.reachedTrimEnd(11_999, playback.endMs))
        assertEquals(true, PlaybackPolicy.reachedTrimEnd(12_000, playback.endMs))
        assertEquals(TrimEndAction.ADVANCE, PlaybackPolicy.trimEndAction(false))
        assertEquals(TrimEndAction.RESTART, PlaybackPolicy.trimEndAction(true))
    }

    @Test fun jsonNumbersRejectNullStringsAndNonFiniteValues() {
        assertEquals(null, PlaybackPolicy.finiteNumber(null))
        assertEquals(null, PlaybackPolicy.finiteNumber("2"))
        assertEquals(null, PlaybackPolicy.finiteNumber(Double.NaN))
        assertEquals(null, PlaybackPolicy.finiteNumber(Double.POSITIVE_INFINITY))
        assertEquals(2.5, PlaybackPolicy.finiteNumber(2.5))
    }

    @Test fun presentationComputesContainCoverFillFocalZoomRotationAndColor() {
        val contain = PresentationPolicy.layout(1920, 1080, 1000, 1000, PresentationSpec("contain", 50f, 50f, 1f, 0))
        assertEquals(1080, contain.height); assertEquals(1080, contain.width)
        val left = PresentationPolicy.layout(1920, 1080, 2000, 500, PresentationSpec("cover", 0f, 50f, 1f, 0))
        val right = PresentationPolicy.layout(1920, 1080, 2000, 500, PresentationSpec("cover", 100f, 50f, 1f, 0))
        assertEquals(4320, left.width); assertEquals(true, left.translationX > right.translationX)
        val fill = PresentationPolicy.layout(1920, 1080, 1000, 500, PresentationSpec("fill", 50f, 50f, 1.5f, 90))
        assertEquals(1080, fill.width); assertEquals(1920, fill.height)
        assertEquals(90f, fill.rotation); assertEquals(1.5f, fill.zoom)
        assertEquals("#123456", PresentationPolicy.color(PresentationSpec(backgroundColor = "#123456")))
        assertEquals("#000000", PresentationPolicy.color(PresentationSpec(backgroundColor = "bad")))
    }
}
