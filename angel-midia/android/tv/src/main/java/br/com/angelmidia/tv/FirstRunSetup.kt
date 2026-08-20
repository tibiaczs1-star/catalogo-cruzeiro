package br.com.angelmidia.tv

object FirstRunSetup {
    const val DEFAULT_AUTO_UPDATE = true

    fun isValid(deviceName: String, location: String): Boolean =
        deviceName.trim().isNotEmpty() && deviceName.trim().length <= 160 &&
            location.trim().isNotEmpty() && location.trim().length <= 500

    fun destination(deviceToken: String?, activationToken: String?): ActivationDestination =
        if (!deviceToken.isNullOrBlank()) ActivationDestination.PLAYER
        else if (!activationToken.isNullOrBlank()) ActivationDestination.PAIRING
        else ActivationDestination.ERROR
}

enum class ActivationDestination { PLAYER, PAIRING, ERROR }

enum class UpdateMode { SILENT, SYSTEM_CONFIRMATION, MANUAL }

object UpdatePolicy {
    fun resolve(autoUpdate: Boolean, isDeviceOwner: Boolean): UpdateMode = when {
        !autoUpdate -> UpdateMode.MANUAL
        isDeviceOwner -> UpdateMode.SILENT
        else -> UpdateMode.SYSTEM_CONFIRMATION
    }
}
