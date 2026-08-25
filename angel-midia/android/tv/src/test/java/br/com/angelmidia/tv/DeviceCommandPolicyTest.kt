package br.com.angelmidia.tv

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DeviceCommandPolicyTest {
    @Test fun onlyTheThreeRemotePlayerActionsAreAllowed() {
        assertEquals(DeviceCommandAction.REFRESH_SYNC, DeviceCommandPolicy.actionFor("refresh_sync"))
        assertEquals(DeviceCommandAction.RESTART_PLAYER, DeviceCommandPolicy.actionFor("restart_player"))
        assertEquals(DeviceCommandAction.CLEAR_MEDIA_CACHE, DeviceCommandPolicy.actionFor("clear_media_cache"))
        assertEquals(null, DeviceCommandPolicy.actionFor("schedule_changed"))
        assertEquals(null, DeviceCommandPolicy.actionFor("open_url"))
        assertEquals(null, DeviceCommandPolicy.actionFor("shell"))
    }

    @Test fun anAppliedCommandIsAcknowledgedWithoutBeingExecutedAgain() {
        val decision = DeviceCommandPolicy.decide(
            DeviceRemoteCommand("cmd-7", "clear_media_cache", "lease-new"),
            appliedResult = AppliedCommandResult("cmd-7", "failed", "cache_delete_failed"),
        )

        assertEquals(
            DeviceCommandDecision.Acknowledge(
                PendingCommandAck("cmd-7", "lease-new", "failed", "cache_delete_failed"),
            ),
            decision,
        )
    }

    @Test fun aNewAllowedCommandHasNoAckUntilExecutionCompletes() {
        val decision = DeviceCommandPolicy.decide(
            DeviceRemoteCommand("cmd-8", "restart_player", "lease-8"),
            appliedResult = null,
        )

        assertEquals(
            DeviceCommandDecision.Execute("cmd-8", "lease-8", DeviceCommandAction.RESTART_PLAYER),
            decision,
        )
        assertEquals(
            PendingCommandAck("cmd-8", "lease-8", "succeeded"),
            DeviceCommandPolicy.ackAfterExecution("cmd-8", "lease-8", null),
        )
        assertEquals(
            PendingCommandAck("cmd-8", "lease-8", "failed", "player_restart_failed"),
            DeviceCommandPolicy.ackAfterExecution("cmd-8", "lease-8", "player_restart_failed"),
        )
    }

    @Test fun unknownActionsProduceADeterministicFailureAck() {
        val decision = DeviceCommandPolicy.decide(
            DeviceRemoteCommand("cmd-9", "open_url", "lease-9"),
            appliedResult = null,
        )

        assertEquals(
            DeviceCommandDecision.Reject(PendingCommandAck("cmd-9", "lease-9", "failed", "command_not_allowed")),
            decision,
        )
    }

    @Test fun aMissingLeaseTokenIsRejectedBeforeExecution() {
        val decision = DeviceCommandPolicy.decide(
            DeviceRemoteCommand("cmd-no-lease", "restart_player", ""),
            appliedResult = null,
        )

        assertEquals(
            DeviceCommandDecision.Reject(PendingCommandAck("cmd-no-lease", "", "failed", "invalid_command")),
            decision,
        )
    }

    @Test fun commandTypeUsesTheCurrentApiFieldWithLegacyFallback() {
        assertEquals("restart_player", DeviceCommandPolicy.resolveType("restart_player", ""))
        assertEquals("clear_media_cache", DeviceCommandPolicy.resolveType("", "clear_media_cache"))
    }

    @Test fun ackPayloadUsesOnlyTheContractFields() {
        assertEquals(
            mapOf("leaseToken" to "lease-10", "outcome" to "succeeded"),
            PendingCommandAck("cmd-10", "lease-10", "succeeded").toPayload(),
        )
        assertEquals(
            mapOf("leaseToken" to "lease-11", "outcome" to "failed", "errorCode" to "cache_delete_failed"),
            PendingCommandAck("cmd-11", "lease-11", "failed", "cache_delete_failed").toPayload(),
        )
    }

    @Test fun cacheCleanupSelectsOnlyPlayerMediaAndPartialDownloads() {
        assertTrue(DeviceCommandPolicy.isMediaCacheFile("campaign.mp4"))
        assertTrue(DeviceCommandPolicy.isMediaCacheFile("poster.img"))
        assertTrue(DeviceCommandPolicy.isMediaCacheFile(".download-42.part"))
        assertFalse(DeviceCommandPolicy.isMediaCacheFile("device_token"))
        assertFalse(DeviceCommandPolicy.isMediaCacheFile("angel_tv.xml"))
        assertFalse(DeviceCommandPolicy.isMediaCacheFile("campaign.mp4.bak"))
        assertFalse(DeviceCommandPolicy.isMediaCacheFile("mp4"))
    }

    @Test fun cacheCleanupAttemptsEveryEligibleFileAfterADeletionFailure() {
        val attempted = mutableListOf<String>()

        val result = DeviceCommandPolicy.clearMediaCache(
            arrayOf(File("first.mp4"), File("second.img"), File("token.xml"), File("third.part")),
            isRegularFile = { true },
        ) { file ->
            attempted += file.name
            file.name != "first.mp4"
        }

        assertFalse(result)
        assertEquals(listOf("first.mp4", "second.img", "third.part"), attempted)
    }

    @Test fun executionIsBlockedUntilTheDurableReservationSucceeds() {
        var executions = 0

        val blocked = DeviceCommandPolicy.executeAfterDurableReservation(
            reserve = { false },
            execute = { ++executions },
        )
        val executed = DeviceCommandPolicy.executeAfterDurableReservation(
            reserve = { true },
            execute = { ++executions },
        )

        assertEquals(null, blocked)
        assertEquals(1, executed)
        assertEquals(1, executions)
    }
}
