package br.com.angelmidia.tv

import org.junit.Assert.assertEquals
import org.junit.Test

class PlaybackPolicyTest {
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
