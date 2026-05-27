# Codex Memory - Estado Vivo

Atualizado: 2026-05-26

## Rodada Atual - 20260527-home-sliced-loading1

- Home CZS otimizada com carregamento fatiado real: `home-critical.css` novo, `home-main-loader.js` no lugar de `script.js` direto, preload de noticias reduzido para `limit=18&lite=1&firstFold=1`, CSS/JS premium e modulos auxiliares atras de rolagem/clique/secao perto da viewport ou fallback tardio.
- Mantida intro cinematografica com minimo aproximado de 3s; depois da intro, a primeira tela hidrata com dados leves via `early-home-surfaces.js`.
- Validacao local: desktop no Browser e mobile via Playwright fallback confirmaram que aos 5.6s e 12.6s nao entram `script.js`, `premium-home-redesign.css`, arquivo/admin/Cheffe ou rotas antigas; rolagem aciona o modo completo por `reader-intent`.
- `npm run review:team` passou com PubPaid guard OK; restaram 3 achados preexistentes em `cruzeiro-do-sul-barzinho/index.html`, fora da home.

## Rodada Atual - 20260527-pubpaid3-local-slice1

- PubPaid 3.0 / Cruzeiro do Sul Barzinho retomado como projeto separado em `cruzeiro-do-sul-barzinho/`, sem substituir o PubPaid canônico (`/pubpaid.html`, `pubpaid-phaser/`, `pubpaid-phaser.css`, `pubpaid-runtime.js`, `games/vale-pool/`).
- Fatia local criada: intro, lobby com 10 slots, seleção de 10 personagens, chat/emotes, Sinuca com 3 modos, Damas base e Xadrez visual/base, além de `window.renderGameToText()` para QA.
- Documentos criados: `docs/GAME_BIBLE.md` e `docs/CHATGPT_IMAGE_PROMPTS.md` com trava de arte final via ChatGPT Imagem quando controlável.
- Validação: `npm run check` dentro de `cruzeiro-do-sul-barzinho` OK e `npm run guard:pubpaid` no repo canônico OK. Browser/CDP não estava disponível nesta sessão; validação visual headless ficou pendente.

## Rodada Atual - 20260527-pubpaid-publish1

- Subida PubPaid retomada após janela fechada: pacote legal `docs/pubpaid/legal/` mais correção visual `chesshudfix1` do Xadrez/Damas preparados para commit/push.
- Validação de retomada: `node --check pubpaid-phaser/ui/domGameInterface.js`, `git diff --check`, JSON local OK e `npm run review:team` com PubPaid guard OK e `totalIssues: 0`.
- Arquivos de runtime em foco: `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser.css`, `pubpaid.html` e `progress.md`; mudanças grandes de dados/editorial ficaram fora do escopo desta subida.

## Rodada Atual - 20260526-pubpaid-legal1

- PubPaid recebeu pacote legal assinável em `docs/pubpaid/legal/`: manifesto, documento operacional/termo de responsabilidade, matriz de questões legais e go/no-go, mais README de uso.
- O pacote foi escrito como minuta operacional pronta para assinatura interna, mas com trava expressa: dinheiro real, prêmio, taxa/rake, torneio pago, saque automatizado ou publicidade de ganho ficam bloqueados até parecer jurídico, contábil, fiscal, LGPD e pagamento.
- Fontes oficiais consultadas: Planalto, Ministério da Fazenda/SPA para apostas de quota fixa e Banco Central para Pix.
- Estado operacional refletido no documento: Damas e Xadrez podem seguir em teste/demonstração, Sinuca permanece fora do online até correção e nova validação.

## Rodada Atual - 20260522-fix245

- Resolvidos apenas os itens pedidos 2, 3, 4 e 5: performance antiga, ordens abertas, volume de noticias e validacao online pos-deploy.
- Performance: `styles.css` compactado mecanicamente, saindo de `716692` bytes para cerca de `614 KB`; `npm run perf:budget` passou com `PERF_BUDGET_STRICT=1` e nenhum arquivo `over`.
- Noticias: `scripts/capture-latest-news.js` agora usa janela ativa padrao de 360 e arquivo padrao de 480 itens; `data/runtime-news.json`, `data/news-archive.json` e `news-data.js` foram podados de 1000 para 480 itens, com `news-data.js` em cerca de 1,56 MB.
- Memoria: 26 ordens antigas abertas foram marcadas como `closed-memory-cleanup`, restando apenas a ordem atual durante a rodada; reabrir alguma delas somente se o usuario pedir retomada explicita.
- Validacao local: `node --check`, JSON OK, `PERF_BUDGET_STRICT=1 npm run perf:budget`, `npm run agents:cycle` com `newsItems: 480`, `npm run review:team` com `totalIssues: 0`, `npm run editorial:health` OK e smoke local em `:3094` com home 200, `/api/news?limit=10&lite=1` sem `body`, `/api/pubpaid/build=20260522-boardfit1` e `/pubpaid.html` 200.
- Online apos deploy: Render primeiro retornou 502 durante troca de build, depois estabilizou com `news-data.js=1607717` bytes, `styles.css=614579` bytes, home 200, `/api/news?limit=10&lite=1` com 10 itens sem `body`, `/api/pubpaid/build=20260522-boardfit1` e `/pubpaid.html` 200.

## Rodada Atual - 20260522-sync1

- Ordem atual registrada: subir/sincronizar todas as mudancas e entregar relatorio de funcionalidade/heart.
- Validacao local antes de subir: `node --check` nos JS tocados, `git diff --check`, `npm run guard:pubpaid`, `npm run agents:cycle`, `npm run review:team` com `totalIssues: 0`, `npm run editorial:health` OK, `npm run perf:budget` OK nao estrito e `npm run codex:health` OK.
- Smoke HTTP local em `:3092`: home HTTP 200, `/api/news?limit=10&lite=1` com 10 itens e `/api/pubpaid/build=20260522-boardfit1`.
- Heart atual: memoria local viva, ultima ordem reconhecida pelo `codex:health`, worktree pronto para commit/push; pendencia funcional apenas a recomendacao recorrente de validar PvP real com duas contas reais/autenticadas antes de dinheiro de usuario.

## Rodada Atual - 20260522-editorial10b

- CZS/editorial refinado rumo a 10/10 sem tocar no runtime PubPaid: removidos templates antigos de resumo/lede (`A fonte consultada traz a base...`, `redacao automatica`, `ponto principal...`) de `data/runtime-news.json` e `news-data.js`.
- Captura, servidor e ciclo dos agentes agora evitam recriar esse texto generico; fallback fica no fato confirmado, impacto pratico e acompanhamento.
- Adicionado gate editorial automatico: `editorialGate`, `editorialApproval`, `editorialSpotlightReady`, `editorialSurfaceTier`, `editorialLocalTier` e `sourceCount`; materias sensiveis, avisos burocraticos e remoto secundario seguem no acervo, mas nao competem pela primeira dobra.
- Ranking da home/API passou a priorizar Juruá/Cruzeiro do Sul primeiro, Acre depois, serviço nacional util depois e remoto secundario no fundo.
- Validacao local: `node --check` em `server.js`, `script.js`, `scripts/agents-autonomy-cycle.js` e `scripts/capture-latest-news.js`; `npm run agents:cycle`; `npm run review:team` com PubPaid guard OK e `totalIssues: 0`; `npm run editorial:health` OK; `npm run perf:budget` OK nao estrito com divida antiga em `styles.css`; smoke local em `:3081` confirmou home 200, `/api/news?limit=10&lite=1`, build PubPaid `20260522-boardfit1` e top 10 com `tier=3`, `ready=true`, `surface=news`.

## Rodada Atual - 20260522-pvpqa1

- PubPaid PvP validado sem alterar runtime: build online Render `20260522-boardfit1` confirmado em `/api/pubpaid/build` e `/pubpaid.html` HTTP 200 contendo o mesmo build.
- Travas locais: `node --check` em `server.js`, `pubpaid-phaser/app.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/services/pvpService.js`, `pubpaid-phaser/services/accountService.js` e `games/vale-pool/game.js`; `npm run guard:pubpaid`; `npm run review:team` com `totalIssues: 0`.
- Contrato PvP em `DATA_DIR` isolado: duas sessoes autenticadas sinteticas passaram por auth obrigatoria, saldo, escrow, pareamento, `Estou pronto` dos dois lados, setup/tacada da Sinuca, lance de Damas, lance de Xadrez e settlement financeiro.
- Browser local carregou PubPaid sem console errors na tela inicial; login Google real em navegador e partida completa com duas contas reais ainda ficam como recomendacao antes de operar dinheiro de usuario em producao.

