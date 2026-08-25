package br.com.angelmidia.tv

import android.app.Activity
import android.content.res.ColorStateList
import android.graphics.Typeface
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

internal object StartupView {
    fun create(activity: Activity, spec: StartupSpec): View {
        val root = FrameLayout(activity).apply {
            setBackgroundColor(spec.backgroundColor)
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "${spec.brand}. ${spec.loadingMessage}"
        }
        val content = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(activity, 64), dp(activity, 32), dp(activity, 64), dp(activity, 32))
        }
        content.addView(ImageView(activity).apply {
            setImageResource(R.drawable.ic_angel_mark)
            contentDescription = null
        }, LinearLayout.LayoutParams(dp(activity, 112), dp(activity, 112)).apply {
            marginEnd = dp(activity, 28)
        })
        val copy = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.START
        }
        copy.addView(TextView(activity).apply {
            text = spec.brand
            textSize = 34f
            setTextColor(spec.foregroundColor)
            setTypeface(typeface, Typeface.BOLD)
        })
        copy.addView(TextView(activity).apply {
            text = spec.product
            textSize = 20f
            setTextColor(spec.foregroundColor)
            alpha = 0.86f
        })
        val status = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        status.addView(ProgressBar(activity).apply {
            isIndeterminate = true
            indeterminateTintList = ColorStateList.valueOf(spec.foregroundColor)
        }, LinearLayout.LayoutParams(dp(activity, 34), dp(activity, 34)))
        status.addView(TextView(activity).apply {
            text = spec.loadingMessage
            textSize = 17f
            setTextColor(spec.foregroundColor)
            alpha = 0.9f
        }, LinearLayout.LayoutParams(-2, -2).apply { marginStart = dp(activity, 12) })
        copy.addView(status, LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(activity, 22) })
        content.addView(copy)
        root.addView(content, FrameLayout.LayoutParams(-2, -2, Gravity.CENTER))
        return root
    }

    private fun dp(activity: Activity, value: Int): Int =
        (value * activity.resources.displayMetrics.density).toInt()
}
