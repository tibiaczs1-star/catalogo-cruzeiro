package br.com.angelmidia.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class TelemetrySnapshotTest {
    @Test fun payloadContainsExactlyTheEightFieldsAcceptedByTheDeviceApi() {
        val snapshot = TelemetrySnapshot(
            currentAssetId = "88a3ec36-6dd3-43f2-9e4e-d1033402be0a",
            nextAssetId = null,
            playlistPosition = 2,
            playbackStartedAt = "2026-08-25T15:10:30Z",
            downloadState = "ready",
            errorMessage = null,
            freeStorageBytes = 4_294_967_296L,
            appVersion = "2026.08.25",
        )

        val payload = snapshot.toPayload()

        assertEquals(
            setOf(
                "currentAssetId", "nextAssetId", "playlistPosition", "playbackStartedAt",
                "downloadState", "errorMessage", "freeStorageBytes", "appVersion",
            ),
            payload.keys,
        )
        assertEquals("88a3ec36-6dd3-43f2-9e4e-d1033402be0a", payload["currentAssetId"])
        assertNull(payload["nextAssetId"])
        assertEquals(2, payload["playlistPosition"])
        assertEquals("2026-08-25T15:10:30Z", payload["playbackStartedAt"])
        assertEquals("ready", payload["downloadState"])
        assertNull(payload["errorMessage"])
        assertEquals(4_294_967_296L, payload["freeStorageBytes"])
        assertEquals("2026.08.25", payload["appVersion"])
        assertTrue(payload.values.all { it == null || it is String || it is Number || it is Boolean })
    }
}
