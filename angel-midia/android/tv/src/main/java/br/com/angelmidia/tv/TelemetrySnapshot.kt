package br.com.angelmidia.tv

data class TelemetrySnapshot(
    val currentAssetId: String?,
    val nextAssetId: String?,
    val playlistPosition: Int,
    val playbackStartedAt: String?,
    val downloadState: String,
    val errorMessage: String?,
    val freeStorageBytes: Long,
    val appVersion: String,
) {
    fun toPayload(): Map<String, Any?> = linkedMapOf(
        "currentAssetId" to currentAssetId,
        "nextAssetId" to nextAssetId,
        "playlistPosition" to playlistPosition,
        "playbackStartedAt" to playbackStartedAt,
        "downloadState" to downloadState,
        "errorMessage" to errorMessage,
        "freeStorageBytes" to freeStorageBytes,
        "appVersion" to appVersion,
    )
}
