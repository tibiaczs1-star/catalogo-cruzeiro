package br.com.angelmidia.tv

import org.junit.Assert.assertEquals
import org.junit.Test

class OfflinePlaybackPolicyTest {
    @Test fun keepsOnlyItemsWhoseMediaExistsLocally() {
        assertEquals(listOf(0, 2, 4), OfflinePlaybackPolicy.availableIndexes(listOf(true, false, true, false, true)))
        assertEquals(emptyList<Int>(), OfflinePlaybackPolicy.availableIndexes(listOf(false, false)))
    }

    @Test fun resumesAtTheCurrentCachedItemOrTheNextAvailableOne() {
        val available = listOf(1, 3, 5)
        assertEquals(3, OfflinePlaybackPolicy.startIndex(3, available))
        assertEquals(3, OfflinePlaybackPolicy.startIndex(2, available))
        assertEquals(1, OfflinePlaybackPolicy.startIndex(6, available))
    }

    @Test fun advancesCircularlyWithoutWaitingForTheNetwork() {
        val available = listOf(1, 3, 5)
        assertEquals(3, OfflinePlaybackPolicy.nextIndex(1, available))
        assertEquals(1, OfflinePlaybackPolicy.nextIndex(5, available))
        assertEquals(null, OfflinePlaybackPolicy.nextIndex(0, emptyList()))
    }
}