## Rodada Atual - 20260522-editorial10a

- CZS/editorial refinado sem misturar com PubPaid: home passou a pre-carregar `/api/news?limit=60&lite=1`, enquanto materias por slug continuam com corpo completo.
- API `/api/news` ganhou modo `lite=1`, removendo `body`, `highlights` e `development` do payload inicial da home e mantendo campos de capa, fonte, imagem, prioridade e slug.
- Medicao local: fetch antigo `limit=80` completo = 233112 bytes; novo `limit=60&lite=1` = 121138 bytes; economia de 48,0% no primeiro carregamento de noticias.
- Fallback editorial do servidor e dos agentes trocado para o padrao `fato confirmado -> impacto pratico -> o que seguir`, sem copy antiga de `redacao automatica`, `base desta noticia` ou `ponto principal da atualizacao captada automaticamente`.
- `scripts/agents-autonomy-cycle.js` agora normaliza tambem `activeWindowItems`, evitando que a janela ativa de noticias mantenha texto editorial antigo quando `items` ja esta limpo.
- Validacao local: `node --check` em `server.js` e `scripts/agents-autonomy-cycle.js`; `npm run agents:cycle`; `npm run review:team` com PubPaid guard OK e `totalIssues: 0`; `npm run perf:budget` OK em modo nao estrito, com divida antiga ainda marcada em `styles.css`; HTTP local em `:3064` confirmou home 200, preload lite, payload sem `body` e materia por slug com novo corpo editorial.

## Rodada Final - 20260522-final-sweep1

- Frentes separadas: Projeto Codex/CZS e PubPaid continuam no mesmo repo, mas devem ser tratados como sistemas diferentes; nao puxar regras de jogo para home/editorial nem puxar CZS para runtime PubPaid sem pedido explicito.
- Backup de rollback criado antes da limpeza: `.codex-backups/final-sweep-20260522-132315`.
- Ajuste final aplicado: Xadrez PubPaid voltou ao fluxo correto `video -> creditos -> moeda -> tabuleiro`, alinhado com Damas e evitando moeda antes da intro.
- Limpeza segura executada: removidos `output/`, `debug.log`, `scripts/__pycache__/`, `backend/node_modules/pngjs/coverage` e `data/pubpaid-tournaments.json` local de runtime; `.gitignore` passou a ignorar `debug.log` e `output/web-game/`.
- O audit de limpeza restante aponta apenas `backend/node_modules/qs/dist`; foi preservado por ser parte de dependencia instalada.
- Validacao local: `node --check` em arquivos tocados, `git diff --check`, `npm run cleanup:audit`, `npm run review:team` com PubPaid guard OK e `totalIssues: 0`, HTTP local em `:3062`, Browser desktop/mobile sem console errors.
- Browser QA: home desktop/mobile carregou conteudo sem overlay; PubPaid Xadrez mobile landscape mostrou creditos, depois liberou tabuleiro com 64 casas/32 pecas, sem overflow horizontal.
- Online confirmado apos push: Render respondeu `/api/pubpaid/build=20260522-boardfit1`, `/pubpaid.html` contem `20260522-boardfit1`, home HTTP 200 contem `20260522-homegate3`, e `/api/news?limit=1` respondeu OK.

## Rodada Atual - 20260522-homegate3

- Home CZS: carrossel de manchetes manteve 15 fotos e ganhou setas visiveis mais arrasto/puxar no trilho para ver as fotos que ficam fora da area inicial.
- Hero: CTA `Ler matéria` segue apontando para a noticia real em destaque.
- Cache-bust local: `20260522-homegate3`.
- Validacao: `node --check` em `script.js` e `scripts/review-team-audit.js`; `git diff --check`; `npm run review:team` com PubPaid guard OK e `totalIssues: 0`; Playwright desktop 1366x768 e mobile 390x844 confirmou carregamento sem overlay, 15 fotos, setas funcionando, arrasto funcionando e console limpo.

## Rodada Atual - 20260522-lobbywaiter1

- Build local atual: `20260522-boardfit1`.
- Xadrez/Damas PubPaid: estabilizado o controle de tabuleiro para nao alternar visualmente entre camera e jogo; clique/arrasto no miolo nao gira mais a mesa, camera fica nas bordas, botao do meio e pinch.
- Xadrez: pecas reduzidas e travadas dentro das casas, com geometria 3D mais baixa, sem animacao de pouso alterando transform/altura entre lances e sem alternar para versao chapada em viewport mobile.
- Validacao: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; HTTP local em `:3036`; browser in-app confirmou 64 casas/32 pecas no Xadrez, frame `default`, casas/pecas `pointer`, borda `grab`; Damas confirmou 64 casas/24 pecas e mesmo isolamento de controle; Playwright mobile landscape 844x390 confirmou Xadrez e Damas fora de cinematic, pecas com cursor `pointer`, frame `default` e bordas de camera reduzidas.

- Xadrez PubPaid: intro corrigida para nao disparar moeda antes do video terminar; removido salto de `onloadedmetadata` para o fim do video e `onended` agora so avanca se a fase ainda for `video`.
- Fluxo validado como Damas: video -> creditos -> moeda -> tabuleiro liberado; fallback do Xadrez segura tempo suficiente para o video de 5s e evita chamada dupla.
- Validacao local: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; `web_game_playwright_client`; Playwright mobile landscape e desktop no servidor `:3047` com 64 casas, 32 pecas, moeda apos creditos e tabuleiro liberado.
- Evidencias: `.codex-temp/chessintrofix/mobile-final-01-video.png`, `.codex-temp/chessintrofix/desktop-final-coin.png` e `.codex-temp/chessintrofix/desktop-final-board.png`.

## Rodada Atual - 20260522-pooltouchaim1

- Sinuca/Vale Pool mobile recebeu correcao de controle: arrastar/segurar no canvas agora apenas ajusta a mira e nao dispara o click sintetico que iniciava a força.
- Toque curto/parado continua avancando para a etapa de força; toque seguinte taca.
- Canvas do prototipo recebeu `touch-action: none` para o navegador nao roubar o gesto no celular.
- Build/cache-bust local: `20260522-pooltouchaim1`.
- Validacao: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `web_game_playwright_client`; Playwright touch controlado em 844x390 confirmou arrasto permanecendo em `mira` e toque curto indo para `forca`; servidor local em `:3038` respondeu `/api/pubpaid/build=20260522-pooltouchaim1`.
- Revalidacao apos cache-bust paralelo: servidor local em `:3039` respondeu `/api/pubpaid/build=20260522-lobbywaiter1` e o mesmo teste touch confirmou `mira` apos arrasto e `forca` apos toque curto, sem erros de console.
- Evidencia: `.codex-temp/vale-pool-pooltouchaim1/demo-touch-controlled.png`.

## Rodada Atual - 20260522-tournamentpay1

- Torneio de Damas PubPaid: cadastro corrigido para abrir uma janela de pagamento separada com nome, WhatsApp, nome do depositante e valor fixo de R$ 50,00.
- Fluxo mantido: jogador toca em `Ja paguei`, aguarda aprovacao manual do admin, e a chave da vaga so e devolvida para a conta Google depois da aprovacao.
- Admin PubPaid agora mostra o nome do depositante nas reservas pendentes do torneio.
- Build/cache-bust local: `20260522-tournamentpay1`.
- Validacao: `node --check` em `server.js`, `pubpaid-phaser/ui/domGameInterface.js` e `pubpaid-phaser/services/tournamentService.js`; `npm run guard:pubpaid`; `git diff --check`; smoke HTTP local em `:3056` confirmou `/api/pubpaid/build=20260522-tournamentpay1`, campo do depositante, valor R$ 50,00 e chave escondida antes da aprovacao.

## Rodada Atual - 20260522-boardtouch1

- PubPaid Damas/Xadrez: removida a camera-orb com setas, zoom e icone de camera que ficava sobrepondo o tabuleiro.
- Mantido apenas o botao `Mesa fixa/Girar rival`, posicionado como pill discreto no canto do tabuleiro.
- Mobile/touch continua por gesto na mesa; desktop recebe apenas dica discreta para borda/roda, sem painel de controles no meio do jogo.
- Build/cache-bust local: `20260522-boardtouch1`.
- Validacao: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; HTTP local em `:3034` confirmou `/api/pubpaid/build=20260522-boardtouch1`, `pubpaid.html` sem botoes de seta/zoom/camera e auditoria com CTA/UI/idioma publico 0.

## Rodada Atual - 20260522-articleturn1

