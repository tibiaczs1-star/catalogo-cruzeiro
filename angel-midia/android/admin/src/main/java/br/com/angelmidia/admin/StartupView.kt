package br.com.angelmidia.admin

import android.app.Activity
import android.content.res.ColorStateList
import android.graphics.Typeface
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

internal object StartupView {
    fun create(
        activity: Activity,
        spec: StartupSpec,
        message: String = spec.loadingMessage,
        retry: (() -> Unit)? = null,
    ): View {
        val root = FrameLayout(activity).apply {
            setBackgroundColor(spec.backgroundColor)
            isClickable = true
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "${spec.brand}. $message"
        }
        val content = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(activity, 32), dp(activity, 40), dp(activity, 32), dp(activity, 40))
        }
        content.addView(ImageView(activity).apply {
            setImageResource(R.drawable.ic_angel_mark)
            contentDescription = null
        }, LinearLayout.LayoutParams(dp(activity, 92), dp(activity, 92)).apply {
            bottomMargin = dp(activity, 22)
            gravity = Gravity.CENTER_HORIZONTAL
        })
        content.addView(TextView(activity).apply {
            text = spec.brand
            textSize = 30f
            gravity = Gravity.CENTER
            setTextColor(spec.foregroundColor)
            setTypeface(typeface, Typeface.BOLD)
        }, LinearLayout.LayoutParams(-1, -2))
        content.addView(TextView(activity).apply {
            text = spec.product
            textSize = 17f
            gravity = Gravity.CENTER
            setTextColor(spec.foregroundColor)
            alpha = 0.86f
        }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(activity, 4) })
        content.addView(if (retry == null) {
            ProgressBar(activity).apply {
                isIndeterminate = true
                indeterminateTintList = ColorStateList.valueOf(spec.foregroundColor)
            }
        } else {
            Button(activity).apply {
                text = "Tentar novamente"
                textSize = 16f
                setTextColor(spec.backgroundColor)
                backgroundTintList = ColorStateList.valueOf(spec.foregroundColor)
                setOnClickListener { retry() }
            }
        }, LinearLayout.LayoutParams(-2, dp(activity, 48)).apply {
            topMargin = dp(activity, 28)
            gravity = Gravity.CENTER_HORIZONTAL
        })
        content.addView(TextView(activity).apply {
            text = message
            textSize = 15f
            gravity = Gravity.CENTER
            setTextColor(spec.foregroundColor)
            alpha = 0.9f
        }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(activity, 14) })
        root.addView(content, FrameLayout.LayoutParams(-1, -2, Gravity.CENTER))
        return root
    }

    private fun dp(activity: Activity, value: Int): Int =
        (value * activity.resources.displayMetrics.density).toInt()
}
