package br.com.angelmidia.tv

import java.net.URLDecoder
import java.net.URLEncoder

data class AppliedCommandResult(
    val commandId: String,
    val outcome: String,
    val errorCode: String? = null,
)

data class DeviceCommandJournal(
    val appliedResults: List<AppliedCommandResult> = emptyList(),
    val pendingAcks: List<PendingCommandAck> = emptyList(),
) {
    fun resultFor(commandId: String): AppliedCommandResult? =
        appliedResults.lastOrNull { it.commandId == commandId }
            ?: pendingAcks.lastOrNull { it.commandId == commandId }?.let {
                AppliedCommandResult(it.commandId, it.outcome, it.errorCode)
            }

    fun ackFor(commandId: String, leaseToken: String): PendingCommandAck? =
        resultFor(commandId)?.let { result ->
            PendingCommandAck(commandId, leaseToken, result.outcome, result.errorCode)
        }

    fun prepare(commandId: String, maxApplied: Int = DEFAULT_MAX_APPLIED): DeviceCommandJournal =
        withResult(
            AppliedCommandResult(commandId, "failed", "execution_interrupted"),
            maxApplied,
        )

    fun complete(ack: PendingCommandAck, maxApplied: Int = DEFAULT_MAX_APPLIED): DeviceCommandJournal =
        withResult(AppliedCommandResult(ack.commandId, ack.outcome, ack.errorCode), maxApplied)
            .enqueue(ack)

    fun enqueue(ack: PendingCommandAck): DeviceCommandJournal = copy(
        pendingAcks = pendingAcks.filterNot { it.commandId == ack.commandId } + ack,
    )

    fun removePending(commandId: String, leaseToken: String): DeviceCommandJournal = copy(
        pendingAcks = pendingAcks.filterNot {
            it.commandId == commandId && it.leaseToken == leaseToken
        },
    )

    private fun withResult(result: AppliedCommandResult, maxApplied: Int): DeviceCommandJournal {
        val boundedMaximum = maxApplied.coerceAtLeast(1)
        val updated = (appliedResults.filterNot { it.commandId == result.commandId } + result)
            .takeLast(boundedMaximum)
        return copy(appliedResults = updated)
    }

    companion object {
        const val DEFAULT_MAX_APPLIED = 128
        val EMPTY = DeviceCommandJournal()
    }
}

object DeviceCommandJournalCodec {
    private const val VERSION = "v1"

    fun encode(journal: DeviceCommandJournal): String = buildString {
        appendLine(VERSION)
        journal.appliedResults.forEach { result ->
            appendRecord("A", result.commandId, "", result.outcome, result.errorCode)
        }
        journal.pendingAcks.forEach { ack ->
            appendRecord("Q", ack.commandId, ack.leaseToken, ack.outcome, ack.errorCode)
        }
    }

    fun decode(encoded: String?): DeviceCommandJournal {
        if (encoded.isNullOrBlank()) return DeviceCommandJournal.EMPTY
        val applied = mutableListOf<AppliedCommandResult>()
        val pending = mutableListOf<PendingCommandAck>()
        encoded.lineSequence().drop(1).forEach { line ->
            val parts = line.split('\t')
            if (parts.size != 6) return@forEach
            runCatching {
                val commandId = decodeValue(parts[1])
                val leaseToken = decodeValue(parts[2])
                val outcome = decodeValue(parts[3])
                val errorCode = if (parts[4] == "1") decodeValue(parts[5]) else null
                when (parts[0]) {
                    "A" -> applied += AppliedCommandResult(commandId, outcome, errorCode)
                    "Q" -> pending += PendingCommandAck(commandId, leaseToken, outcome, errorCode)
                }
            }
        }
        return DeviceCommandJournal(
            appliedResults = applied.asReversed().distinctBy { it.commandId }.asReversed()
                .takeLast(DeviceCommandJournal.DEFAULT_MAX_APPLIED),
            pendingAcks = pending.distinctBy { it.commandId to it.leaseToken },
        )
    }

    private fun StringBuilder.appendRecord(
        kind: String,
        commandId: String,
        leaseToken: String,
        outcome: String,
        errorCode: String?,
    ) {
        append(kind)
        append('\t').append(encodeValue(commandId))
        append('\t').append(encodeValue(leaseToken))
        append('\t').append(encodeValue(outcome))
        append('\t').append(if (errorCode == null) "0" else "1")
        append('\t').append(encodeValue(errorCode.orEmpty()))
        appendLine()
    }

    private fun encodeValue(value: String): String = URLEncoder.encode(value, "UTF-8")
    private fun decodeValue(value: String): String = URLDecoder.decode(value, "UTF-8")
}
