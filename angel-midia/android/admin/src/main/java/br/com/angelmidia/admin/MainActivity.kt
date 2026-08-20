package br.com.angelmidia.admin

import android.app.*
import android.content.*
import android.net.Uri
import android.os.Bundle
import android.webkit.*

class MainActivity : Activity() {
    private var chooser: ValueCallback<Array<Uri>>? = null
    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        val web = WebView(this)
        web.setBackgroundColor(0xff080e35.toInt())
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.allowFileAccess = false
        web.settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) = !NavigationPolicy.allows(request.url.toString())
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(v: WebView?, callback: ValueCallback<Array<Uri>>?, params: FileChooserParams?): Boolean {
                chooser?.onReceiveValue(null); chooser = callback
                startActivityForResult(params?.createIntent() ?: Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*"), 41); return true
            }
        }
        setContentView(web); web.loadUrl(BuildConfig.BASE_URL)
    }
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 41) { chooser?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data)); chooser = null }
    }
}
