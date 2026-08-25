package br.com.angelmidia.tv

import org.junit.Assert.assertEquals
import org.junit.Test

class TelemetryDispatchQueueTest {
    @Test fun snapshotsAreDeliveredByOneWorkerInMonotonicFifoOrder() {
        val workers = mutableListOf<() -> Unit>()
        val delivered = mutableListOf<Pair<Long, String>>()
        val queue = TelemetryDispatchQueue<String>(
            schedule = { worker -> workers += worker },
            deliver = { sequence, value -> delivered += sequence to value },
        )

        assertEquals(1L, queue.enqueue("downloading"))
        assertEquals(2L, queue.enqueue("ready"))
        assertEquals(3L, queue.enqueue("failed"))

        assertEquals(1, workers.size)
        workers.single().invoke()
        assertEquals(listOf(1L to "downloading", 2L to "ready", 3L to "failed"), delivered)
    }

    @Test fun oneFailedDeliveryDoesNotDropLaterSnapshotsOrStartASecondWorker() {
        val workers = mutableListOf<() -> Unit>()
        val delivered = mutableListOf<String>()
        val queue = TelemetryDispatchQueue<String>(
            schedule = { worker -> workers += worker },
            deliver = { _, value ->
                delivered += value
                if (value == "first") error("network")
            },
        )

        queue.enqueue("first")
        queue.enqueue("second")
        workers.single().invoke()

        assertEquals(listOf("first", "second"), delivered)
        assertEquals(1, workers.size)
    }
}
