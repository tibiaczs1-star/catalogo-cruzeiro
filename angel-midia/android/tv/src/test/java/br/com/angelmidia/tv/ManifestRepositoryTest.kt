package br.com.angelmidia.tv

import org.junit.Assert.*
import org.junit.Test

class ManifestRepositoryTest {
    private fun item(id: String, priority: Int, order: Int, sha: String = "a".repeat(64)) = MediaEntry(id, priority, order, sha, Presentation("cover", 50, 50, 0, 1.0, .8, 1.0, 9.0))
    @Test fun sortsByPriorityThenOrderAndPreservesPresentation() {
        val result = ManifestRepository.validateAndSort(listOf(item("low", 1, 0), item("later", 3, 2), item("first", 3, 1)))
        assertEquals(listOf("first", "later", "low"), result.map { it.id })
        assertEquals("cover", result.first().presentation.fit)
        assertEquals(1.0, result.first().presentation.trimStart, 0.0)
    }
    @Test(expected = IllegalArgumentException::class) fun rejectsBadHash() { ManifestRepository.validateAndSort(listOf(item("bad", 1, 1, "xyz"))) }
    @Test(expected = IllegalArgumentException::class) fun rejectsBadTrim() {
        ManifestRepository.validateAndSort(listOf(MediaEntry("bad", 1, 1, "b".repeat(64), Presentation("contain", 50, 50, 0, 1.0, 1.0, 8.0, 2.0))))
    }
}
