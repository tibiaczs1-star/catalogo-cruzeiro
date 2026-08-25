package br.com.angelmidia.admin

import java.net.URI

object NavigationPolicy {
    private const val ORIGIN = "https://catalogo-cruzeiro-web.onrender.com"
    private const val PREFIX = "/angel-midia/"
    fun allows(url: String): Boolean = try {
        val uri = URI(url)
        uri.scheme == "https" && "${uri.scheme}://${uri.host}" == ORIGIN && (uri.path ?: "/").startsWith(PREFIX)
    } catch (_: Exception) { false }
}
