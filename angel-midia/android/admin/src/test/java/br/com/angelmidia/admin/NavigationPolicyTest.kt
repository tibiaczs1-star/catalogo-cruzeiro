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
}