- Popup da home: copy refeita para anunciar PubPaid e Enquete Acre 2026 como duas escolhas claras, com icones, descricao e botoes dedicados.
- Materia: carregamento de entrada ficou explicito e a abertura/volta ganharam animacao de virada de folha.
- Retorno da materia: alem do botao flutuante, a pagina agora tem botao de voltar dentro do artigo, visivel tambem no desktop, sempre usando `index.html?skipIntro=1`.
- Cache-bust local: `20260522-articleturn1`.
- Validacao: `node --check` em `noticia.js` e `script.js`; `git diff --check`; HTTP local em `:3033` respondeu home, materia e `/api/news?limit=3`; auditoria local com idioma publico 0 e achados restantes medios/pre-existentes de loading/controles.

## Rodada Atual - 20260522-catalogreactivate1

- Catalogo CZS reativado no fluxo publico de `catalogo-servicos.html` com popup de entrada chamando para `PubPaid` e para a Enquete Acre 2026.
- Enquete Acre 2026 reaberta como rodada manual `2026-W21-czs1`, ativa ate `2026-06-06T04:59:59.999Z`; o backend ignora configuracao persistente mais antiga do Render quando ela for anterior a `2026-05-22T05:00:00.000Z`.
- Criado `npm run cleanup:audit` para viabilizar limpeza extrema com areas protegidas (`data/`, `.codex-memory/`, `.codex-backups/`, `assets/pubpaid/`, `games/vale-pool/`, `pubpaid-phaser/` e `render-data/`) antes de qualquer remocao destrutiva.
- Validacao local: `node --check` em `server.js`, `catalogo-servicos.js` e `scripts/cleanup-extreme-audit.js`; `npm run guard:pubpaid`; `npm run cleanup:audit`; servidor local em `:3017` respondeu `catalogo-servicos.html`, `pesquisa-acre-2026.html`, `/api/pesquisa-acre-2026/summary`, `/api/pesquisa-acre-2026/me` e `/api/pubpaid/build`; Playwright-core validou popup desktop/mobile sem erros de console.

## Rodada Atual - 20260522-homecatch1

- Home: popup PubPaid + Enquete Acre 2026 agora aparece na home apos a intro, com trava diaria por `localStorage`.
- Primeira dobra: intro espera hero e primeiras secoes receberem noticias via `/api/news` ou fallback seguro; `renderEditorialUtilityFlow` tambem roda com os dados dinamicos.
- Hero: CTA principal virou `Ler matéria` e aponta para a materia da foto/noticia exibida.
- Materia: adicionado botao flutuante `Voltar para a home` usando `index.html?skipIntro=1`, para evitar repetir a intro no retorno mobile.
- Fontes/captacao: adicionadas `Jurua em Tempo`, `Voz do Norte`, `Acre in Foco` e `Folha do Acre`; `The Verge` foi desativado por risco de texto publico em ingles.
- Captacao 2026-05-22: `node scripts/capture-latest-news.js` captou 269 itens, 95 de hoje, com fontes novas OK.
- Validacao: `node --check` em `backend/source-config.js`, `script.js`, `noticia.js` e `server.js`; `node scripts/guard-pubpaid-no-canvas.js`; `node scripts/review-team-audit.js` zerou vazamento de ingles publico, restando apenas achados medios antigos/false-positive de loading em PubPaid/game demo; HTTP local em `:3022` respondeu home, noticia, `/api/news?limit=5` e `/api/pubpaid/build`; navegador confirmou popup visivel, CTA `Ler matéria`, Instagram e hero/noticias reais sem console errors.

## Rodada Atual - 20260522-gameux2

- Damas/Xadrez: camera mobile saiu dos controles-orbe e passou a priorizar gesto nativo, com pinch para zoom e arrasto pelas bordas da mesa; controles touch globais ficam ocultos nessas mesas.
- Desktop: bordas/frame da mesa de Damas e Xadrez aceitam arrasto com mouse para girar/panar, alem de roda para zoom.
- Damas: intro de abertura encurtada em 2 segundos no tempo padrao e no modo `intro=1`, mantendo transicao para creditos/moeda.
- Audio: temas de Sinuca, Damas e Xadrez viraram 32-bit brasileiros originais, inspirados em samba-rock/pagode, forro/axe e bossa/funk leve sem copiar melodias protegidas.
- Build/cache-bust local: `20260522-gameux2`.
- Validacao: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/audio/chipTechSoundtrack.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `/api/pubpaid/build=20260522-gameux2`; smoke mobile Damas e Xadrez com 64 casas, sem controles intrusivos e sem erros de console; smoke desktop Xadrez com arrasto na borda direita mudando `--ppg-chess-user-yaw` para `-11.68deg`.

## Rodada Atual - 20260522-poolreturn1

