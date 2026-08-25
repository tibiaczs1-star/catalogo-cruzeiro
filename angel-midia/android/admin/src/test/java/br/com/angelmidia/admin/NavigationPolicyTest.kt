package br.com.angelmidia.admin

import org.junit.Assert.*
import org.junit.Test

class NavigationPolicyTest {
    @Test fun acceptsOnlyAngelOriginAndPath() {
        assertTrue(NavigationPolicy.allows("https://catalogo-cruzeiro-web.onrender.com/angel-midia/"))
        assertTrue(NavigationPolicy.allows("https://catalogo-cruzeiro-web.onrender.com/angel-midia/downloads/app.apk"))
        assertFalse(NavigationPolicy.allows("http://catalogo-cruzeiro-web.onrender.com/angel-midia/"))
        assertFalse(NavigationPolicy.allows("https://evil.example/angel-midia/"))
        assertFalse(NavigationPolicy.allows("https://catalogo-cruzeiro-web.onrender.com/admin"))
    }

    @Test fun acceptsConfiguredPreviewWithoutExpandingItsScope() {
        val preview = "http://10.0.2.2:4183/angel-midia/controller/"

        assertTrue(NavigationPolicy.allows(preview, preview))
        assertTrue(NavigationPolicy.allows("${preview}src/app.js", preview))
        assertFalse(NavigationPolicy.allows("http://10.0.2.2:4183/angel-midia/", preview))
        assertFalse(NavigationPolicy.allows("http://evil.example:4183/angel-midia/controller/", preview))
        assertFalse(NavigationPolicy.allows("http://10.0.2.2:4184/angel-midia/controller/", preview))
    }
}
