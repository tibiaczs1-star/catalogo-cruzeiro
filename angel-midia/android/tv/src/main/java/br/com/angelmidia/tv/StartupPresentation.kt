package br.com.angelmidia.tv

enum class StartupBackground { SOLID }

enum class StartupPhase { LOADING, READY, ERROR }

data class StartupSpec(
    val backgroundColor: Int,
    val foregroundColor: Int,
    val background: StartupBackground,
    val brand: String,
    val product: String,
    val loadingMessage: String,
    val minimumVisibleMillis: Long = 0L,
) {
    fun shouldCover(phase: StartupPhase): Boolean = phase != StartupPhase.READY
}

object StartupPresentation {
    fun tv() = StartupSpec(
        backgroundColor = 0xff0b5fea.toInt(),
        foregroundColor = 0xffffffff.toInt(),
        background = StartupBackground.SOLID,
        brand = "Angel Mídia Play",
        product = "Player profissional",
        loadingMessage = "Preparando reprodução…",
    )
}
