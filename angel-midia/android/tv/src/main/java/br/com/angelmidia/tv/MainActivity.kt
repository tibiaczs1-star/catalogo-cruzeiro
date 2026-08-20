package br.com.angelmidia.tv

import android.app.Activity
import android.os.Bundle
import android.view.View
import android.webkit.*

class MainActivity : Activity() {
    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        val web = WebView(this)
        web.setBackgroundColor(0xff080e35.toInt())
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        web.settings.allowFileAccess = false
        web.settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = request.url.host != "catalogo-cruzeiro-web.onrender.com" || !request.url.path.orEmpty().startsWith("/angel-midia/")
        }
        setContentView(web)
        web.loadUrl(BuildConfig.BASE_URL + "player/")
    }
}