- Sinuca aprovada mantida sem redesenho e PubPaid recebeu retorno claro para o lobby: no treino aparece `Voltar ao lobby`, no PvP continua `Desistir`, e o fim da demo abre o painel de resultado com `Voltar às mesas`.
- `review=pool`, `review=sinuca` e `review=vale-pool` agora inicializam o fluxo de treino da sinuca para revisão direta.
- Build/cache-bust publicado como `20260522-poolreturn1`.
- Validação: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --cached --check`; servidor local respondeu `/api/pubpaid/build=20260522-poolreturn1`; online Render respondeu `/api/pubpaid/build=20260522-poolreturn1`.
- Observação: ficaram mudanças locais não relacionadas em dados/notícias/automação e em um trecho solto de torneio de Damas no `server.js`; elas não entraram no commit de cache-bust da sinuca.

## Rodada Atual - 20260522-gameux1

- PubPaid Damas/Xadrez recebeu loader de abertura que espera assets/cache/fontes/imagens antes de soltar a intro.
- Damas e Xadrez entram com mesa fixa por padrao (`turnYaw=0deg`) e botao para alternar `Mesa fixa/Girar rival`.
- Camera agora aceita arrasto na borda da mesa, zoom por roda no desktop e controles de toque compactos no mobile, com copy diferente para cada contexto.
- Xadrez recebeu botao `Sair/Desistir` dentro da arena fullscreen e HUD lateral reduzido para nao sobrepor o tabuleiro.
- Torneio de Damas mantem fluxo real: reserva com Google/WhatsApp, Pix/referencia, aprovacao manual no admin e check-in apenas para vaga aprovada.
- Validacao local: `node --check` em arquivos tocados, `npm run guard:pubpaid`, `/api/pubpaid/build=20260522-gameux1`, Playwright desktop/mobile para Damas e Xadrez sem erros de console.

## Protocolo Comercial - Propagandas

- Para automacoes de WhatsApp/Facebook/Instagram, usar o protocolo local `.codex-memory/propaganda-automation-protocol.md`.
- Regra curta: WhatsApp primeiro por categoria; grupos de venda recebem gift cards/servicos digitais/T.I; grupos Uber/transporte recebem somente motorista particular; Facebook Marketplace vem depois com anuncios separados; Instagram fica sempre por ultimo e so quando o usuario mandar abrir.
- Usar sempre plugin/controle direto quando a tarefa envolver apps abertos; nunca postar por clique cego em conversa individual.

## Rodada Atual - 20260520-polishcam1

- Damas e Xadrez PubPaid receberam acabamento visual sem mudar o fluxo aprovado: Damas manteve a arena 3D, mas as pedras agora sao redondas e com contraste forte contra o tabuleiro.
- Xadrez manteve fullscreen e mesa 3D, trocou a antiga maozinha por seta, recebeu setas na porta de entrada e nos hotspots do salao, pecas mais altas e contraste melhor entre brancas e pretas.
- Controles de camera de Damas e Xadrez viraram uma bolinha direcional com icone de camera no centro, botoes de giro, subir/descer e zoom, preservando arrasto/toque na mesa.
- Ajuste posterior `20260520-polishcam2`: reduziu o tamanho/altura das pecas do Xadrez depois da captura mostrar que ficaram grandes demais.
- Build local: `20260520-polishcam1`.
- Validacao local: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js`, `pubpaid-phaser/scenes/StreetScene.js`, `pubpaid-phaser/scenes/InteriorScene.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; smoke Xadrez mobile e desktop; smoke Damas desktop e mobile.
- Evidencias locais: `.codex-temp/chess3d-mobile.png`, `.codex-temp/chess3d-desktop.png`, `.codex-temp/checkerscam-desktop.png` e `.codex-temp/checkerscam-mobile.png`.

## Rodada Atual - 20260520-poolmobileintro1

- Sinuca/Vale Pool manteve a arte aprovada e recebeu entrada curta com taco batendo na bola branca, explosao de pixels e revelacao da mesa.
- Mobile/touch agora joga em duas etapas: o primeiro toque depois de mirar abre a força, e o segundo toque solta a tacada.
- Mantidas as correcoes de `poolhand1`: fim correto do modo Livre quando sobram apenas a branca e `bola na mão` com posicionamento da branca antes da tacada.
- Build local: `20260520-poolmobileintro1`.
- Validacao: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/services/pvpService.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; `/api/pubpaid/build` na porta 3001 respondeu `20260520-poolmobileintro1`; Playwright mobile landscape confirmou `MIRANDO` + etapa `forca` no primeiro toque e `TACANDO` no segundo.
- Evidencias: `.codex-temp/vale-pool-poolmobileintro1/intro.png`, `.codex-temp/vale-pool-poolmobileintro1/mobile-power-stage.png` e `.codex-temp/vale-pool-poolmobileintro1/mobile-shot-released.png`.

## Rodada Atual - 20260520-chessstyle1

- Xadrez PubPaid recebeu o mesmo ritmo visual aprovado na Damas: arena mais cinematica, mesa com luzes, texto centralizado no fluxo existente e leitura mais clara da vez do adversario.
- Na Demo, o jogador fica com as brancas; a maquina joga de pretas, pensa por 3 segundos, destaca origem/alvo do lance e so depois executa o movimento, liberando a vez do jogador novamente.
- Mantido o fluxo padrao PubPaid: Demo como treino local sem ficha/carteira e PvP pelo matchmaking/ready real.
- Build local: `20260520-chessstyle1`.
- Validacao: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; servidor local na porta 3002 respondeu `/api/pubpaid/build=20260520-chessstyle1`; Playwright mobile landscape confirmou 64 casas, 32 pecas, IA pensando com preview, `moveCount` parado no meio da pausa e lance aplicado depois.
- Online: Render respondeu `/api/pubpaid/build=20260520-chessstyle1` e o smoke mobile landscape tambem passou no Render.
- Evidencias: `.codex-temp/chessstyle-mobile.png` e `.codex-temp/chessstyle-mobile-render.png`.
- Observacao: a ordem posterior sobre postar noticias em grupo de vendas foi cancelada pelo usuario e deve ser ignorada.

## Rodada Atual - 20260520-chess3d1

- Correcao de direcao: o usuario rejeitou a primeira versao do Xadrez por parecer uma janela pequena; o objetivo correto era replicar o modelo visual 3D aprovado na Damas.
- Xadrez Demo agora usa mesa grande em perspectiva, frame 3D, pecas volumosas, luzes de arena, rotação automatica para a vez adversaria, botões de camera e suporte a zoom/arrasto.
- Mantido o comportamento que ja estava aprovado: IA da Demo pensa por 3 segundos, destaca origem/alvo, executa o lance e libera a vez do jogador.
- Build local: `20260520-chess3d1`.
- Validacao local: `node --check`, `npm run guard:pubpaid`, `git diff --check`, smoke Playwright mobile landscape com frame 3D/camera/IA e smoke desktop com mesa grande.
- Online: Render respondeu `/api/pubpaid/build=20260520-chess3d1` e o smoke mobile landscape online tambem passou com frame 3D, 5 controles de camera, rotacao aplicada, 64 casas, 32 pecas e IA com pausa de 3 segundos.
- Evidencias: `.codex-temp/chess3d-mobile.png`, `.codex-temp/chess3d-desktop.png` e `.codex-temp/chess3d-render-mobile.png`.

## Rodada Atual - 20260520-chessfull1

- Nova regra do usuario: Xadrez deve ser sempre tela cheia, sem aparecer como quadro dentro de pagina.
- O modo chess agora fixa a arena em `100dvw x 100dvh`, esconde header/placar/acoes externas e deixa o painel lateral como overlay; em mobile landscape a mesa 3D toma o viewport inteiro.
- Build local: `20260520-chessfull1`.
- Validacao local: `node --check`, `npm run guard:pubpaid`, `git diff --check`, smoke Playwright mobile landscape e smoke desktop.
- Evidencias locais: `.codex-temp/chess3d-mobile.png` e `.codex-temp/chess3d-desktop.png`.

## Rodada Atual - 20260520-checkersai1

- Damas Demo ficou mais legivel na vez da IA: a maquina entra em estado `Máquina pensando...`, segura a jogada por 3 segundos, destaca a peça de origem e a casa alvo, e só depois executa o movimento.
- Entrada PubPaid recebeu loader antes da intro: ao tocar para entrar, a tela mostra carregamento de 0 a 100% e só então abre a intro, reduzindo risco de tela preta entre splash e Phaser.
- Build local: `20260520-checkersai1`.
- Validação: `node --check` em `pubpaid-phaser/app.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/scenes/BootScene.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; Playwright mobile landscape confirmou loader `100%`, IA com status de 3 segundos, preview visual e `moveCount` parado no meio/avançando após a pausa.
- Evidência: `.codex-temp/checkersai-mobile.png`.

## Rodada Atual - 20260520-poolhand1

- Sinuca/Vale Pool recebeu correção de fim de mesa no modo Livre: quando acabam as bolas de ataque e fica só a branca, o jogo entra em `FIM` e mostra vencedor/empate.
- Falta de bola branca agora aplica `bola na mão`: o adversário ganha a vez e pode posicionar a branca antes de tacar.
- Na Demo, quando a IA ganha bola na mão ela posiciona automaticamente; quando o jogador ganha, o primeiro clique na mesa posiciona a branca e o clique seguinte joga.
- No PvP, o servidor grava `ballInHandSeat`; o cliente envia `cueX/cueY` para a próxima tacada e bloqueia o tiro até o jogador posicionar a branca.
- Build local: `20260520-poolhand1`.
- Validação: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/services/pvpService.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `/api/pubpaid/build` respondeu `20260520-poolhand1` na porta 3001; Playwright direcionado confirmou `bolaNaMao: player -> ""` após posicionar e modo Livre vazio encerrando em `FIM`.
- Evidências: `.codex-temp/vale-pool-poolhand1/ball-in-hand-placed.png` e `.codex-temp/vale-pool-poolhand1/free-mode-finished.png`.

## Rodada Atual - 20260520-checkerscam1

- Damas PubPaid recebeu a direção do CSV `C:\Users\junio\Downloads\table-1779287972054.csv`.
- Mantido o fluxo padrão: card único de Damas, `Demo` como treino local sem ficha/carteira e `PvP` pelo matchmaking/ready real.
- Arena de Damas ganhou intro cinematica em DOM/CSS, moeda de abertura, controles de câmera, zoom por wheel, rotação/pan pela moldura, virada suave da câmera para o adversário quando a vez muda, luzes/colunas e SFX extra para moeda/coroação.
- Correção posterior: textos centralizados e a moeda agora bloqueia só durante a abertura; ao terminar, ela some, re-renderiza o tabuleiro e libera a partida. O fim de jogo continua no fluxo normal de resultado.
- Build local: `20260520-checkerscam1`.
- Validação: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; servidor local na porta 3002 respondeu `/api/pubpaid/build=20260520-checkerscam1`; Playwright smoke passou em desktop 1280x720 e mobile landscape 844x390 com `cells=64`, `enabledCells=64`, `coinHidden=true` e painel dentro do viewport.
- Observação: revisar visual manualmente em `http://127.0.0.1:3002/pubpaid.html?v=20260520-checkerscam1&review=damas` e validar PvP real em duas sessões autenticadas antes de fechar fluxo financeiro.

## Rodada Atual - 20260520-poolturn1

