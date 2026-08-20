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
}
