package br.com.angelmidia.tv

data class Presentation(val fit: String, val focalX: Int, val focalY: Int, val rotation: Int, val zoom: Double, val volume: Double, val trimStart: Double, val trimEnd: Double?)
data class MediaEntry(val id: String, val priority: Int, val order: Int, val sha256: String, val presentation: Presentation)

object ManifestRepository {
    private val sha = Regex("^[a-fA-F0-9]{64}$")
    fun validateAndSort(items: List<MediaEntry>): List<MediaEntry> {
        require(items.all { sha.matches(it.sha256) }) { "Invalid SHA-256" }
        require(items.all { it.presentation.fit in setOf("contain", "cover", "fill") }) { "Invalid object fit" }
        require(items.all { it.presentation.focalX in 0..100 && it.presentation.focalY in 0..100 }) { "Invalid focal point" }
        require(items.all { it.presentation.rotation in setOf(0, 90, 180, 270) }) { "Invalid rotation" }
        require(items.all { it.presentation.zoom in 0.5..3.0 && it.presentation.volume in 0.0..1.0 }) { "Invalid presentation" }
        require(items.all { it.presentation.trimStart >= 0 && (it.presentation.trimEnd == null || it.presentation.trimEnd > it.presentation.trimStart) }) { "Invalid trim" }
        return items.sortedWith(compareByDescending<MediaEntry> { it.priority }.thenBy { it.order })
    }
}
