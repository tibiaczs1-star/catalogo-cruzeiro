package br.com.angelmidia.tv

class TelemetryDispatchQueue<T>(
    private val schedule: (() -> Unit) -> Unit,
    private val deliver: (sequence: Long, value: T) -> Unit,
) {
    private data class Entry<T>(val sequence: Long, val value: T)

    private val lock = Any()
    private val pending = ArrayDeque<Entry<T>>()
    private var nextSequence = 0L
    private var draining = false

    fun enqueue(value: T): Long {
        var startWorker = false
        val sequence = synchronized(lock) {
            nextSequence += 1
            pending.addLast(Entry(nextSequence, value))
            if (!draining) {
                draining = true
                startWorker = true
            }
            nextSequence
        }
        if (startWorker) {
            runCatching { schedule(::drain) }.onFailure {
                synchronized(lock) { draining = false }
            }
        }
        return sequence
    }

    private fun drain() {
        while (true) {
            val entry = synchronized(lock) {
                if (pending.isEmpty()) {
                    draining = false
                    null
                } else {
                    pending.removeFirst()
                }
            } ?: return
            runCatching { deliver(entry.sequence, entry.value) }
        }
    }
}
