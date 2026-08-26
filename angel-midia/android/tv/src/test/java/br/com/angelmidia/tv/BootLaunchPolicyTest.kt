package br.com.angelmidia.tv

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BootLaunchPolicyTest {
    @Test fun launchesOnlyForBootAndPackageReplacement() {
        assertTrue(BootLaunchPolicy.shouldLaunch("android.intent.action.BOOT_COMPLETED"))
        assertTrue(BootLaunchPolicy.shouldLaunch("android.intent.action.MY_PACKAGE_REPLACED"))
        assertFalse(BootLaunchPolicy.shouldLaunch("android.intent.action.PACKAGE_REPLACED"))
        assertFalse(BootLaunchPolicy.shouldLaunch(null))
    }
}
