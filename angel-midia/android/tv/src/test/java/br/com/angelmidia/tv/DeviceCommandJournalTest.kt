package br.com.angelmidia.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DeviceCommandJournalTest {
    @Test fun persistentQueueKeepsAcksForDifferentCommandsAndAllFields() {
        val state = DeviceCommandJournal.EMPTY
            .complete(PendingCommandAck("cmd-1", "lease-1", "succeeded"))
            .complete(PendingCommandAck("cmd-2", "lease-2", "failed", "cache_delete_failed"))

        val restored = DeviceCommandJournalCodec.decode(DeviceCommandJournalCodec.encode(state))

        assertEquals(
            listOf(
                PendingCommandAck("cmd-1", "lease-1", "succeeded"),
                PendingCommandAck("cmd-2", "lease-2", "failed", "cache_delete_failed"),
            ),
            restored.pendingAcks,
        )
        assertEquals(AppliedCommandResult("cmd-2", "failed", "cache_delete_failed"), restored.resultFor("cmd-2"))
    }

    @Test fun aNewLeaseReusesTheOriginalOutcomeAndReplacesOnlyItsStaleLease() {
        val original = DeviceCommandJournal.EMPTY
            .complete(PendingCommandAck("cmd-1", "lease-old", "failed", "player_restart_failed"))
            .complete(PendingCommandAck("cmd-2", "lease-2", "succeeded"))

        val replay = original.ackFor("cmd-1", "lease-new")
        val updated = original.enqueue(requireNotNull(replay))

        assertEquals(PendingCommandAck("cmd-1", "lease-new", "failed", "player_restart_failed"), replay)
        assertEquals(
            listOf(
                PendingCommandAck("cmd-2", "lease-2", "succeeded"),
                PendingCommandAck("cmd-1", "lease-new", "failed", "player_restart_failed"),
            ),
            updated.pendingAcks,
        )
    }

    @Test fun durablePreparationRecordsAnInterruptedFailureBeforeExecution() {
        val prepared = DeviceCommandJournal.EMPTY.prepare("cmd-risk")
        val restored = DeviceCommandJournalCodec.decode(DeviceCommandJournalCodec.encode(prepared))

        assertEquals(
            AppliedCommandResult("cmd-risk", "failed", "execution_interrupted"),
            restored.resultFor("cmd-risk"),
        )
        assertEquals(emptyList<PendingCommandAck>(), restored.pendingAcks)
    }

    @Test fun appliedHistoryIsBoundedAndPrunesTheOldestEntries() {
        val state = (1..4).fold(DeviceCommandJournal.EMPTY) { journal, index ->
            journal
                .complete(PendingCommandAck("cmd-$index", "lease-$index", "succeeded"), maxApplied = 3)
                .removePending("cmd-$index", "lease-$index")
        }

        assertNull(state.resultFor("cmd-1"))
        assertEquals(listOf("cmd-2", "cmd-3", "cmd-4"), state.appliedResults.map { it.commandId })
    }

    @Test fun aSuccessfulAckRemovesOnlyTheMatchingIdAndLease() {
        val state = DeviceCommandJournal.EMPTY
            .complete(PendingCommandAck("cmd-1", "lease-1", "succeeded"))
            .complete(PendingCommandAck("cmd-2", "lease-2", "succeeded"))

        val updated = state.removePending("cmd-1", "lease-1")

        assertEquals(listOf(PendingCommandAck("cmd-2", "lease-2", "succeeded")), updated.pendingAcks)
    }
}