- Sinuca/Vale Pool manteve a arte aprovada e recebeu correção de execução no Par/Impar.
- Quando a bola branca cai, Demo e PvP passam a vez para IA/rival de forma explícita, sem prender a vez no jogador 1.
- Par/Impar agora comunica melhor os grupos: antes da primeira bola aparece `DEFINE GRUPO`; depois os cartões/HUD mostram `VOCE/RIVAL/IA: PAR` ou `IMPAR`.
- Após as escolhas da moeda, Demo e PvP exibem uma animação de `MODO ESCOLHIDO` antes do tutorial da modalidade.
- Build local: `20260520-poolturn1`.
- Validação: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js`, `server.js` e `pubpaid-phaser/app.js`; `npm run guard:pubpaid`; `/api/pubpaid/build` respondeu `20260520-poolturn1` na porta 3001; Playwright capturou animação e tutorial Par/Impar sem erro.
- Evidências: `.codex-temp/vale-pool-poolturn1/mode-reveal.png` e `.codex-temp/vale-pool-poolturn1/tutorial.png`.

## Rodada Atual - 20260520-poolrules1

- Sinuca/Vale Pool manteve a arte aprovada e recebeu clareza jogavel das regras dentro da HUD.
- Cartoes laterais do jogador/Robo IA/PvP agora mostram a regra ativa do modo: Livre, Brasileira ou Par/Impar.
- Botao `REGRAS` nos cartoes abre manual pop-up com alvo permitido, pontuacao, faltas e condicao de vitoria; fechar retorna direto para a partida.
- Livre mostra regra viva `qualquer bola 1-9`; Brasileira mostra a menor bola viva como `bola da vez`; Par/Impar mostra `1a bola define PAR/IMPAR`, depois grupo PAR/IMPAR e bolas restantes do grupo.
- Servidor PvP ja define grupo PAR/IMPAR pela primeira bola encaçapada valida e agora devolve mensagem explicita de grupo definido.
- Build local: `20260520-poolrules1`.

## Rodada Atual - 20260519-standalone-pool11

- Sinuca/Vale Pool deixou de ser tratada como teste e foi promovida como build ativo do PubPaid.
- Caçapas abertas visualmente para o lado do pano, removendo o fechamento superior que dificultava a leitura da boca.
- Captura real ampliada no prototipo e no PvP do servidor; a detecção agora considera o trajeto entre frames para a bola cair em vez de bater na boca e voltar.
- Build local: `20260519-standalone-pool11`.

## Rodada Atual - 20260519-standalone-pool10

- Sinuca/Vale Pool recebeu moeda animada e fluxo complementar: vencedor da moeda escolhe apenas `ser primeiro` ou `modalidade`; perdedor escolhe a parte restante.
- Depois das escolhas, Demo/IA e PvP mostram tutorial curto da modalidade antes da mesa.
- Demo/IA só começa depois de `COMEÇAR PARTIDA`; PvP só libera tacada depois que os dois jogadores confirmam o tutorial.
- Conhecimento repassado para a equipe de jogos em `.codex-agents/game-director-system/projects/vale-pool.md` e para a skill `game-director-general/references/pool-modalities.md`.
- Build local: `20260519-standalone-pool10`.

## Rodada Atual - 20260519-standalone-pool8

- Sinuca/Vale Pool recebeu modalidades jogaveis: Livre, Brasileira e Par/Impar.
- Fluxo inicial consolidado para Demo/IA e PvP: joga moeda; vencedor escolhe comecar ou escolher modalidade; quem escolhe modalidade joga por segundo.
- Livre usa branca + bolas 1-9 e placar `BOLAS`.
- Brasileira usa branca + sete coloridas oficiais (1 vermelha, 2 amarela, 3 verde, 4 marrom, 5 azul, 6 rosa, 7 preta), bola da vez menor em mesa e placar `PONTOS`; bola 9 nao entra neste modo.
- Par/Impar usa branca + bolas 2-15, primeiro encaçape define grupo PAR/IMPAR e a 15 fecha/castiga.
- PvP ganhou endpoint `/api/pubpaid/pvp/pool/setup`, estado de escolha inicial no servidor, rack por modalidade e bloqueio de tacada antes de finalizar a moeda/modalidade.
- Conhecimento consolidado na skill `game-director-general`: `C:\Users\junio\.codex\skills\game-director-general\references\pool-modalities.md`.
- Build local: `20260519-standalone-pool8`.
- Validacao: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/services/pvpService.js` e `server.js`; `npm run guard:pubpaid`; servidor local respondeu `/api/pubpaid/build=20260519-standalone-pool8`; capturas no in-app browser confirmaram moeda, escolha inicial, menu de modalidades e modo Brasileira com 7 bolas.
- Evidencias: `.codex-temp/vale-pool-pool8-moeda.png`, `.codex-temp/vale-pool-pool8-moeda-tentativa2.png`, `.codex-temp/vale-pool-pool8-modalidades.png`, `.codex-temp/vale-pool-pool8-brasileira.png`.

## Rodada Atual - 20260519-standalone-pool5

- Sinuca PubPaid substituida pelo prototipo aprovado `Vale Pool Round2`, agora promovido para `games/vale-pool/` e embutido no PubPaid por iframe controlado.
- Fluxo Demo preservado: entra no prototipo sem ficha, sem escrow e sem carteira. Fluxo PvP preservado: servidor continua dono do estado, com fotos/nomes Google dos dois jogadores em paineis laterais fora do jogo.
- O jogo tem 1 bola branca e 9 bolas de jogo em rack compacto, todas do mesmo tamanho, e lista `BOLAS FORA` no HUD.
- Musica relaxante 16-bit estilo Super Nintendo adicionada ao prototipo; por politica do navegador ela inicia apos interacao do jogador.
- Correção funcional: Demo recebeu eventos de mouse/teclado no iframe, jogador vs Robo IA, fotos/avatares externos, mira por mouse/teclado, ponto de batida na bola branca por HUD/teclas 1-5, historico de jogadas e fisica de efeito relativa a tacada.
- Corte de HUD: bloco superior esquerdo agora mostra `VEZ` em vez de pontuacao; placar do single player fica nos cartoes laterais Jogador/Robo IA, atualizados por `vale-pool:demo-state`.
- Controle de efeito: ponto vermelho clicavel livremente dentro da bola branca do HUD; ao voltar para `CENTRO` ele recentraliza, e o vetor do ponto de impacto altera a fisica da tacada.
- Correção rápida: pontuação abstrata removida da leitura principal; cartões laterais agora mostram explicitamente `BOLAS` encaçapadas e a regra declarada e Bola 9.
- Fisica de caçapa corrigida no prototipo: a boca captura antes do repique no trilho e teste dirigido confirmou a branca caindo/respawnando.
- Responsividade ampliada: iframe/jogo usam mais largura em desktop e mantem proporcao 16:9 para mobile horizontal.
- Força reforçada: velocidade base e pico da tacada aumentados para a barra ter impacto perceptivel.
- Build local: `20260519-standalone-pool5`.
- Validacao: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js` e `server.js`; `npm run guard:pubpaid`; teste funcional Playwright no PubPaid com `pointerEvents=auto`, efeito `DIR`, mira mudando, tacada do jogador, resposta da IA, cartoes laterais atualizados e retorno para `MIRANDO`; teste dirigido de caçapa com branca caindo/respawnando; cliente `develop-web-game` com screenshot e estado direto do prototipo.
- Evidencias: `.codex-temp/pubpaid-vale-pool-effect-control.png`, `.codex-temp/pubpaid-vale-pool-demo-functional.png`, `.codex-temp/pubpaid-vale-pool-pocket-test.png`, `.codex-temp/web-game-vale-pool/shot-1.png`, `.codex-temp/vale-pool-public-demo.png`, `.codex-temp/pubpaid-vale-pool-demo.png` e `.codex-temp/pubpaid-vale-pool-pvp.png`.

## Rodada Atual - 20260519-poolreal1

- Sinuca PubPaid refeita pela referencia de mesa real enviada pelo usuario: caçapas agora aparecem como bocas integradas na madeira/borracha, nao como circulos soltos no feltro.
- A faixa `Sinuca demo`/treino livre foi removida de cima da mesa em todos os tamanhos; informacao fica no painel inferior.
- Painel inferior ganhou lista `bolas encaçapadas`, preenchida pelas bolas que caem durante a partida.
- Build local: `20260519-poolreal1`.
- Validacao: `/api/pubpaid/build=20260519-poolreal1`, `node --check`, `npm run guard:pubpaid`, `node .codex-temp/pubpaid-mobileopt-check.mjs` com `failed=[]`, `demoPoolHeroVisible=false`, `demoPoolPocketedVisible=true` e `music=off`.
- Evidencias: `.codex-temp/pubpaid-mobileopt-pool-844x390.png` e `.codex-temp/pubpaid-poolreal1-pocketed-list.png`.

## Rodada Atual - 20260519-poolfix2

- Sinuca PubPaid ajustada pelo PNG de revisao: caçapas fisicas e DOM ficaram embutidas na mesa, mesa centralizada em mobile landscape e topbar global escondida durante Sinuca para nao haver informacao em cima da mesa.
- Build local: `20260519-poolfix2`.
- Validacao: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260519-poolfix2`; `node --check` em `PoolGameScene.js`, `domGameInterface.js`, `app.js` e `.codex-temp/pubpaid-mobileopt-check.mjs`; `npm run guard:pubpaid`; `node .codex-temp/pubpaid-mobileopt-check.mjs` passou com `failed=[]`, `music=off`, retrato bloqueado e paisagem responsiva.
- Evidencias: `.codex-temp/pubpaid-mobileopt-pool-844x390.png` e `.codex-temp/pubpaid-mobileopt-report.json`.

