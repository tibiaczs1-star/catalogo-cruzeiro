# Angel Mídia TV — início automático, retomada e modo offline

**Objetivo:** fazer o APK de TV abrir após a inicialização do aparelho, retomar a reprodução depois de interrupções e manter em exibição o último ciclo válido já armazenado quando a internet cair.

## Contrato de comportamento

1. O Android registra o app para `BOOT_COMPLETED` e `MY_PACKAGE_REPLACED`, abre uma única instância da `MainActivity` e mantém a tela ligada durante a reprodução.
2. O último manifesto válido recebido do servidor é persistido. Em falha de rede, somente itens cujo arquivo já existe no cache entram no ciclo offline.
3. Durante o modo offline não há espera de rede entre duas mídias locais. A sincronização continua sendo tentada em segundo plano e substitui o ciclo local quando a conexão volta.
4. O player salva periodicamente a mídia atual, índice e posição do vídeo. Depois de reinício, recupera um checkpoint recente e compatível; checkpoint antigo ou mídia ausente é ignorado.
5. Não são pedidas permissões perigosas. O início no boot é de melhor esforço porque alguns fabricantes exigem liberar “Inicialização automática” nas configurações do aparelho.

## Tarefa 1 — contratos testáveis (RED)

**Arquivos:**
- Criar: `angel-midia/android/tv/src/test/java/br/com/angelmidia/tv/BootLaunchPolicyTest.kt`
- Criar: `angel-midia/android/tv/src/test/java/br/com/angelmidia/tv/OfflinePlaybackPolicyTest.kt`
- Criar: `angel-midia/android/tv/src/test/java/br/com/angelmidia/tv/PlaybackResumePolicyTest.kt`
- Criar: `angel-midia/android/tv/src/test/java/br/com/angelmidia/tv/AndroidManifestContractTest.kt`

1. Escrever testes para ações de boot permitidas, seleção circular de índices armazenados e validade/restauração do checkpoint.
2. Validar no manifesto a permissão, o receiver e `launchMode="singleTask"`.
3. Executar `gradlew.bat :tv:testDebugUnitTest` e registrar a falha esperada antes das classes/manifesto existirem.

## Tarefa 2 — políticas puras e início automático (GREEN)

**Arquivos:**
- Criar: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/BootCompletedReceiver.kt`
- Criar: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/PlaybackContinuityPolicy.kt`
- Modificar: `angel-midia/android/tv/src/main/AndroidManifest.xml`

1. Implementar allowlist de ações de boot e receiver com flags de instância única.
2. Implementar política pura para índices disponíveis offline e restauração de checkpoint com TTL.
3. Registrar receiver/permissão no manifesto e manter a tela ligada sem permissão perigosa.
4. Executar os testes focados até ficarem verdes.

## Tarefa 3 — integrar persistência, offline e retomada

**Arquivos:**
- Modificar: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/MainActivity.kt`

1. Persistir o manifesto válido após cada sincronização bem-sucedida.
2. Ao falhar a sincronização, carregar a cópia persistida, filtrar pelos arquivos presentes no cache e iniciar o ciclo offline.
3. No modo offline, avançar imediatamente entre os itens locais e sondar a rede em segundo plano com intervalo controlado.
4. Persistir checkpoint do vídeo em intervalo curto e no `onStop`; restaurar uma única vez no próximo carregamento compatível.
5. Limpar/avançar checkpoint ao concluir uma mídia para evitar voltar a um item já terminado.

## Tarefa 4 — verificação e APK

1. Executar `gradlew.bat :tv:testDebugUnitTest`.
2. Executar `gradlew.bat :tv:assembleDebug`.
3. Conferir manifesto empacotado e tamanho/caminho do APK.
4. Atualizar o APK local de entrega somente depois do build verde; não fazer push nem deploy sem autorização explícita.
