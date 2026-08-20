package br.com.angelmidia.tv

import org.junit.Assert.*
import org.junit.Test

class FirstRunSetupTest {
    @Test fun enablesAutomaticUpdatesByDefault() {
        assertTrue(FirstRunSetup.DEFAULT_AUTO_UPDATE)
    }

    @Test fun requiresDeviceNameAndLocation() {
        assertFalse(FirstRunSetup.isValid("", "Recepcao"))
        assertFalse(FirstRunSetup.isValid("TV 01", ""))
        assertTrue(FirstRunSetup.isValid(" TV 01 ", " Recepcao "))
    }

    @Test fun choosesSilentUpdatesOnlyForManagedDevices() {
        assertEquals(UpdateMode.SILENT, UpdatePolicy.resolve(autoUpdate = true, isDeviceOwner = true))
        assertEquals(UpdateMode.SYSTEM_CONFIRMATION, UpdatePolicy.resolve(autoUpdate = true, isDeviceOwner = false))
        assertEquals(UpdateMode.MANUAL, UpdatePolicy.resolve(autoUpdate = false, isDeviceOwner = true))
    }

    @Test fun opensPlayerImmediatelyWhenActivationReturnsDeviceToken() {
        assertEquals(ActivationDestination.PLAYER, FirstRunSetup.destination("device-token", null))
        assertEquals(ActivationDestination.PAIRING, FirstRunSetup.destination(null, "temporary-token"))
    }
}