## Regra De Existencia

So existe um projeto de jogo PubPaid no Codex: o PubPaid 2.0 canonico, servido por `/pubpaid.html`.

O nome publico pode continuar PubPaid, mas tecnicamente nao ha PubPaid 1.0 ativo, demo separada, rota antiga de trabalho ou laboratorio anexado ao runtime.

## Canon PubPaid

- URL canonica: `/pubpaid.html`
- Compatibilidade antiga: `/pubpaid-v2.html` redireciona para `/pubpaid.html`
- Runtime: `pubpaid-phaser/`
- Shell: `pubpaid.html`
- Estilo: `pubpaid-phaser.css`
- Backend: `server.js`
- Carteira: `pubpaid-runtime.js` e `data/pubpaid-store.json`
- PvP: `data/pubpaid-pvp.json`
- Admin: `pubpaid-admin.html`

## O Que Virou Lixo

- `pubpaid-v2.js`, `pubpaid-v2.css` e `pubpaid-phaser.html` foram removidos.
- Prompts, relatorios, screenshots antigas, jogo externo de roleta e artefatos de validacao antigos foram removidos do Git.
- `CODEX_MEMORY.md`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md`, `.codex-memory/orders.json`, `.codex-memory/assets.json` e `progress.md` foram reduzidos para o estado vivo atual.

## Regras De Trabalho

- Modo economico por padrao: leitura minima, respostas curtas e validacao proporcional.
- Nao abrir memorias extensas, docs grandes, auditorias ou varreduras amplas sem necessidade clara do pedido.
- Gastar contexto pesado apenas em PubPaid, homepage/CZS, deploy, revisao grande ou mudanca com risco real.
- Tratar jogo como jogo e site como site: estao no mesmo repo, mas sao frentes diferentes.
- Nao aplicar agentes, regras editoriais, revisao de cards/homepage ou contexto do site ao jogo, exceto se o usuario pedir explicitamente.
- Nao usar demo money nem IA local como prova de PvP.
- Demo local e permitido apenas como treino/teste visual separado, sem ficha, sem escrow, sem carteira e sem alterar saldo.
- Nao considerar teste API isolado como prova de jogo real.
- Validar PvP em duas sessoes autenticadas diferentes sempre que mexer no fluxo.
- Nao usar laboratorio, criador de imagem, prompt antigo ou screenshot antiga como fonte de verdade.
- Antes de validar PubPaid: `npm run guard:pubpaid`.

## Sistema Diretor De Jogos

- Skill global: `game-director-general`
- Prompt mestre: `.codex-agents/game-director-system/master-prompt.md`
- Fluxo: `.codex-agents/game-director-system/flow.md`
- Estudo inicial: `.codex-agents/game-director-system/study-report-2026-05-18.md`
- Manifestos: `.codex-agents/agents/game-*.md`
- Hierarquia: usuario acima; Codex/Hermes como ferramentas finais; Diretor Geral coordena; Conselho Tecnico Nerd alimenta; Diretor do Jogo lidera operacao; subagentes executam/revisam.
- Subagentes diretos: arte/design de games, interfaces/HUD, teste/seguranca gamer e linha final.
- Escritorio Nerd pode alimentar conhecimento tecnico, mas nao mistura direcao de jornal/CZS com direcao de jogos.
- Erros e acertos em jogos devem virar loop de aprendizado/reaprendizado antes de repetir implementacao.

## Direcao De Arte PubPaid

- Anchor oficial de arte: `assets/game-director-demo/realistic-host-spritesheet.png`. O caminho antigo em `.codex-temp/pixellab-tests/realistic-host-walk-demo/assets/realistic-host-spritesheet.png` ficou apenas como origem historica e pode nao existir em retomadas novas.
- Tudo novo deve parecer da mesma familia desse personagem: pixel art com leitura de sprite, mas volume, roupa, luz, proporcao e presenca super realistas.
- Nao aceitar arte chibi simples, cubo, cartoon infantil, pixel art flat demais ou pintura HD borrada.
- Criterio pratico: pixel art realista com contorno, sombra, roupa detalhada, corpo humano crivel e estrutura pronta para spritesheet/animacao.
- Personagens e NPCs devem ser adultos, expressivos, em escala e detalhamento coerentes com o anchor, com pose natural.
- Rua, cenario e props devem seguir pixel art realista com luz, textura, profundidade, volume e material legivel.
- HUD deve parecer premium e especifico do PubPaid, sem cara generica.
- Animacoes devem usar poucos frames, mas com peso realista e pes bem ancorados.

## Proximo Foco

1. Usuario revisar o PubPaid `20260519-mobileland1`; regra final mobile atual: celular deve jogar em horizontal, retrato bloqueia com gate.
2. Se o usuario quiser mais realismo no Xadrez, proximo corte natural e relogio de xadrez, promocao com escolha de peca e mais refinamento visual das pecas.
3. Manter PubPaid focado em Sinuca, Damas e Xadrez; os outros jogos continuam apenas no backup `backups/pubpaid-disabled-games-20260519-1235`.
4. Validar PvP em duas sessoes autenticadas diferentes sempre que mexer no fluxo real de carteira/fila.

## Ultima Rodada Validada

- Build local: `20260519-mobileland1`.
- Otimizacao PubPaid mobile: BootScene deixou de pre-carregar frames de intro nao usados e imagens grandes de jogos/salas fora do corte atual; o app evita limpar caches/service workers quando a build local ja coincide; URLs de assets da rua/damas foram alinhadas para evitar download duplicado.
- Regra de orientacao final: em celular/touch, retrato volta a bloquear com `Mude para horizontal`; o jogo so segue em paisagem. A Sinuca nao deve ser jogada em retrato.
- Build local: `20260521-premiumgames2`.
- Damas/Xadrez PubPaid: xadrez ganhou moeda/coin toss visual tambem no treino, com quem comeca e cor das pecas; Damas/Xadrez mostram `Movimento feito...` por 1,5s antes da virada/IA; botoes `Mesas` voltam ao lobby e timers de IA/intro sao limpos ao sair.
- Cache/entrada PubPaid: removido `Clear-Site-Data` do header PubPaid, build atualizado para `20260521-premiumgames2`, assets do BootScene agora usam `window.pubpaidBuildVersion`, e o app aquece cache local seguro (`pubpaid_safe_runtime_cache`) de CSS/JS/assets nao sensiveis enquanto continua checando `/api/pubpaid/build` com `no-store`.
- UI premium: camera ficou discreta por drag/touch/mouse, sem bolinha grande; Xadrez recebeu avatares, intro com moeda, fundo mais rico e tabuleiro reduzido para nao cobrir sidecar; Damas foi reduzida no desktop, manteve pedras redondas/contraste e esconde o gate de orientacao quando a mesa ja esta ativa.
- Indicadores PubPaid: porta/garcom/NPCs seguem como brilho premium sem setas ou caixas duras; brilho do garcom fica visivel mesmo sem chegar perto.
- Validacao local: servidor `PORT=3002`, `/api/pubpaid/build` respondeu `20260521-premiumgames2`; `node --check` em `domGameInterface.js`, `app.js`, `BootScene.js`, `StreetScene.js`, `InteriorScene.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; Playwright desktop/mobile landscape para Damas e Xadrez sem erros de console, 64 casas, loading 100%, cache local preenchido, `Mesas` visivel e retorno ao lobby confirmado.
- Evidencias: `.codex-temp/premiumgames2-checkers-desktop.png`, `.codex-temp/premiumgames2-checkers-mobile-landscape.png`, `.codex-temp/premiumgames2-chess-desktop.png`, `.codex-temp/premiumgames2-chess-mobile-landscape.png`, `.codex-temp/premiumgames2-chess-desktop-intro.png`.

