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
}
