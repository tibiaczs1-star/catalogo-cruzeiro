package br.com.angelmidia.tv

import java.io.File

enum class DeviceCommandAction {
    REFRESH_SYNC,
    RESTART_PLAYER,
    CLEAR_MEDIA_CACHE,
}

data class DeviceRemoteCommand(val id: String, val type: String, val leaseToken: String)

data class PendingCommandAck(
    val commandId: String,
    val leaseToken: String,
    val outcome: String,
    val errorCode: String? = null,
) {
    fun toPayload(): Map<String, String> = linkedMapOf(
        "leaseToken" to leaseToken,
        "outcome" to outcome,
    ).apply {
        errorCode?.let { put("errorCode", it) }
    }
}

sealed class DeviceCommandDecision {
    data class Execute(
        val commandId: String,
        val leaseToken: String,
        val action: DeviceCommandAction,
    ) : DeviceCommandDecision()
    data class Acknowledge(val ack: PendingCommandAck) : DeviceCommandDecision()
    data class Reject(val ack: PendingCommandAck) : DeviceCommandDecision()
}

object DeviceCommandPolicy {
    private val allowedActions = mapOf(
        "refresh_sync" to DeviceCommandAction.REFRESH_SYNC,
        "restart_player" to DeviceCommandAction.RESTART_PLAYER,
        "clear_media_cache" to DeviceCommandAction.CLEAR_MEDIA_CACHE,
    )

    fun actionFor(type: String): DeviceCommandAction? = allowedActions[type]

    fun decide(
        command: DeviceRemoteCommand,
        appliedResult: AppliedCommandResult?,
    ): DeviceCommandDecision {
        if (command.id.isBlank() || command.type.isBlank() || command.leaseToken.isBlank()) {
            return DeviceCommandDecision.Reject(
                PendingCommandAck(command.id, command.leaseToken, "failed", "invalid_command"),
            )
        }
        if (appliedResult != null) {
            return DeviceCommandDecision.Acknowledge(
                PendingCommandAck(
                    commandId = command.id,
                    leaseToken = command.leaseToken,
                    outcome = appliedResult.outcome,
                    errorCode = appliedResult.errorCode,
                ),
            )
        }
        return actionFor(command.type)?.let { action ->
            DeviceCommandDecision.Execute(command.id, command.leaseToken, action)
        } ?: DeviceCommandDecision.Reject(
            PendingCommandAck(command.id, command.leaseToken, "failed", "command_not_allowed"),
        )
    }

    fun ackAfterExecution(commandId: String, leaseToken: String, errorCode: String?): PendingCommandAck =
        if (errorCode == null) PendingCommandAck(commandId, leaseToken, "succeeded")
        else PendingCommandAck(commandId, leaseToken, "failed", errorCode)

    fun resolveType(commandType: String, legacyType: String): String =
        commandType.trim().ifBlank { legacyType.trim() }

    fun isMediaCacheFile(fileName: String): Boolean =
        fileName.endsWith(".mp4") || fileName.endsWith(".img") || fileName.endsWith(".part")

    fun clearMediaCache(
        files: Array<File>?,
        isRegularFile: (File) -> Boolean = { it.isFile },
        delete: (File) -> Boolean = { it.delete() || !it.exists() },
    ): Boolean {
        var allDeleted = true
        files.orEmpty()
            .filter { isRegularFile(it) && isMediaCacheFile(it.name) }
            .forEach { file ->
                val deleted = runCatching { delete(file) }.getOrDefault(false)
                allDeleted = deleted && allDeleted
            }
        return allDeleted
    }

    fun <T> executeAfterDurableReservation(reserve: () -> Boolean, execute: () -> T): T? =
        if (reserve()) execute() else null
}