- Responsividade em paisagem mantida para Lobby, Xadrez, Damas e Sinuca; o botao de audio fica oculto durante mesas para nao cobrir HUD/placar.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260519-mobileland1`; `node --check` em `app.js`, `BootScene.js`, `domGameInterface.js` e script de validacao; `npm run guard:pubpaid`; Playwright confirmou bloqueio em retrato 375x667, lobby em 667x375, Xadrez em 667x375, Damas em 640x360 e Sinuca em 844x390, todos com `music=off` e sem overflow.
- Evidencias: `.codex-temp/pubpaid-mobileopt-portrait-gate-375x667.png`, `.codex-temp/pubpaid-mobileopt-pool-844x390.png`, `.codex-temp/pubpaid-mobileopt-report.json` e `.codex-temp/web-game-mobileland/state-1.json`.

- Build local: `20260519-chesspro1`.
- Xadrez PubPaid profissionalizado com `chess.js` no Demo e no PvP: lances legais, SAN, xeque/mate/empate, roque, en passant, promocao, lista de lances legais e lances obrigatorios quando ha xeque ou lance unico.
- UI do Xadrez ganhou maozinha animada, destaque de origem/destino legal, rei em xeque, ultimo lance, historico lateral e cues sonoros de movimento/captura/xeque/mate. Audio permanece desligado por padrao.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260519-chesspro1`; `node --check` em `server.js`, `domGameInterface.js` e `chipTechSoundtrack.js`; `npm run guard:pubpaid`; Playwright confirmou 32 pecas, 10 origens legais no inicio, historico `e4`, cenario de xeque `Qh5+` com lance obrigatorio `g7-g6`, `LIGAR SOM` e `music=off`.
- Evidencias: `.codex-temp/pubpaid-chesspro1-after-e4.png` e `.codex-temp/pubpaid-chesspro1-forced-check.png`.

- Build local: `20260518-gamescomplete3`.
- Ajuste pontual de controles PubPaid: a Sinuca agora mostra `Use Espaço para jogar`; no celular mostra `Celular: toque em Jogar`; o botão touch da Sinuca ficou `Jogar`; os botões mobile globais ficaram `Caixa` e `Jogar`.
- Validação local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-gamescomplete3`; `node --check`; `npm run guard:pubpaid`; Playwright confirmou os textos/botoes e gerou `.codex-temp/pubpaid-gamescomplete3-pool-controls.png` sem erros de console.

- Build local: `20260518-gamescomplete2`.
- Parte de jogos PubPaid fechada localmente: todos os 7 jogos do lobby têm `Treino` e `Real`.
- Treinos locais novos adicionados para `Xadrez`, `21`, `Pôquer`, `Truco` e `Dados`; os treinos não usam ficha, não travam saldo e não mexem na carteira. Sinuca e Damas preservam seus treinos existentes.
- Textos visíveis revisados para português: removidos termos públicos como `Lobby`, `Demo`, `Draw Poker`, `Desktop/Mobile`, `PvP real`, `backend` e `escrow` dos arquivos do jogo conferidos.
- Validação local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-gamescomplete2`; `node --check`; `npm run guard:pubpaid`; `git diff --check`; Playwright confirmou 7 botões `Treino`, treino de Pôquer abrindo sem erros de console e sem vazamento dos termos buscados.

- Build local: `20260518-cardtables1`.
- Jogos de cartas PubPaid: primeira reforma visual/fluxo aplicada em `21`, `Poker` e `Truco`. O lobby ganhou o card `21`; as mesas agora usam DOM tematico com feltro, cartas com naipe/cantos/pip, verso para cartas ocultas, area do rival, area central e mao do jogador.
- Poker: fluxo visual de segurar/trocar cartas com mão do rival virada e botao `Trocar cartas soltas`.
- Truco: fluxo visual com placar, mao atual, cartas na mesa e cartas ja jogadas.
- 21: fluxo visual com total da mao, cartas do rival parcialmente ocultas e acoes `Comprar carta` / `Parar`.
- Os subagentes chamados para auditoria/UX bateram limite de uso; a implementacao continuou localmente.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-cardtables1`; `node --check` em `domGameInterface.js`, `pvpService.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; Playwright gerou `.codex-temp/pubpaid-cardtables1-preview.png` sem erros de console.

- Build local: `20260518-withdrawrules1`.
- Carteira PubPaid: removido o cartão inclinado `PubPaid Pay`; no lugar ficou um aviso simples e discreto sobre saques.
- Saque PubPaid: agora exige chave Pix e nome da conta Pix, limita o pedido ao saldo livre, envia o pedido para conferencia do admin, informa prazo de ate 2 horas e deixa claro que o Pix so cai depois da conferencia do nome da conta Pix.
- Indicadores do jogo: rua/porta de entrada e garçom receberam bolinhas pequenas e discretas de interação, sem voltar com nomes/circulos grandes no chão.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-withdrawrules1`; `node --check` em `server.js`, `pubpaid-runtime.js`, `accountService.js`, `walletInterface.js`, `StreetScene.js`, `InteriorScene.js`, `app.js`, `BootScene.js` e `domGameInterface.js`; `npm run guard:pubpaid`; `git diff --check`; Playwright da carteira confirmou bloqueio de saque acima do saldo livre sem erros de console.

- Build local: `20260518-cleanselect1`.
- Limpeza visual pontual: removidos nomes, circulos, bolas/aneis de hotspot e indicador do garçom no chão do salão; a seleção de avatar também perdeu o piso/label `AVATAR 1/2` e a barra de marcação no chão.
- As áreas clicáveis continuam funcionando, mas sem desenho por cima do piso.
- Validação local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-cleanselect1`; `node --check` em `CharacterSelectScene`, `InteriorScene`, `app`, `BootScene`, `domGameInterface`, `walletInterface` e `server`; `npm run guard:pubpaid`; Playwright abriu o salão limpo sem erros de console.

