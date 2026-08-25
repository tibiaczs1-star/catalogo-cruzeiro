package br.com.angelmidia.tv

import org.junit.Assert.*
import org.junit.Test

class TvVisualEffectsTest {
    @Test fun resolvesStrongSlideForThePlayer() {
        val effect = TvVisualEffects.resolve("slide", "strong")
        assertEquals("slide", effect.transition)
        assertEquals(620L, effect.durationMs)
        assertEquals(64f, effect.startTranslationDp)
        assertEquals(.94f, effect.startScale)
    }

    @Test fun fallsBackToSafeBalancedFade() {
        val effect = TvVisualEffects.resolve("glitch", "extreme")
        assertEquals("fade", effect.transition)
        assertEquals("balanced", effect.intensity)
        assertEquals(420L, effect.durationMs)
    }

    @Test fun labelsDynamicContentWithoutConfusingNewsAndAdvertising() {
        assertEquals("PUBLICIDADE", TvVisualEffects.insertionLabel("advertisement"))
        assertEquals("NOTÍCIA LOCAL", TvVisualEffects.insertionLabel("news"))
        assertEquals("MOMENTO LEVE", TvVisualEffects.insertionLabel("meme"))
        assertNull(TvVisualEffects.insertionLabel("standard"))
    }

    @Test fun resolvesModernTransitionsForTheTv() {
        for (transition in listOf("wipe", "rise", "flip", "blur", "impact")) {
            assertEquals(transition, TvVisualEffects.resolve(transition, "balanced").transition)
        }
        assertTrue(TvVisualEffects.resolve("flip", "strong").startRotationY < 0f)
        assertTrue(TvVisualEffects.resolve("blur", "balanced").usesBlur)
        assertTrue(TvVisualEffects.resolve("impact", "balanced").overshoot)
    }

    @Test fun configuresAnimatedTickerAndRealCzsQrCode() {
        val ticker = TvVisualEffects.ticker("fast", "top")
        assertEquals(7_000L, ticker.durationMs)
        assertEquals("top", ticker.position)
        assertEquals(18_000L, TvVisualEffects.ticker("calm", "bottom").durationMs)
        assertEquals("https://catalogo-cruzeiro-web.onrender.com/", TvVisualEffects.safeCzsUrl("https://catalogo-cruzeiro-web.onrender.com/"))
        assertNull(TvVisualEffects.safeCzsUrl("https://example.com/phishing"))
    }
}
