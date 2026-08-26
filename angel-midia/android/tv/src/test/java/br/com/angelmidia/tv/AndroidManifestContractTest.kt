package br.com.angelmidia.tv

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AndroidManifestContractTest {
    @Test fun manifestDeclaresSafeBootAutostartAndSingleActivityInstance() {
        val manifest = sequenceOf(
            File("src/main/AndroidManifest.xml"),
            File("tv/src/main/AndroidManifest.xml"),
            File("angel-midia/android/tv/src/main/AndroidManifest.xml"),
        ).first { it.isFile }.readText()

        assertTrue(manifest.contains("android.permission.RECEIVE_BOOT_COMPLETED"))
        assertTrue(manifest.contains(".BootCompletedReceiver"))
        assertTrue(manifest.contains("android.intent.action.BOOT_COMPLETED"))
        assertTrue(manifest.contains("android.intent.action.MY_PACKAGE_REPLACED"))
        assertTrue(manifest.contains("android:launchMode=\"singleTask\""))
        assertFalse(manifest.contains("android.permission.MANAGE_EXTERNAL_STORAGE"))
        assertFalse(manifest.contains("android.permission.WRITE_EXTERNAL_STORAGE"))
        assertFalse(manifest.contains("android.permission.REQUEST_INSTALL_PACKAGES"))
    }
}