- Build local: `20260518-blackfix1`.
- Corrigida a tela/bloco preto que aparecia logo depois de apertar `Entrar`: a causa era uma mascara antiga da `IntroScene` para esconder texto removido, cobrindo o topo/esquerda da intro.
- A mascara foi removida e a versao de cache/build foi atualizada para `20260518-blackfix1`.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-blackfix1`; `node --check` em `IntroScene`, `app`, `BootScene`, `domGameInterface`, `walletInterface` e `server`; `npm run guard:pubpaid`; Playwright confirmou `Entrar -> intro limpa -> character-select` sem erros de console.

- Build local: `20260518-entryflow1`.
- UI de entrada limpa: removido o bloco visual de objetivo/prompt em desktop e mobile, removido o texto `Tocar para intro`, o botao principal agora mostra `Entrar`, o overlay `ENTER GAME` da intro foi removido e a zona de entrada da rua foi movida para a porta real sob o letreiro PubPaid sem circulo/marcador no chao.
- Fluxo de entrada: o botao `Entrar` agora reinicia a intro mesmo quando ela ja rodou antes; ao terminar, a intro dispara a entrada no jogo automaticamente sem exigir outro clique.
- Sinuca Demo e PvP: caçapas ficaram mais tolerantes, a deteccao acontece antes da parede rebater a bola e tambem considera o caminho entre frames para tacadas rapidas nao atravessarem a boca.
- Validacao local: `node --check` em app, BootScene, IntroScene, StreetScene, PoolGameScene, domGameInterface, walletInterface e server; `npm run guard:pubpaid`; HTML local sem `Tocar para intro`/`objetivo`; screenshot local sem overlay `ENTER GAME`; Playwright confirmou botao `Entrar`, fluxo `Entrar -> intro -> character-select/street`, porta sem marcadores visuais e as 6 caçapas encaçapando tacada rapida.

- Build local: `20260518-withdrawpix1`.
- Saque PubPaid agora exige chave Pix alem do valor: o formulario coleta a chave, o cliente bloqueia pedido sem Pix, o backend rejeita falta de Pix com `400`, grava `pixKey` no saque/campo `destination`/campo `payment` e devolve a chave no historico da carteira e na dashboard admin.
- Validacao local: `node --check` em `server.js`, `pubpaid-runtime.js`, `accountService.js` e `walletInterface.js`; `npm run guard:pubpaid`; `git diff --check`; teste API isolado em servidor temporario confirmou `400` sem Pix, `201` com Pix, chave no historico e saldo travado corretamente.

- Build local: `20260518-poolspace3`.
- Sinuca Demo e Sinuca PvP real agora usam o mesmo controle: no desktop, `Espaco` trava a mira, `Espaco` inicia a barra de forca e `Espaco` solta o taco; no mobile, controles laterais fazem as mesmas etapas por toque.
- Mesa da Sinuca foi centralizada e recebeu instrucao lateral `como jogar`; o mobile nao depende do botao inferior para tacar.
- Validacao local: `node --check` em `domGameInterface.js` e `PoolGameScene.js`, `npm run guard:pubpaid`, Playwright da Demo em desktop/mobile e PvP real com duas sessoes autenticadas. O PvP registrou `moveCount=1`, W.O. e settlement `108 x 90` a partir de `100 x 100`.

- Build local: `20260518-poolmodes1`.
- Sinuca virou uma unica mesa no lobby com dois caminhos internos: `Demo` e `PvP real`.
- `Demo` da Sinuca usa a cena fisica local, sem ficha, sem escrow e sem tocar na carteira; `PvP real` usa arena DOM dedicada, fila real, ready duplo e tacada calculada no backend.
- Validacao local com backend real isolado e duas sessoes autenticadas: Sinuca passou `waiting -> readying -> active`, aceitou tacada `/api/pubpaid/pvp/pool/shot`, finalizou por W.O. e liquidou carteiras em `108 x 90` a partir de `100 x 100`.
- Damas Demo mobile nao estava quebrando o motor: a falsa trava vinha de captura obrigatoria em cadeia sem feedback suficiente. Agora a peça forcada e auto-selecionada, a jogada legal fica destacada e a tela mostra `Continue a captura`.
- Playwright mobile landscape reproduziu 35 lances de Damas Demo depois da correcao sem travar; no ponto da captura em cadeia havia `forcedPiece`, 1 alvo valido e status explicito de continuidade.

- Build online: `20260518-checkersmodes2`.
- Damas agora e um unico card no lobby com dois caminhos internos: `Demo` e `PvP real`.
- `Demo` cria treino local contra maquina sem backend PvP, sem ficha, sem escrow, sem carteira e sem alterar saldo.
- `PvP real` limpa qualquer estado da demo antes de entrar na fila real; smoke online confirmou `checkersGame=none`, `pvpStatus=waiting`, `pvpGameId=checkers` e `join` chamado uma unica vez para Damas.
- Validado local e online com Google/carteira mockados: lobby tem 1 card de Damas, 1 botao Demo, 1 botao PvP real, 0 cards antigos separados, 64 casas no tabuleiro, sem overflow e sem erros de console.
- Commits publicados: `3715a553` unificou Damas Demo/PvP; `f237a3a5` limpou o estado da demo antes do PvP.

- Build local: `20260517-mobilefix1`.
- Mobile voltou a ter regra horizontal: portrait mostra gate de orientacao e nao abre intro/jogo antes de virar.
- Botao `Ligar som` deixou de abrir o jogo; com Google confirmado, o fluxo esperado e tocar no card/botao para abrir a intro.
- Damas Demo manteve treino local sem ficha/saldo, removeu grafico de mao, ganhou fundo de arena, pecas quadradas, placar mais visual, som de movimento e suporte melhor a tap.
- Layout de Damas em mobile landscape foi compactado para manter tabuleiro, score e botoes dentro do viewport, sem scroll.
- Teste Playwright local validou desktop, mobile landscape e mobile portrait; teste com Google mockado confirmou `Tocar para intro` e que audio nao inicia a intro.
- Online Render confirmou `/api/pubpaid/build` em `20260517-mobilefix1`; smoke online mobile landscape com Google mockado abriu intro pelo botao, manteve audio separado, moveu Damas Demo por tap, sem mao e sem overflow.

- Build local: `20260522-checkerstourney1`.
- Damas recebeu modo `Torneio` separado do Demo/PvP real. O torneio usa chaves diarias, 10 participantes de teste, check-in, chaveamento single elimination e partida de Damas com as regras oficiais, mas nao chama carteira, saldo, deposito, escrow ou backend financeiro.
- Horario oficial configurado no backend para 20:00-20:20 em `America/Rio_Branco`; em modo teste `tournamentTest=1`, as 10 chaves aparecem no painel e o fechamento pode ser simulado.
- UI nova em `pubpaid.html`/`domGameInterface.js`: botao `Torneio` no card de Damas, painel com chave/nome, lista de chaves de teste, bracket, confronto atual e retorno ao painel apos a partida.
- Responsividade: painel de torneio mobile portrait agora fica acima do gate de orientacao, sem overflow horizontal, com rolagem interna e botoes empilhados.
- Validacao local: `node --check` em JS tocado, `npm run guard:pubpaid`, `/api/pubpaid/build` em `20260522-checkerstourney1`, smoke API com 10 participantes -> 4 rodadas -> campeao, Playwright desktop/mobile e clique real na UI de chave/entrada sem erros de console. Nao versionar `data/pubpaid-tournaments.json`; ele e gerado em runtime.

- Build local: `20260522-gameux1`.
- Torneio de Damas agora tem inscricao real: reserva com Google confirmado, nome e WhatsApp, Pix/referencia de inscricao, pendencia no admin e aprovacao manual antes de liberar a vaga.
- A vaga fica presa a conta Google/WhatsApp aprovada; check-in abre uma hora antes e fecha as 20:00 no Acre. Apenas aprovados/confirmados entram no chaveamento.
- Admin PubPaid recebeu lista de inscricoes pendentes de torneio e rota `/api/pubpaid-admin/tournaments/checkers/review` para aprovar/rejeitar.
- Validacao local: `node --check`, `npm run guard:pubpaid`, `/api/pubpaid/build` em `20260522-gameux1`, smoke API `register -> admin dashboard -> approve -> join`, e Playwright com bloco de Pix/status visivel no painel.

- Build local: `20260522-chessmobile3`.
- Xadrez mobile corrigido para seguir a intro completa: preparacao, creditos e moeda visivel antes de liberar o tabuleiro.
- A chave de renderizacao do Xadrez agora inclui a fase da intro, evitando que o mobile fique preso em `Prepare-se` e esconda a moeda.
- Peças do Xadrez foram ajustadas no breakpoint mobile para ficarem dentro das casas; camera overlay continua sem setas/zoom, com apenas `Mesa fixa` visivel.
- Validacao local: `node --check` em `domGameInterface.js`, `app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; browser mobile 740x420 com 64 casas, 32 pecas, `outCount=0`, instrucao de toque, moeda visivel e jogada por toque/click de `b8` para `c6`.

- Build local: `20260522-mobilehud2`.
- HUD mobile dos jogos PubPaid revisado contra sobreposicao: no Xadrez treino, `Sair` foi removido por ser redundante com `Mesas`; a instrucao de camera/toque foi movida para o rodape esquerdo, sem disputar o topo com `Mesas` e `Mesa fixa`.
- Damas mobile landscape agora esconde a sidecar em telas ate 760px/430px, evitando invadir o tabuleiro e duplicar `Mesas`.
- Validacao Browser 740x420: Xadrez, Damas e Sinuca sem overlap de HUD essencial; Xadrez manteve 32 pecas dentro do tabuleiro; console sem erros.
- Validacao local: `node --check` em `domGameInterface.js`, `app.js`, `server.js`; `npm run guard:pubpaid`; `git diff --check`; `npm run review:team` com 42 apontamentos gerais existentes.

- Build local: `20260526-checkersai1`.
- Xadrez mobile: a moeda nao roda sozinha depois dos creditos; fica centralizada e clicavel, mostra face + quem comeca + cor inicial, e so entao libera o tabuleiro.
- Xadrez mobile: o tabuleiro volta a aparecer apos a moeda, com 64 casas e 32 pecas; as pecas 3D CSS foram centralizadas nas casas no breakpoint mobile, com volume por luz/sombra sem parecerem soltas.
- Xadrez mobile: placar visivel voltou ao HUD e computou lance real `e2-e4` como `1 lance`, cabendo em 844x390 sem sobrepor menus.
- Xadrez recebeu animacao visual de captura e estado de checkmate; Damas recebeu efeito de captura no ultimo destino.
- Damas e Xadrez agora usam o mesmo padrao de moeda clicavel antes de liberar a mesa, inclusive no demo local.
- Damas demo: quando a moeda escolhe a Maquina, o AI agora agenda e executa o primeiro lance logo que o tabuleiro e liberado; intro de Damas encurtada em 0,5s.
- Lobby dos jogos: cards visiveis centralizados no menu apos Sinuca sair do online.
- Audio: Phaser interno fica sem AudioContext proprio; o som customizado do PubPaid continua iniciando por gesto do jogador.
- Damas mobile landscape: HUD revisado para evitar menu sobre menu; `Mesas`, `Reiniciar demo`, `Mesa fixa` e painel de status ficam em cantos/zonas separadas, sem sobreposicao no teste.
- Sinuca foi retirada do online temporariamente: card escondido no lobby, botoes desabilitados e guardas no runtime bloqueando acesso direto.
- Validacao local: `node --check` em `domGameInterface.js`, `app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; `npm run review:team` com `totalIssues=0`; Playwright mobile 844x390 confirmou lobby sem Sinuca online, Damas sem overlaps, Xadrez com moeda e tabuleiro pos-moeda.
