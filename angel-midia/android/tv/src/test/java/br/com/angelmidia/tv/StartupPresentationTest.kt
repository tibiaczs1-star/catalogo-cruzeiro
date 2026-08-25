package br.com.angelmidia.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StartupPresentationTest {
    @Test fun startsWithASolidBlueAndWhitePlayerIdentity() {
        val presentation = StartupPresentation.tv()

        assertEquals(0xff0b5fea.toInt(), presentation.backgroundColor)
        assertEquals(0xffffffff.toInt(), presentation.foregroundColor)
        assertEquals(StartupBackground.SOLID, presentation.background)
        assertEquals("Angel Mídia Play", presentation.brand)
        assertEquals("Player profissional", presentation.product)
        assertEquals("Preparando reprodução…", presentation.loadingMessage)
    }

    @Test fun handsOffImmediatelyToTheExistingTvFlow() {
        val presentation = StartupPresentation.tv()

        assertEquals(0L, presentation.minimumVisibleMillis)
        assertTrue(presentation.shouldCover(StartupPhase.LOADING))
        assertTrue(presentation.shouldCover(StartupPhase.ERROR))
        assertFalse(presentation.shouldCover(StartupPhase.READY))
    }
}
