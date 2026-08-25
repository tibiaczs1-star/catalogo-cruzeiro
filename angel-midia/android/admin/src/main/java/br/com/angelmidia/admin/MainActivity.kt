package br.com.angelmidia.admin

import android.app.*
import android.content.*
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.FrameLayout

class MainActivity : Activity() {
    private var chooser: ValueCallback<Array<Uri>>? = null
    private val startupSpec = StartupPresentation.admin()
    private lateinit var root: FrameLayout
    private lateinit var web: WebView
    private var startupView: View? = null
    private var startupPhase = StartupPhase.LOADING
    private var contentWasVisible = false

    override fun onCreate(state: Bundle?) {
        setTheme(R.style.AppTheme)
        super.onCreate(state)
        root = FrameLayout(this)
        web = WebView(this)
        web.setBackgroundColor(startupSpec.backgroundColor)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.allowFileAccess = false
        web.settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) =
                !NavigationPolicy.allows(request.url.toString(), BuildConfig.BASE_URL)

            override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                if (!contentWasVisible) renderStartup(StartupPhase.LOADING)
            }

            override fun onPageCommitVisible(view: WebView, url: String?) {
                if (startupPhase == StartupPhase.LOADING) {
                    contentWasVisible = true
                    renderStartup(StartupPhase.READY)
                }
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame && !contentWasVisible) showConnectionError()
            }

            override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, response: WebResourceResponse) {
                if (request.isForMainFrame && response.statusCode >= 500 && !contentWasVisible) showConnectionError()
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(v: WebView?, callback: ValueCallback<Array<Uri>>?, params: FileChooserParams?): Boolean {
                chooser?.onReceiveValue(null); chooser = callback
                startActivityForResult(params?.createIntent() ?: Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*"), 41); return true
            }
        }
        root.addView(web, FrameLayout.LayoutParams(-1, -1))
        renderStartup(StartupPhase.LOADING)
        setContentView(root)
        web.loadUrl(BuildConfig.BASE_URL)
    }

    private fun showConnectionError() {
        renderStartup(StartupPhase.ERROR, "Sem conexão com a central") {
            renderStartup(StartupPhase.LOADING)
            web.reload()
        }
    }

    private fun renderStartup(phase: StartupPhase, message: String = startupSpec.loadingMessage, retry: (() -> Unit)? = null) {
        startupPhase = phase
        startupView?.let(root::removeView)
        startupView = null
        if (!startupSpec.shouldCover(phase)) return
        StartupView.create(this, startupSpec, message, retry).also {
            startupView = it
            root.addView(it, FrameLayout.LayoutParams(-1, -1))
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 41) { chooser?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data)); chooser = null }
    }
}
