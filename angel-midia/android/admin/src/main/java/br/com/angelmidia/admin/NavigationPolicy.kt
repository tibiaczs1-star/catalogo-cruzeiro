package br.com.angelmidia.admin

import java.net.URI

object NavigationPolicy {
    private const val DEFAULT_BASE_URL = "https://catalogo-cruzeiro-web.onrender.com/angel-midia/"

    fun allows(url: String): Boolean = allows(url, DEFAULT_BASE_URL)

    fun allows(url: String, baseUrl: String): Boolean = try {
        val target = URI(url).normalize()
        val base = URI(baseUrl).normalize()
        val basePath = (base.path ?: "/").let { if (it.endsWith('/')) it else "$it/" }

        target.rawUserInfo == null &&
            base.rawUserInfo == null &&
            target.scheme.equals(base.scheme, ignoreCase = true) &&
            target.host.equals(base.host, ignoreCase = true) &&
            effectivePort(target) == effectivePort(base) &&
            (target.path ?: "/").startsWith(basePath)
    } catch (_: Exception) { false }

    private fun effectivePort(uri: URI): Int = when {
        uri.port >= 0 -> uri.port
        uri.scheme.equals("https", ignoreCase = true) -> 443
        uri.scheme.equals("http", ignoreCase = true) -> 80
        else -> -1
    }
}
