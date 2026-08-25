package br.com.angelmidia.admin

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StartupPresentationTest {
    @Test fun startsWithASolidBlueAndWhiteAdminIdentity() {
        val presentation = StartupPresentation.admin()

        assertEquals(0xff0b5fea.toInt(), presentation.backgroundColor)
        assertEquals(0xffffffff.toInt(), presentation.foregroundColor)
        assertEquals(StartupBackground.SOLID, presentation.background)
        assertEquals("Angel Mídia", presentation.brand)
        assertEquals("Central de controle", presentation.product)
        assertEquals("Preparando sua central…", presentation.loadingMessage)
    }

    @Test fun neverAddsAnArtificialStartupDelay() {
        val presentation = StartupPresentation.admin()

        assertEquals(0L, presentation.minimumVisibleMillis)
        assertTrue(presentation.shouldCover(StartupPhase.LOADING))
        assertTrue(presentation.shouldCover(StartupPhase.ERROR))
        assertFalse(presentation.shouldCover(StartupPhase.READY))
    }
}
