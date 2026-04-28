# CODEX Memory

## Atualizacao rapida 2026-04-28 - Sync online-local completo

- Usuario pediu atualizar direito e sincronizar todas as pendencias recentes da home/jornal automatico.
- A sincronizacao foi rodada a partir da arvore limpa `.codex-temp/deploy-home-sync`, baseada em `origin/main`, para nao misturar as mudancas locais do PubPaid.
- `npm run sync:online-local` terminou com `ok: true`: 360 noticias ativas/arquivo, 0 missing, 54 imagens reparadas, 10 slugs atualizados, `review-team totalIssues=0`, auditoria de imagens `360/360 ok` e runtime de agentes com 181 agentes/5 escritorios.
- A rotina falhava porque `scripts/write-online-local-sync-pdf.js` era chamado mas nao estava no `main`; o script foi promovido para o deploy para preservar a geracao de `.codex-temp/online-local-sync/latest-report.pdf`.
- Mudancas sincronizadas no pacote de deploy: `.codex-agents/registry.json`, `data/runtime-news.json`, `data/office-orders.json`, `data/real-agents-actions.json`, `data/re-rodada-dia-geral-report.json`, `data/news-image-focus-audit.json` e o gerador de PDF do sync.
- Segunda conferencia na worktree principal achou caches publicos mais novos ainda aguardando: `data/article-integrity-report.json`, `data/image-preview-cache.json`, `data/social-trends-cache.json`, `data/topic-feed-buzz.json` e `data/topic-feed-economy.json`; esses foram promovidos. `data/runtime-news.json` e `data/office-orders.json` da principal estavam mais antigos que o `main` e nao foram sobrescritos.
- PubPaid permanece local-only e fora deste deploy ate ordem explicita do usuario.

## Atualizacao rapida 2026-04-28 - Mais Assuntos Festa & Social continuo

- Usuario apontou que o bloco `Festa & Social Agora` em `Mais Assuntos` parecia um card dentro de outro card e nao dava continuidade visual a div.
- `styles.css`: `.caderno-social-wide` deixou de ser card roxo largo, perdeu sombra/borda arredondada/pseudo-elementos, virou faixa aberta de largura total do grid e os `mini-story` internos passaram a ser chamadas transparentes com divisorias leves.
- `index.html`: cache-bust de `styles.css` atualizado para `20260428cadernosflow1`.
- Validacoes: brace-balance de `styles.css`, `node --check script.js`, `node --check server.js`, Playwright desktop e mobile sem overflow; `npm run review:team` com `totalIssues=0`.
- Capturas: `output/playwright/home-cadernos-social-wide-fix-20260428-v2.png` e `output/playwright/home-cadernos-social-wide-mobile-20260428.png`.

## Atualizacao rapida 2026-04-28 - Mosaico visual focado no Jurua

- Usuario pediu que a area `Edicao visual` ficasse mais bonita e mostrasse somente noticias do Jurua, Cruzeiro do Sul e Vale do Jurua; se faltasse, completar com noticias do Acre em geral.
- `script.js`: `pickRadarLeadArticles` agora trabalha em camadas regionais: prioriza Cruzeiro do Sul/Vale do Jurua/municipios do Jurua, depois usa Acre geral/governo como fallback; noticias nacionais sem sinal regional nao entram no mosaico.
- `premium-clarity.css`: mosaico redesenhado com destaque principal horizontal, grade responsiva de 2 colunas, foto inteira em area propria e bloco de leitura escuro sem o retangulo vazio anterior.
- `index.html`: cache-bust de `script.js` e `premium-clarity.css` atualizado para `20260428-monthly-photo-clean1-mosaico-jurua1`.
- `data/topic-feed-kids.json`: traduzido lede/summary em ingles apontado pela trava `language-review`.
- Validacoes: `node --check script.js`, brace-balance `premium-clarity.css` 252/252, Playwright desktop/mobile com 12 cards, `nonRegionalSignals=0` e `missingImages=0`, e `npm run review:team` com `totalIssues=0`.
- Capturas: `output/playwright/mosaico-jurua-desktop-clean-20260428.png` e `output/playwright/mosaico-jurua-mobile-20260428-v3.png`.

## Atualizacao rapida 2026-04-28 - Fotos limpas em Celebridades

- Usuario pediu para tirar o esbranquicado das fotos no bloco `Celebridades & Polêmicas do Dia`.
- `premium-clarity.css`: as fotos de `#monthly .month-photo` deixaram de receber tres camadas de gradiente por cima da imagem real; agora usam apenas `var(--month-image)`, `contain`, fundo escuro neutro e leve ajuste de saturacao/contraste.
- `index.html`: cache-bust de `premium-clarity.css` atualizado para `20260428-monthly-photo-clean1`.
- Validacoes: brace-balance em `premium-clarity.css` e `styles.css`; Playwright local em `http://127.0.0.1:4132/?skipIntro=1` confirmou `hasGradientLayer=false`, `background-size=contain` e gerou `output/playwright/monthly-photos-clean-20260428-no-consent.png`.

## Atualizacao rapida 2026-04-28 - Fluxo Prefeitura, Politica e Acre / Governo

- Usuario pediu que `Prefeitura` e `Politica` entrem antes de `Tudo` e `Cotidiano`, com divisoes proprias, e que `Prefeitura` priorize prefeituras do Vale do Jurua com Cruzeiro do Sul primeiro; depois vem `Acre / Governo` para noticias principais do Acre e utilidade do Governo do Estado.
- `index.html`: chips do Resumo CZS e quadro `ASSUNTOS DO DIA` reordenados para `Prefeitura`, `Politica`, `Acre / Governo`, `Tudo`, `Cotidiano`, mantendo o restante na sequencia.
- `script.js`: textos-guia atualizados; `Politica`, `Prefeitura` e `Acre / Governo` deixaram de se engolir por grupo; ranking do radar agora prioriza Prefeitura/Cruzeiro do Sul, depois Vale do Jurua, Politica, Acre/Governo e Acre geral antes do restante.
- `server.js` e `script.js`: inferencia de categoria agora reconhece Prefeitura do Jurua antes de cair em Acre/Governo ou utilidade publica, preservando a divisao municipal.
- `arquivo-noticias.js`: filtros do arquivo seguem a mesma ordem e Politica fica independente de Acre/Governo.
- `data/topic-feed-kids.json`: saneado um cache publico com lede/summary em ingles que travava a auditoria.
- Validacoes: `node --check script.js`, `node --check server.js`, `node --check arquivo-noticias.js`, parse JSON de `data/topic-feed-kids.json` e `npm run review:team` com `totalIssues=0`.

## Atualizacao rapida 2026-04-28 - Acre / Governo e previa admin total

- Usuario pediu que a previa so abra com senha admin total e que `Governo do Estado` vire uma divisao `Acre / Governo`, com noticias gerais do Acre mais governo estadual.
- `server.js`: `/api/preview-image` agora exige senha admin total; sem senha retorna 401 com mensagem de senha obrigatoria.
- `index.html`, `script.js`, `arquivo-noticias.js` e `catalogo-servicos-data.js`: rotulo alterado para `Acre / Governo`; filtro usa `data-filter="acre-governo"` e aceita legado `governo-estado`.
- O filtro `Acre / Governo` foi ampliado para captar sinais explicitos de Acre, Rio Branco, Jurua, municipios acreanos, Governo do Acre, Aleac, secretarias e fontes estaduais, mantendo `Prefeitura` como divisao separada.
- Validacoes: `node --check server.js`, `node --check script.js`, `node --check arquivo-noticias.js`, `node --check catalogo-servicos-data.js`, `npm run review:team` com `totalIssues=0`, smoke local em `127.0.0.1:4124` com home 200, API news 200 e preview sem senha 401.

## Atualizacao rapida 2026-04-28 - Rodape da noticia sem corte

- Usuario enviou captura do rodape da pagina de noticia com o titulo `Leitura com foto no topo...` cortado/estourando lateralmente.
- Causa encontrada: uma regra tardia mantinha `.rich-footer` em 3 colunas com `!important`, sobrescrevendo a quebra responsiva e espremendo o texto em larguras estreitas.
- `modern-launch.css` agora força `.detail-footer/.rich-footer` da pagina de noticia para uma coluna ate 980px, garante `min-width: 0` nos blocos internos e reduz o titulo no breakpoint de 720px.
- `noticia.html` recebeu cache-bust `20260428footerflow` para puxar o CSS corrigido.
- Validado com brace-balance dos CSS principais e Playwright em 740px e 390px. Capturas: `output/playwright/noticia-footer-mobile-fix-20260428-v2.png` e `output/playwright/noticia-footer-phone-fix-20260428.png`.

## Atualizacao rapida 2026-04-28 - Encerramento diario e lembrete Cheffe Call

- Usuario aprovou a home e pediu sincronizar tudo como na rotina diaria, atualizar a reuniao e encerrar o dia.
- Home/mosaico de 12 cards ja foi publicada no `origin/main` pelo commit `b2b8609` (`Ajusta mosaico visual e utilidade publica`).
- `npm run sync:online-local` rodou no encerramento e terminou ok: 360 noticias sincronizadas, `sanitize public language` ok, `review-team totalIssues=0`, auditoria de imagens `360/360 ok`, runtime/reuniao dos agentes com 181 agentes e 5 escritorios, e PDF gerado em `.codex-temp/online-local-sync/latest-report.pdf`.
- A primeira passada do sync parou em 2 avisos antigos de copy no PubPaid (`teste local`); `pubpaid-phaser/app.js` recebeu ajuste textual para linguagem de visualizacao, e a segunda passada zerou a review.
- Relatorios da reuniao/sync: `.codex-temp/online-local-sync/latest-report.md`, `.codex-temp/online-local-sync/latest-report.pdf`, `.codex-temp/real-agents/latest-run.md` e `.codex-temp/review-team/latest-report.md`.
- Lembrete criado para 2026-04-29 as 09:00 no horario do Acre: comecar a rotina de organizar a Cheffe Call.
- PubPaid segue com varias mudancas locais e sem deploy dedicado; nao publicar PubPaid sem ordem explicita do usuario.

## Atualizacao rapida 2026-04-28 - PubPaid politica de colisao de veiculos

- Usuario corrigiu a regra: na calçada nao existe risco de colisao com veiculo, mesmo se a silhueta visual ficar perto da rua.
- `StreetScene.js`: a parada preventiva dos veiculos agora usa uma caixa de perigo de faixa, baseada na posicao baixa do personagem; se o player esta na calçada (`y <= 578`), o trafego nao freia nem bloqueia spawn.
- As faixas foram reposicionadas mais para baixo (`coming y=662`, `going y=716`) para os veiculos nao parecerem subir na calçada/por baixo do protagonista.
- Mantida a seguranca real: se um caso forçado coloca o player dentro da faixa, o veiculo para antes, nao da re se ja estiver colado e bloqueia novos spawns naquela direcao para nao empilhar.
- `scripts/pubpaid-build-traffic-spritesheet.py`: pilotos das motos continuam integrados no proprio spritesheet, com corpo/capacete/jaqueta/pernas redesenhados frame a frame; `BootScene.js` usa cache-bust `20260428traffic5`.
- Validado com `node --check`, `py_compile` e Playwright em `output/web-game/pubpaid-traffic-check/`: `sidewalkNoStop=true`, `sidewalkLaneBlocked=false`, `sidewalkTrafficCollision=false`, `directTrafficCollision=true`, `hazardStoppedBeforePlayer=true`, `didNotReverse=true` e `spawnSuppressedOrOtherLane=true`.

## Atualizacao rapida 2026-04-28 - Home mosaico 12 cards foto total e Mailza prioridade

- Usuario pediu a `Edição visual` com 12 cards para nao sobrar item sozinho, divisao ajustada para ver a foto inteira como regra total e prioridade maior para Mailza/Maisa.
- `index.html` agora anuncia doze destaques e mantem 12 cards estaticos de fallback; `script.js` seleciona ate 12 materias para o mosaico dinamico.
- A selecao dinamica puxa materias Mailza/Maisa com imagem antes das demais, depois completa com materias do dia e fallback.
- `styles.css` mudou o mosaico para grade par de 2 colunas, com cards em proporcao uniforme e imagens em `contain`; `script.js` tambem pinta as imagens do mosaico com `contain` e foco central.
- Validacoes: `node --check script.js`, contagem CSS 3344/3344, Playwright em `http://127.0.0.1:3000/?skipIntro=1` com 12 cards, grid 2 colunas, lead de Mailza e sem erros de console. Captura: `output/playwright/home-mosaic-12-foto-total-20260428.png`.
- `npm run review:team` rodou; os avisos restantes ficaram fora desta frente: 4 textos editoriais em `news-data.js` e 2 avisos antigos do PubPaid.

## Atualizacao rapida 2026-04-28 - Home mosaico 9 cards e catalogo publico

- Usuario pediu que a area `Edição visual` deixasse de ter apenas 3 materias e passasse a ter pelo menos 9; os destaques do hero podem se repetir ali, somente nessa area.
- `index.html` agora tem 9 cards no mosaico visual e o destaque principal mostra `Ler tudo`.
- `script.js` passou a selecionar ate 9 materias para o mosaico e tambem atualiza o link do destaque do hero (`data-hero-tourism-meta-link`) para a materia real.
- Os filtros do Resumo CZS ganharam `Governo do Estado` logo apos `Prefeitura`; `script.js` separa a categoria `governo-estado` de `prefeitura`.
- `catalogo-servicos-data.js` ganhou modulos separados para `Prefeitura de Cruzeiro do Sul` e `Governo do Estado`, com links oficiais de utilidade publica; `catalogo-servicos.html` recebeu cache-bust.
- Validacoes: `node --check script.js`, `node --check catalogo-servicos-data.js`, `node --check catalogo-servicos.js`, `npm run review:team` (2 avisos antigos do PubPaid, fora desta frente) e Playwright sem erros de console. Capturas: `output/playwright/home-mosaic-publica-20260428.png` e `output/playwright/catalogo-publica-20260428.png`.

## Atualizacao rapida 2026-04-28 - Prefeitura restrita ao Jurua

- Usuario apontou que uma materia da Anitta/G1 Pop & Arte nao tinha relacao com Prefeitura e pediu delimitar esse tipo de captacao somente para Prefeitura de Cruzeiro do Sul, Acre e Vale do Jurua.
- `server.js` e `script.js` agora so classificam como `Prefeitura` quando ha sinal municipal explicito combinado com Cruzeiro do Sul/Vale do Jurua; `governo` deixou de mapear automaticamente para Prefeitura.
- Caches locais `news-data.js`, `data/runtime-news.json` e `data/news-archive.json` foram corrigidos: a materia da Anitta saiu de Prefeitura e entrou como `Cultura`.
- Validacoes: `node --check server.js`, `node --check script.js`, `node --check news-data.js`, parse JSON dos caches e auditoria local confirmando `badPrefeitura=0`.

## Atualizacao rapida 2026-04-28 - PubPaid escala maior e rodas/pilotos no sprite

- Usuario pediu proporcoes maiores para carros/motos, rodas sem corte e animacao de roda desenhada no proprio spritesheet, nao por overlay/efeito runtime.
- `StreetScene.js`: escalas dos veiculos aumentadas para combinar melhor com o protagonista; removidos `headGlow`, `tailGlow`, `shadow` e qualquer desenho extra no container do trafego. Agora o container renderiza somente o sprite da folha.
- `scripts/pubpaid-build-traffic-spritesheet.py`: rodas passaram a receber spokes/arcos por frame dentro do PNG, usando centros por modelo; pilotos das motos foram redesenhados menores, com postura lateral, joelho dobrado, maos no guidao, jaqueta/capacete escuros e tons diferentes por moto.
- `BootScene.js`: cache-bust do trafego subiu para `20260428traffic4`.
- Validado localmente com `node --check`, `py_compile` e Playwright em `output/web-game/pubpaid-traffic-check/`; captura `02b-door-sidewalk-clear.png` mostra veiculos maiores e trafego ainda parando antes do player.

## Atualizacao rapida 2026-04-28 - PubPaid trafego freia antes do player

- Usuario apontou que carros/motos ainda atravessavam o sprite do protagonista quando ele ficava perto da guia da calcada.
- `StreetScene.js` ganhou caixa de seguranca visual para veiculos (`getTrafficAvoidanceBox`) e para o player (`getPlayerVehicleBlockBox`).
- O movimento do trafego agora passa por `getTrafficNextX`: se a proxima posicao encostar no espaco do protagonista, o carro/moto para alguns pixels antes, em vez de atravessar o sprite.
- Validado com Playwright em `output/web-game/pubpaid-traffic-check/`: `vehicleStopProbe.avoidedOverlap=true`, `vehicleStopProbe.stoppedBeforePlayer=true` e `blocked=true`.

## Atualizacao rapida 2026-04-28 - PubPaid calçada e sprites de trafego limpos

- Feedback fino do usuario aplicado: o protagonista agora fica limitado a uma faixa caminhavel de calcada (`y 512..572`) e o clique na rua e clampado para a calcada, sem entrar no asfalto.
- A colisao da porta foi recuada: `doorStaticBlocked=false` na validacao, entao o player consegue ficar em frente a porta e apertar `E`.
- Removida a barra/reflexo branco que aparecia embaixo dos veiculos no runtime; `StreetScene.js` nao cria mais `neonUnderline` artificial nos containers de trafego.
- `scripts/pubpaid-build-traffic-spritesheet.py` limpou restos cinza/brancos do recorte, redesenhou pilotos integrados nas motos com jaqueta/capacete escuros e trocou os riscos errados das rodas por arcos pequenos dentro da propria roda.
- Cache-bust do trafego subiu para `20260428traffic3`. Validacao Playwright em `output/web-game/pubpaid-traffic-check/` confirmou `doorStaticBlocked=false`, `roadTarget.y=572`, `movedTowardRoad=true` e captura com moto sem base branca.

## Atualizacao rapida 2026-04-28 - PubPaid faixas, motos com piloto e colisoes de mapa

- Corrigido feedback do usuario na rua: a calcada deixou de receber trafego; agora existem duas faixas reais, a de cima vindo para a direita (`>>>>>>>>`) e a de baixo indo para a esquerda (`<<<<<<<<`).
- `StreetScene.js` passou a spawnar veiculos por faixa, invertendo o sprite quando a direcao e para a direita, e aumentou a colisao usando hitbox escalada pelo tamanho visual.
- Adicionadas colisoes fixas para predio arcade, predio principal, porta do bar, parada de onibus e esquina; o restante ficou como fundo iluminado por novos glows neon.
- `scripts/pubpaid-build-traffic-spritesheet.py` agora desenha pilotos nas motos antes de gerar `assets/pubpaid/traffic/pubpaid-traffic-vehicles-4f.png`; cache-bust do asset subiu para `20260428traffic2`.
- Validado localmente em `http://127.0.0.1:3000/pubpaid-v2.html`: `node --check`, `py_compile` e Playwright em `output/web-game/pubpaid-traffic-check/`; o report confirmou `directTrafficCollision=true`, `directStaticCollision=true` e `blocked=true`.

## Atualizacao rapida 2026-04-27 - PubPaid carteira mobile pixel art

- Usuario pediu mudar o idle/carteira: parado por 3s o personagem fica respirando; Enter faz animacao de puxar celular com hold no ultimo sprite por cerca de 2s, depois abre a carteira.
- `app.js` voltou a iniciar a intro cinematica no botao inicial antes do login/teste local, restaurando a abertura cortada.
- Criada `pubpaid-phaser/scenes/WalletScene.js`: menu carteira em Phaser com entrada cinematografica puxada do celular e interface 2D pixel art de saldo.
- `StreetScene.js` e `InteriorScene.js`: Enter abre carteira; E ficou para porta/interacao; o idle de celular nao dispara mais sozinho.
- `pubpaid-v2.html` e `pubpaid-phaser.css`: controles mobile na tela com direcional e botoes pixel art `Porta`, `Carteira` e `Config`; Config abre painel de som/voltar; HUD mobile compactada e overlays escondidos durante a carteira.
- Validado localmente em `http://127.0.0.1:3000/pubpaid-v2.html`: `node --check` nos JS tocados, CSS brace-balance 434/434, Playwright custom em `output/web-game/pubpaid-wallet-flow-check/` e cliente padrao em `output/web-game/pubpaid-mobile-wallet-client/`, sem erros. PubPaid segue apenas local, sem commit/push/deploy.

## Atualizacao rapida 2026-04-28 - PubPaid trafego lateral com colisao

- Usuario aprovou uma folha nova de carros e motos 32-bit em vista lateral esquerda para usar na rua do PubPaid.
- Criado pipeline `scripts/pubpaid-build-traffic-spritesheet.py` que recorta a folha aprovada, limpa o fundo e gera `assets/pubpaid/traffic/pubpaid-traffic-vehicles-4f.png`, preview JPG e metadata JSON.
- `BootScene.js` passou a carregar `ppg-traffic-vehicles-sheet`; `StreetScene.js` passou a spawnar trafego da direita para a esquerda com carros e motos em estilo 2D pixel art premium.
- O trafego agora tem glow de farol/lanterna, reflexo neon leve e som sintetico dedicado em `pubpaid-phaser/audio/trafficNoise.js`.
- Colisao runtime ativada: o protagonista nao atravessa mais carro ou moto quando tenta cortar a rua.
- Validado localmente em `http://127.0.0.1:3000/pubpaid-v2.html`: `node --check`, `py_compile` e Playwright em `output/web-game/pubpaid-traffic-check/`, com sprites visiveis e bloqueio de colisao confirmado.

## Atualizacao rapida 2026-04-27 - PubPaid selecao girando e personagem no mapa

- Usuario pediu que a escolha de personagem mostre Homem e Mulher girando no proprio eixo em 4 vistas, e que depois a selecao leve ao mapa o spritesheet completo correspondente.
- Promovidos para o workspace os sources gerados de alta qualidade: `protagonist-male-generated-sheet-source-v1.png` e `protagonist-female-generated-sheet-source-v1.png`.
- Criado `scripts/pubpaid-extract-generated-character-sheets.py` para extrair strips de selecao e sheets transparentes 96x144, 8 direcoes x 4 frames, para walk/idle/celular.
- `pubpaid-v2.html` e `pubpaid-phaser.css` agora usam `protagonist-male-turnaround-4f.png` e `protagonist-female-turnaround-4f.png` nos cards da escolha, animados via CSS.
- `BootScene.js`, `StreetScene.js` e `InteriorScene.js` agora carregam os sheets gerados para Homem/Mulher e suportam rig por personagem com `frames=4` e escala propria.
- Validacao local em `http://127.0.0.1:3000/pubpaid-v2.html`: Playwright gerou `output/web-game/pubpaid-turnaround-flow/01-character-select-turnaround.png`, `02b-male-walk-right.png`, `03b-female-walk-right.png` e `report.json`, sem erros.
- PubPaid continua apenas local, sem commit/push/deploy.

## Atualizacao rapida 2026-04-27 - PubPaid feminina 32-bit aprovação

- Usuario esclareceu que queria a protagonista feminina em estilo 32-bit como o protagonista aprovado da referencia, nao boneca simples: 8 direcoes, 4 frames por direcao, visual adulto/feminino com jaquetinha curta, blusa branca, mini saia, tenis, cabelo encaracolado e pele morena.
- Criado prototipo de aprovacao em `scripts/pubpaid-generate-female-32bit-approval-sheets.py`, sem integrar como final ao jogo.
- Gerados sheets transparentes 96x144 por frame: `protagonist-female-32bit-walk-8dir-4f.png`, `protagonist-female-32bit-idle-breathe-8dir-4f.png`, `protagonist-female-32bit-idle-phone-8dir-4f.png`, mais preview `protagonist-female-32bit-approval-preview.png`.
- Como os GIFs nao apareceram no chat do usuario, criada pagina local `pubpaid-female-32bit-preview.html` para revisar o personagem em movimento pelo navegador.
- Validacao local: `python -m py_compile scripts/pubpaid-generate-female-32bit-approval-sheets.py` e geracao dos PNGs. Proxima etapa e o usuario aprovar/reprovar o preview antes de adaptar contrato no Phaser.

## Atualizacao rapida 2026-04-27 - PubPaid protagonista mulher discreta

- Usuario aprovou o fluxo de escolha e pediu a protagonista mulher no mesmo modelo/estilo do protagonista, feminina mas sem ficar estridente.
- Regerados os tres sheets femininos em `assets/pubpaid/sprites/protagonist/` mantendo contrato `64x128`, 8 direcoes x 3 frames: mesma familia visual do protagonista, jaqueta azul escura, calca escura, cabelo castanho mais longo, camisa clara discreta e celular com brilho reduzido.
- `BootScene.js` e `pubpaid-v2.html` receberam cache-bust `20260427femalequiet1` para o navegador puxar a arte nova.
- Validacoes: `python -m py_compile scripts/pubpaid-generate-female-protagonist-prototype-sheets.py`, `node --check` em Boot/app/Street/Interior e Playwright local em `http://127.0.0.1:3000/pubpaid-v2.html`, sem `console-errors.json`.

## Atualizacao rapida 2026-04-27 - PubPaid Google e escolha de personagem

- PubPaid 2 continua somente local, sem deploy/push/commit/envio. Endereco de teste combinado com o usuario: `http://127.0.0.1:3000/pubpaid-v2.html`.
- Fluxo inicial alterado: a primeira tela mostra `Entrar no jogo`; depois o topo sai e entra o pedido Google. Em servidor local sem Google configurado, o botao vira `Continuar teste local`.
- Depois do Google/teste local, a frente do bar abre ainda travada e mostra selecao entre `Homem` e `Mulher`; ao escolher, o controle e liberado.
- Criada protagonista mulher provisoria em tres sheets transparentes: `protagonist-female-walk-8dir-3f.png`, `protagonist-female-idle-breathe-8dir-3f.png` e `protagonist-female-idle-phone-8dir-3f.png`, todos 8 direcoes x 3 frames, frame `64x128`.
- `BootScene.js`, `StreetScene.js` e `InteriorScene.js` agora escolhem os sheets pelo `gameState.selectedCharacter`; `app.js` gerencia auth/splash/selecao e salva a escolha em `localStorage`.
- Validacoes locais: `node --check` em `app.js`, `gameState.js`, `BootScene.js`, `StreetScene.js` e `InteriorScene.js`; Playwright em `http://127.0.0.1:3000/pubpaid-v2.html` gerou capturas `output/web-game/pubpaid-character-flow/00-initial.png` ate `04-street-female-walk-right.png`, sem `console-errors.json`.

## Atualizacao rapida 2026-04-27 - Layout dos escritorios sem coluna morta

- Feedback do usuario aplicado nos escritorios de agentes: a divisao de Pix/ambiente saiu de baixo do terminal e foi reposicionada logo abaixo do ambiente/mapa do escritorio em `escritorio.html`.
- `escritorio.css` passou a tratar o mapa como area principal e o terminal como bloco compacto abaixo, compartilhado por `escritorio.html`, `escritorio-nerd.html`, `escritorio-arte.html`, `escritorio-ninjas.html` e `esttiles.html`.
- Cache-bust do CSS atualizado nessas paginas para `20260427officeflow`.
- Validacoes: `node --check escritorio.js`, brace-balance 0 em `escritorio.css` e captura visual estatica em `output/playwright/office-layout-desktop.png`. O `server.js` principal nao subiu porque falta `./scripts/home-linked-article-fallbacks`, entao a captura usou servidor estatico temporario.

## Atualizacao rapida 2026-04-27 - PubPaid protagonista local V1

- PubPaid 2 segue local, sem deploy/push/commit. Usuario pediu limpar a cena e focar apenas no novo protagonista.
- Prompt mestre salvo em `PROMPT_PUBPAID_PROTAGONISTA_SPRITES_2026-04-27.md`, usando a primeira referencia como estilo adulto/fashion pixel art e a segunda como logica de spritesheet.
- Criados tres sheets transparentes em `assets/pubpaid/sprites/protagonist/`: `protagonist-walk-8dir-3f.png`, `protagonist-idle-breathe-8dir-3f.png` e `protagonist-idle-phone-8dir-3f.png`, todos 8 direcoes x 3 frames, frame `64x128`.
- `BootScene.js`, `StreetScene.js` e `InteriorScene.js` foram integrados ao novo contrato `frame = directionRow * 3 + frameIndex`; a rua ficou limpa, sem civis, placa Google grande ou molduras extras.
- Corrigido o tempo de idle: primeiro respira, depois de aproximadamente 2800ms parado troca para celular. `app.js` tambem parou de chamar `/api/pubpaid/account` no modo teste local sem login, evitando 401 no console.
- Validacoes locais: `node --check` nos modulos PubPaid tocados, `python -m py_compile` no gerador e Playwright em `http://127.0.0.1:3000/pubpaid-v2.html`. Captura de revisao: `output/web-game/pubpaid-protagonist-focused-phone-v2/protagonist-focused-contact.png`.

## Atualizacao rapida 2026-04-27 - PubPaid como instrutor de testes

- Rodada PubPaid 2.0 executada no modo instrutor de testes/auditor: memoria lida, prompt mestre criado, ruido local separado, reuniao de agentes rodada e objetivos testaveis registrados em `RELATORIO_PUBPAID_INSTRUTOR_TESTES_2026-04-27.md`.
- Frente oficial confirmada: `pubpaid-v2.html`, `pubpaid-phaser/`, `pubpaid-phaser.css` e `assets/pubpaid/`; `pubpaid.html` continua historica/demo e PubPaid segue sem deploy/commit ate autorizacao clara.
- Correcoes PubPaid validadas: textos publicos em portugues, `setTint` seguro no player container, paineis DOM respeitando `[hidden]`, clique DOM/Phaser isolado e resultado de Dardos sem modal duplicado.
- Trava anti-ingles reforcada tambem para noticias: `scripts/review-team-audit.js`, `scripts/sanitize-public-language.js` e `server.js` agora bloqueiam/saneiam fonte internacional sem sinal claro de portugues; dados atuais foram saneados em `news-data.js`, `data/runtime-news.json`, `data/news-archive.json` e topic-feeds afetados.
- Validacoes finais: `npm run agents:cycle` ok com 181 agentes/5 escritorios, `npm run review:team` com `totalIssues=0`, smoke anti-ingles `englishLeakSmokeHits=[]`, `node --check` em `server.js`, scripts de idioma e JS principais da PubPaid, JSON de memoria/dados ok.

## Atualizacao rapida 2026-04-27 - Popup explicado e console limpo

- Corrigido feedback do usuario no popup de cookies: o primeiro texto agora explica a ilustracao (`Ilustracao: IA lendo o caos do dia`) e a faixa lateral descreve que a cena e uma ilustracao ficticia da IA organizando memes, alertas e noticias.
- Reduzido o barulho de console da home: `requestApiJson` virou funcao hoistada, candidatos de imagem ignoram pixel `ebc.gif`, a amostragem de cor nao tenta ler canvas de imagem remota sem CORS e `/api/preview-image` retorna `200` com `imageUrl` vazio quando nao encontra imagem.
- O feed `data/topic-feed-tech.json` foi saneado para portugues depois que `npm run review:team` apontou 18 vazamentos de ingles.
- Validacoes: `node --check startup-experience.js`, `node --check script.js`, `node --check server.js`, brace-balance 0 em CSS, Playwright local em `http://127.0.0.1:4116/?skipIntro=1#participacao-comunitaria` sem linha de console errors e `npm run review:team` com `totalIssues=0`.

## Atualizacao rapida 2026-04-27 - Participacao comunitaria como chat

- Executado pedido do usuario para mudar a area `#participacao-comunitaria` da home: saiu o tom de envio formal de noticia e entrou o conceito de chat/mural de informacoes da populacao.
- `index.html` agora apresenta `Conversa da cidade`, campos com linguagem de mensagem comunitaria e board `Chat comunitario`.
- `script.js` renderiza cards como mensagens em conferencia, com nome/bairro/tempo e feedback de envio mais conversado.
- `styles.css` ganhou visual de bolhas/cards de mensagem no feed da direita; `server.js` atualizou labels e respostas da API para `Mensagem comunitaria`.
- Validacoes: `node --check script.js`, `node --check server.js`, brace-balance 0 em `styles.css`; Playwright local em `http://127.0.0.1:4114/#participacao-comunitaria` confirmou textos novos renderizados. Console ainda mostra erros antigos fora desta frente (`requestApiJson` antes da inicializacao e CORS de imagens externas).

## Atualizacao rapida 2026-04-26 - Hotfix API fallbacks de noticia

- PR #2 e PR #3 foram mergeados em `main`.
- Verificacao online confirmou a Home nova, mas mostrou que `/api/news` ainda zerava algumas imagens fallback.
- Causa: `server.js` considerava `/assets/news-fallbacks/` como imagem fraca e limpava `imageUrl` quando havia `sourceUrl`.
- Corrigido para aceitar fallback local seguro e gerar fallback no display em vez de retornar imagem vazia.
- Validacao local: `node --check server.js` e API local com 360/360 noticias com imagem, missingCount=0.

## Atualizacao rapida 2026-04-26 - Rodada editorial/dados separada

- Os arquivos de dados/cache que sobraram fora do PR da Home foram tratados em rodada propria, sem misturar com o ajuste visual dos cadernos.
- `scripts/sync-online-local.js` rodou o fluxo completo: sincronizacao online-local, review team e auditoria de imagens.
- A primeira passagem revelou 5 noticias novas sem imagem no arquivo completo; a causa era o merge do archive apos o reparo da janela ativa.
- `scripts/re-rodada-dia-geral.js` ganhou reparo de imagens ausentes apos o merge completo e gerou 5 fallbacks locais em `assets/news-fallbacks/`.
- Validacao final: sync passou, review team com 0 achados em 135 arquivos, news-focus-audit com 360/360 ok, 0 erros e 0 imagens ausentes.

## Atualizacao rapida 2026-04-26 - Entenda a Home mais legivel

- Corrigido feedback visual do usuario no bloco `Entenda a Home`: a fonte cinza lavada foi trocada por texto azul-escuro mais forte nos cards claros e branco quente nos cards coloridos.
- `styles.css` tambem reduziu o aspecto artificial do modulo, com fundo de papel mais quente, cards menos altos/lavados, bordas discretas e pesos de texto mais legiveis.
- Validacoes: `node --check script.js`, `node --check server.js`, `styles.css brace-balance=0`; captura full-page local via Playwright gerada com a Home servindo em `4100`, mas a captura completa nao ativou todos os reveals inferiores, entao ainda vale conferir visualmente a secao rolada no navegador real.

## Atualizacao rapida 2026-04-26 - Fotos inteiras sem eco visual

- Corrigido feedback dos cards de `Mais Assuntos` com foto inteira: a camada/pseudo-fundo que repetia a mesma imagem foi neutralizada apenas nas mini-thumbs dos cadernos.
- Ajuste importante apos validacao do usuario: a regra global em `premium-clarity.css` foi removida para nao lavar/estragar os cards superiores da home.
- `script.js` voltou a usar `cover` como fallback geral das thumbs reais, mas `applyCadernoStoryArticle` envia `imageFit: "contain"` para preservar foto inteira nos cadernos.
- `styles.css` neutraliza o fundo das mini-thumbs de `Mais Assuntos`; `index.html` recebeu cache-bust novo de `script.js`.
- A area mensal tambem foi ajustada apos feedback visual: fundos laterais das `month-photo` sairam do branco/azulado lavado para um cinza-verde mais escuro e os `month-card` ganharam gradiente verde/bege mais integrado as fotos.
- Validações: `node --check script.js`, `node --check server.js`, brace-balance 0 em `premium-clarity.css` e `styles.css`, `npm run review:team` com 0 achados.
- Observação: a tentativa de captura com Edge headless no sandbox gerou página de conexão recusada, então ainda vale conferir visualmente no navegador real antes de publicar.

## Atualizacao rapida 2026-04-25 - Fluxo mobile de cookies corrigido

- Corrigido o feedback do usuario sobre o botao `Continuar` nos cookies mobile: o celular agora mostra primeiro um card/bottom sheet de cookies e preferencias, com a pagina ao fundo bloqueada.
- O botao do card virou `Aceitar cookies e continuar`, deixando claro que primeiro vem o aceite e depois a navegacao.
- Arquivos tocados: `startup-experience.js`, `styles.css`, `index.html` e memoria local em `.codex-memory/`.
- Validacoes: `node --check startup-experience.js`, `node --check script.js`, `node --check server.js`, brace-balance 0 em `styles.css`, `startup-experience.css` e `mobile-home-final.css`; Playwright mobile gerou `output/playwright/mobile-cookie-card-flow.png` e confirmou consentimento gravado/liberacao da rolagem apos aceite.

## Atualizacao rapida 2026-04-25 - Hotfix imagens repetidas no Buzz

- Corrigido feedback visual do bloco de polêmicas/buzz: três matérias diferentes da mesma área estavam exibindo a mesma imagem genérica.
- `script.js` agora trata `https://agenciabrasil.ebc.com.br/ebc.gif?...` como pixel/placeholder, não como foto real de card.
- Cards do buzz sem foto real passam a usar fallback visual variado por posição, evitando três cards iguais na mesma grade.
- Resumos do buzz agora passam por `cleanArticleExcerpt`, removendo HTML cru como `<p><img>` antes de renderizar.
- `index.html` recebeu cache-bust novo para `script.js`.
- Validacoes: `node --check script.js` e `npm run review:team` com 0 achados.

## Atualizacao rapida 2026-04-25 - Inglês solto em cards

- Feita varredura de inglês solto/texto estranho nos cards das editorias `games`, `kids` e `study`.
- `data/topic-feed-games.json`, `data/topic-feed-kids.json` e `data/topic-feed-study.json` foram saneados com chamadas curadas em português, removendo títulos vazios, RSS `appeared first`, resumos brutos em inglês e termos soltos como `creators`, `showrunner`, `spin-off`, `review` e `hub`.
- `data/topic-feed-fallback.json` foi polido para garantir fallback público em português nessas editorias.
- `server.js` agora filtra automaticamente cards públicos de `games`, `kids`, `study` e `anime` quando chegam com título vazio, copy bruta em inglês ou sinais de RSS não localizado.
- Validações: `node --check server.js`, `node --check script.js`, varredura estrita dos JSONs com `bad-count 0`, `npm run review:team` com 0 achados e API local `/api/topic-feed` para `games`, `kids` e `study` entregando títulos em português.

## Atualizacao rapida 2026-04-25 - Correcoes mobile de cookies, palco e bandeira

- Feedback visual mobile aplicado: o banner de cookies no celular deixou de exibir texto publico/editorial e virou um controle discreto com botao `Continuar`.
- `startup-experience.js` tambem trocou os botoes antigos de entrada para `Continuar`, reduzindo a carga publica do fluxo.
- A home mobile nao mostra mais o `hero-office-photo-card` dentro do palco dos agentes, evitando imagem sobre imagem; o balao do palco foi preso no rodape da cena para nao cobrir foto/card.
- A bandeira do Acre em `pesquisa-acre-2026.css` foi corrigida para amarelo e verde, mantendo a estrela vermelha.
- Cache-busts atualizados em `index.html` e `pesquisa-acre-2026.html`.
- Validacoes: `node --check startup-experience.js`, brace-balance 0 em `styles.css`, `mobile-home-final.css` e `pesquisa-acre-2026.css`, `npm run review:team` com 0 achados, captura Playwright da enquete em `output/playwright/mobile-acre-flag-fix-full.png`.

## Atualizacao rapida 2026-04-25 - Anti-repeticao real entre blocos

- Corrigido o vazamento do fluxo editorial anti-repeticao: a home ainda podia repetir a mesma pauta entre blocos quando a noticia vinha com titulo/URL diferente ou por topic-feed.
- `script.js` agora usa chave de pauta por `cluster editorial + data` e fingerprint de imagem para reserva de superficies, nao apenas titulo/URL exatos.
- Novas superficies passaram a participar da reserva: `cadernos`, `monthly`, `dailyBuzz`, `archive` e `live`.
- `Buzz diario`, `Celebridades & Polêmicas do Dia`, `Arquivo` e `Noticias do dia` agora respeitam o que Hero/Destaques/Cadernos ja consumiram; busca e filtros continuam podendo mostrar a base completa.
- Validacoes: `node --check script.js` e `npm run review:team` com 0 achados.

## Atualizacao rapida 2026-04-25 - Correção imagens AWN bloqueadas

- Corrigidos os erros de console `net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` causados por imagens `awn.com` bloqueadas contra hotlink.
- `server.js` agora trata imagens da AWN como inseguras para exibição direta, impedindo que previews bloqueados entrem nos feeds e forçando fallback editorial quando necessário.
- `script.js`, `arquivo-noticias.js` e `news-photo-fix.js` ganharam proteção no cliente para ignorar/substituir URLs AWN antigas que ainda possam vir de cache.
- Validações: `node --check script.js`, `node --check arquivo-noticias.js`, `node --check news-photo-fix.js`, `node --check server.js`, servidor local em `4100` com home `200`, `/api/topic-feed?topic=kids` e `/api/news/archive` com 0 imagens AWN, e `npm run review:team` com 0 achados.

## Atualizacao rapida 2026-04-25 - Fluxo editorial anti-repeticao

- Reuniao geral executada: `npm run agents:run` ativou 181 agentes e `npm run review:team` voltou com 0 achados.
- Decisao editorial: Home passa a operar por reserva de superficie (`Hero -> Destaques -> Arquivo de Abril/mes -> Noticias do dia`), sem repetir slug, URL, foto, titulo normalizado ou pauta central entre blocos.
- Prompt operacional criado em `PROMPT_FLUXO_EDITORIAL_RESPONSIVO_2026-04-25.md`.
- `script.js`, `arquivo-noticias.js` e `server.js` ganharam canonicalizacao/fingerprint editorial e balanceamento por fonte, categoria, imagem e cluster para reduzir repeticao profissionalmente.
- `styles.css` ganhou regras responsivas para os cards com foto do bloco `Celebridades & Polêmicas do Dia`, evitando cards espremidos em TV, desktop, tablet e mobile.
- Validacoes: `node --check script.js`, `node --check arquivo-noticias.js`, `node --check server.js`, `styles.css` com `brace-balance=0`, `npm run review:team` com 0 achados e API local `/api/news/archive?limit=18` retornando 9 fontes nos 18 primeiros, no maximo 2 por fonte.

## Atualizacao rapida 2026-04-25 - Pesquisa Acre 2026

- A rodada atual da Pesquisa Acre 2026 foi estendida por mais 7 dias sem alterar votos: `activeWeekKey` segue `2026-W17` ate `2026-05-03T04:59:59.999Z` (02/05/2026 23:59:59 em America/Rio_Branco).
- Arquivos tocados nesta correcao: `server.js`, `data/acre-2026-poll-settings.json`, `.codex-memory/orders.json`, `.codex-memory/current-state.md` e `.codex-memory/handoff.md`.

Ultima atualizacao: 2026-04-17 01:39 -05:00 (America/Rio_Branco)

## Preferencia do usuario

- Quando o chat reiniciar, retomar o trabalho sem pedir tudo de novo.
- Manter uma memoria local do que esta em andamento neste projeto.
- Trabalhar sem ficar pedindo permissao para fluxo normal.
- Preservar ordens, fotos e textos relevantes localmente no workspace para sobreviver a fim de creditos, reinicio de chat ou troca de conta.

## Atualizacao rapida 2026-04-19

- Painel `SPRTIS CHECK & CHANGE` criado em `sprites-check-change.html`, com `CHECKPUBPAID` primeiro no menu, senha `99831455`, varredura de `sprite-vault` e `assets`, e botoes de aceitar/reprovar/pedir ajuste por sprite.
- Chat flutuante de ordens criado para os escritorios via `office-command-chat.js`, com senha Full Admin `99831455A`, hierarquia `Full Admin -> Codex CEO -> equipes` e APIs `/api/office-orders`.
- Validacoes locais: `node --check server.js`, `node --check sprites-check-change.js`, `node --check office-command-chat.js`, `npm run review:team` com 0 achados, API de sprites retornando 2600 assets.
- `Escritorio de Arte` criado em `escritorio-arte.html` com `escritorio-arte-config.js`: 50 agentes de Design Art e Programacao de Game Design, trabalhando junto com Ninjas para aprender/aplicar pixel art, sprites, game engine, colisao, fisica, mapeamento, mapas, som, QA e build. Menus e chat de ordens atualizados com `Equipe Arte/Game Design`.
- `SPRTIS CHECK & CHANGE` foi corrigido depois do feedback forte do usuario: nao mostra mais senha no placeholder, nao lista `assets` ja publicados, agrupa frames em sprites animados, abre avaliacao em tela cheia, usa `<img>` e nao canvas para preview, e inclui observacoes de modo construcao para mapas/cenarios. Validacao local: 2107 grupos, 190 animados, 1668 mapas/cenarios, 0 `assets` na fila.

## Atualizacao rapida 2026-04-20

- A hero mobile da home foi restaurada sem voltar com o fundo removido: o bloco principal e a lateral azul voltaram a aparecer, os cards de destaque ficaram opacos de novo e a coluna azul da cobertura local deixou de sumir no mobile.
- O acesso do jogo voltou para o topo da home com destaque vermelho animado e icone, tanto no menu principal quanto no hub mobile de escritórios.
- A `PubPaid` passou para fluxo em duas etapas: a pagina mostra vitrine, funcionalidades e valores; depois o usuario entra em modo game full screen so apos Google + avatar, com o antigo bloco inferior reaproveitado como painel interno da noite.
- Validacoes desta rodada: `node --check pubpaid.js`, `node --check startup-experience.js` e `npm run review:team` com 0 achados.

## Atualizacao rapida 2026-04-21

- Reuniao de agentes funcionais para a foto de manchete: a hero da home passou a usar foco seguro para cenas com pessoas/grupos, evitando que um recorte largo mostre so topo de cabeca; a auditoria `scripts/audit-news-image-focus.js` agora marca `hero-focus-too-high-for-wide-headline`.
- O workflow diario `.github/workflows/daily-news-sync.yml` agora roda `npm run audit:news-images -- --limit=80 --strict-new`, bloqueando itens novos que entrem com foto ausente, pessoa/grupo sem foco manual ou foco alto demais para manchete larga.
- Integracao de WhatsApp para essa auditoria: `scripts/audit-news-image-focus.js` aceita `--notify-whatsapp=new|all` e envia alerta pela WhatsApp Cloud API quando as secrets `WHATSAPP_ALERT_ENABLED`, `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_CLOUD_PHONE_NUMBER_ID` e `WHATSAPP_ALERT_TO` estiverem configuradas; o workflow diario ja chama `--notify-whatsapp=new`.
- Validacoes desta rodada: `node --check script.js`, `node --check scripts/audit-news-image-focus.js`, `node --check pubpaid-v2.js`, `npm run audit:news-images -- --offline --limit=80 --strict-new`, `npm run review:team` com 0 achados e `GET /` local em `127.0.0.1:4078` com `200`.
- A dashboard administrativa da SPO em [pesquisa-acre-2026-admin.html](C:/Users/junio/projeto codex/pesquisa-acre-2026-admin.html) foi ampliada para um painel analitico de verdade, com filtros por recorte, KPIs, leitura executiva, tendencia semanal, fluxos entre perguntas, saude da base, breakdowns por campo, cruzamentos por idade/local/profissao, sinais de comentarios e tabela rica para relatorio.
- O cliente de [pesquisa-acre-2026-admin.js](C:/Users/junio/projeto codex/pesquisa-acre-2026-admin.js) agora aplica filtros em tempo real, gera exportacao CSV filtrada e monta as secoes analiticas em cima do recorte ativo.
- O backend em [server.js](C:/Users/junio/projeto codex/server.js) passou a devolver mais campos administrativos da pesquisa e mais breakdowns/resumos para apoiar relatorios completos.
- Ajuste rapido novo: [pesquisa-acre-2026.html](C:/Users/junio/projeto codex/pesquisa-acre-2026.html) deixou o comentario opcional e [server.js](C:/Users/junio/projeto codex/server.js) removeu a exigencia desse campo no backend.
- Ajuste rapido novo: [server.js](C:/Users/junio/projeto codex/server.js) agora responde HTML, CSS e JS publicos com `Cache-Control: no-store`, para forcar cada entrada no site a puxar a versao mais atual do codigo.
- Blindagem nova da SPO: [server.js](C:/Users/junio/projeto codex/server.js) agora grava os votos da Pesquisa Acre 2026 com escrita atomica e fila de mutacao por arquivo, evitando sobrescrita quando votos chegam em sequencia muito proxima.
- Blindagem nova do deploy: [render.yaml](C:/Users/junio/projeto codex/render.yaml) foi preparado com `disk` persistente e `DATA_DIR` dedicado (`/opt/render/project/src/render-data`) para os votos da SPO sobreviverem a restart/redeploy no Render; o backend tambem passa a semear esse diretorio com os arquivos-base da pasta `data/` quando estiver vazio.
- Correcao importante: o backend da pesquisa agora reconhece tambem a faixa etaria `16 a 17 anos`, alinhando servidor e formulario.
- Solucao objetiva nova: [server.js](C:/Users/junio/projeto codex/server.js) expõe `/api/admin/storage-health` para validar `DATA_DIR`, caminho persistente esperado no Render, leitura da pesquisa e escrita de prova; [scripts/check-render-storage.js](C:/Users/junio/projeto codex/scripts/check-render-storage.js) roda isso via `npm run deploy:storage-check`.
- Correcao de fluxo da SPO: [server.js](C:/Users/junio/projeto codex/server.js) agora expõe `/api/pesquisa-acre-2026/me` para detectar se o Google atual ja votou na semana; [pesquisa-acre-2026.js](C:/Users/junio/projeto codex/pesquisa-acre-2026.js) esconde o formulario e mostra as parciais quando o usuario ja votou ou recebe 409.
- Ajuste de regra apos teste com duas contas: a trava semanal da SPO voltou a ser por conta Google, nao por dispositivo/IP, para que contas diferentes possam compor o panorama geral; [pesquisa-acre-2026.js](C:/Users/junio/projeto codex/pesquisa-acre-2026.js) continua movendo o bloco de parciais para logo abaixo do painel de obrigado quando a participacao ja esta concluida.
- Force-sync admin da SPO: [server.js](C:/Users/junio/projeto codex/server.js) ganhou `/api/pesquisa-acre-2026/admin/force-sync` para normalizar/deduplicar votos reais existentes em `acre-2026-poll.json` e recalcular parciais; teste local com 2 votos simulados retornou total publico 2.
- Aviso legal da SPO: [pesquisa-acre-2026.html](C:/Users/junio/projeto codex/pesquisa-acre-2026.html) passou a apresentar a pagina como enquete/sondagem espontanea pessoal, sem carater cientifico, sem plano amostral, sem representatividade estatistica e nao registrada no TSE; tambem explica o uso do Google para limitar uma resposta por conta e nao exibir dados pessoais nas parciais.

## Atualizacao rapida 2026-04-22

- O usuario pediu para subir tudo que faltou menos a frente `PubPaid`; a rodada de commit/push desta passada deve incluir apenas manifestos/registry, sincronizacao de noticias e a ponte da `index2`, deixando `pubpaid.html`, `pubpaid-v2.html`, `pubpaid-phaser.html` e afins fora do commit.
- Reuniao de agentes da PubPaid: a placa/logo `PUB PAID` da fachada enviada pelo usuario virou uma `IntroScene` real em Phaser. `BootScene` entra em `intro-scene`, `app.js` mantem o canvas visivel durante termos + Google e so libera `street-scene`/`ui-scene` depois do fluxo. Validacao final em `.codex-temp/pubpaid-intro-scene-final/shot-0.png`, com estado `scene=intro` e sem erro de console.
- Correcao de direcao PubPaid: o usuario enviou 6 bitmaps como montagem real da abertura e uma referencia separada para UI. `IntroScene.js` agora toca `assets/pubpaid/intro/pubpaid-intro-01.jpeg` ate `06.jpeg` com fade/zoom/pan/flash/shake/scanline, congela no frame 6 e so entao abre termos/Login sobre o canvas. Validacoes em `.codex-temp/pubpaid-bitmap-intro-start/shot-0.png` e `.codex-temp/pubpaid-bitmap-intro-final/shot-0.png`, sem erros de console.

## Atualizacao rapida 2026-04-23

- A frente correta da `PubPaid 2.0` e a Phaser/canvas em `pubpaid-v2.html` + `pubpaid-phaser/`, nao a `pubpaid.html` velha.
- `server.js` agora expande a carteira PubPaid com `availableCoins`, `lockedMatchCoins` e `lockedWithdrawalCoins`, preservando compatibilidade com `balanceCoins`.
- `/api/pubpaid/pvp/join` passou a travar escrow real ao entrar na fila; se nao houver saldo disponivel, retorna erro sem criar fila falsa.
- Partidas PvP finalizadas agora liquidam automaticamente: vencedor recebe 80% do pote, casa retem 20%; empate devolve a entrada para os dois.
- Abandono em mesa ativa agora vira estado `abandoned` com `deadlineAt` de 60 segundos; se o jogador reconectar antes, a mesa volta a `active`, e depois do prazo o rival vence por abandono.
- O cliente Phaser atualiza carteira a cada 10s e no foco da aba; o HUD/painel mostra saldo disponivel e travado, e as mesas do salao abrem fila real para `Dardos` e `Dama`.
- Validacoes desta rodada: `node --check server.js`, `node --check` dos modulos `pubpaid-phaser` tocados, `GET /pubpaid-v2.html` local respondeu `200`, `/api/pubpaid/account` e `/api/pubpaid/pvp/state?gameId=darts` responderam `401` sem Google como esperado.
- Regra permanente da `PubPaid 2.0`: toda mecanica nova precisa vir acompanhada de camada visual forte em pixel art, luz, profundidade e acabamento; nao entregar apenas canvas/esqueleto funcional.

## Atualizacao rapida 2026-04-24 - PubPaid 2.0 rua

- A rua da `PubPaid 2.0` ganhou pacote de identidade visual com assets bitmap em `assets/pubpaid/street/`: taxi neon, moto neon, carrinho de rua e placa neon.
- `BootScene.js` carrega os novos assets e `StreetScene.js` substitui os carros procedurais de retangulos por veiculos em pixel art animados atravessando a rua.
- `StreetScene.js` tambem ganhou carrinho fixo de calcada, placa lateral, reflexos extras no asfalto, vapor animado e glows de fachada/porta para reforcar a leitura da marca PubPaid.
- Cache-bust atual da pagina: `pubpaid-v2.html` aponta para `app.js?v=20260424streetidentity1`.
- Validacoes desta rodada: `node --check pubpaid-phaser/scenes/StreetScene.js`, `node --check pubpaid-phaser/scenes/BootScene.js`, `node --check pubpaid-phaser/app.js` passaram; busca por ligacoes de agentes no runtime PubPaid ficou sem resultados.
- Pendencia visual: a porta `3000` estava fechada na validacao (`127.0.0.1:3000` recusou conexao), entao ainda precisa abrir/manter o servidor local e conferir no navegador real.
- Complemento da mesma frente: criados civis exclusivos de rua em `assets/pubpaid/street/civilians/` sem Canva e sem reaproveitar atendente do bar: mendigo sentado, bebado jogado no chao, senhora no ponto, homem com mochila, garoto de capuz e velho de bengala.
- `StreetScene.js` removeu o `waiterHero` da rua e distribuiu esses civis no ponto/terminal, calcada e area baixa do asfalto. Cache-bust atual: `20260424streetcivilians1`.
- Primeira base de caminhada RPG real aplicada ao player: `assets/pubpaid/sprites/rpg/player-8dir-walk-v1.png` tem 8 direcoes x 3 frames, frame 64x116. `BootScene.js` carrega como spritesheet e `StreetScene.js` escolhe frame por vetor de movimento, sem usar o balanco fake no player. Cache-bust atual: `20260424player8dir1`.

## Pedido atual em andamento

Fechar o pacote final desta rodada:

1. manter a home, popup e consulta no estado visual ja validado
2. atualizar todas as noticias e caches principais
3. subir o conjunto para `origin/main` e deixar o deploy pronto para acompanhar

Pedido seguinte ja combinado pelo usuario:

1. criar uma rotina diaria para auditar automaticamente se a foto de cada noticia nova esta com foco ok
2. depois disso, seguir revisando o modulo de abertura de noticia
3. criar uma equipe local de revisao premium para achar detalhes editoriais, cards sem titulo, CTAs sem funcao e gargalos de fontes antes da revisao manual com o usuario

## O que ja foi feito

- [startup-experience.js](C:/Users/junio/projeto codex/startup-experience.js) e [startup-experience.css](C:/Users/junio/projeto codex/startup-experience.css) foram retomados para devolver mais espaco ao popup inicial: o modal ficou maior, a coluna visual voltou a respirar e a cena de guerra ganhou mais terreno de batalha em pixel art, com mar de fundo, navios, trincheiras, tanques, canhoes e mais tropas entre robos e humanos.
- As diretrizes de cookies do popup tambem foram reescritas com apoio de especialistas de copy/redacao para um tom mais curto, publico e menos invasivo, trocando linguagem pesada de rastreio por preferencias, medicao e desempenho.
- Validacoes desta passada do popup: `node --check startup-experience.js` passou, [startup-experience.css](C:/Users/junio/projeto codex/startup-experience.css) ficou com `brace-balance=0` e `GET /` respondeu `200` na porta local `4062`, confirmando que a home continua servindo com o script do popup carregado.
- [index.html](C:/Users/junio/projeto codex/index.html) agora fixa o rodape em `data-army-count="5"` e atualiza a copy para "Esquadrão editorial em ataque".
- [script.js](C:/Users/junio/projeto codex/script.js) passou a travar o rodape em 5 robos e usar um blueprint fixo de posicoes, escala e pose para desktop e mobile.
- [styles.css](C:/Users/junio/projeto codex/styles.css) recebeu overrides para o esquadrao ocupar mais o card, subir no enquadramento e ganhar poses mais agressivas.
- [startup-experience.js](C:/Users/junio/projeto codex/startup-experience.js) ganhou mais elementos da cena de guerra: bombas extras, flashes, crateras e novos soldados.
- [startup-experience.css](C:/Users/junio/projeto codex/startup-experience.css) foi reforcado para puxar o pop-up para uma leitura mais de batalha: fundo escurecido, explosoes maiores, combate mais visivel e ajuste compacto no mobile.
- O mural pixelado (`startup-chaos-mural.svg`) foi removido do popup porque estava trazendo um personagem e feixes indevidos; o diretor da caneta voltou para a cena via `.catalogo-director-stage`.
- O popup agora tambem tem um letreiro central de "previsao do futuro", com animacao em etapas (`binario > ascii > programacao > noticia`) e os observadores alienigenas voltaram ao markup.
- O laser do editor foi reancorado para sair visualmente da mao direita, com brilho de origem na propria mao para deixar a leitura clara.
- [styles.css](C:/Users/junio/projeto codex/styles.css) tambem reforca a animacao de `.southern-cross-orbit` para girar no proprio eixo (`rotateZ`) sem ficar parecendo orbita lateral.
- A faixa [index.html](C:/Users/junio/projeto codex/index.html) de "analise editorial" agora ganhou uma copy descritiva maior e mais chamativa, com destaque inicial em negrito.
- [styles.css](C:/Users/junio/projeto codex/styles.css) agora da um tratamento proprio para `.signal-band-description`, com tipografia maior, mais peso visual e colunas mais equilibradas na `signal-band`.
- [script.js](C:/Users/junio/projeto codex/script.js) agora faz os 5 robos patrulharem a arena com deslocamento proprio, resposta ao ponteiro e formacao mais espalhada para ocupar mais do card.
- [styles.css](C:/Users/junio/projeto codex/styles.css) ampliou a arena dos robos ate a faixa do "apresenta", sobrepos a legenda no palco e reforcou a leitura de cores tipo Power Rangers (vermelho, azul, amarelo, verde e rosa).
- O palco dos robos tambem foi esticado mais para baixo, com `min-height` maior no card e a formacao reposicionada mais abaixo para ocupar o novo espaco sem deixar um bloco vazio.
- Ajuste estrutural novo: o card `INSIDERS INFOR` deixou de ocupar uma linha separada do grid e passou a ficar sobreposto na frente do proprio palco, para a arena dos robos preencher toda a faixa ate o fundo do bloco.
- [startup-experience.css](C:/Users/junio/projeto codex/startup-experience.css) agora reposiciona o diretor pixelado acima do painel de "previsao do futuro", centralizado no popup e com escalas proprias para tablet, mobile e modo compacto.
- O bloco "Arquivo vivo" agora abre uma barra lateral rolavel ao focar/digitar na busca, mostrando todo o historico de pautas ja verificadas e atualizando o recorte em tempo real junto do autocomplete.
- [arquivo-noticias.js](C:/Users/junio/projeto codex/arquivo-noticias.js), [index.html](C:/Users/junio/projeto codex/index.html) e [styles.css](C:/Users/junio/projeto codex/styles.css) receberam a estrutura, interacao e estilos do novo `feed-drawer` lateral.
- O esquadrao do rodape foi refeito para 3 robos em vez de 5, com poses mais agressivas, movimento mais rapido, rajadas pelos olhos e alvos simbolicos de desinformacao (`fake news`, `deepfake`, `dados torcidos`) em vez de pessoas especificas.
- [script.js](C:/Users/junio/projeto codex/script.js), [index.html](C:/Users/junio/projeto codex/index.html) e [styles.css](C:/Users/junio/projeto codex/styles.css) agora tratam esse card como uma cena de guerra contra o ruido: fundo mais pesado, copy nova e trio blindado.
- Foi feita tambem uma passada extra no mobile para empurrar a home para uma leitura mais "app": raios e rodape responsivos, bordas mais consistentes e blocos com padding/radius mais controlados em telas pequenas.
- O letreiro central do popup foi refeito para uma leitura maior e mais teatral: agora ele abre com terminal, atravessa binario > ascii > sintaxe > alegoria, segura uma manchete grande de "ataque alienigena iminente / guerra mundial iminente", derruba para "era so um meme" e reinicia o ciclo.
- [startup-experience.js](C:/Users/junio/projeto codex/startup-experience.js) e [startup-experience.css](C:/Users/junio/projeto codex/startup-experience.css) tambem reposicionam o diretor mais em cima do letreiro, apontando lateralmente para os termos com o laser mais comprido e mais legivel.
- A hero principal agora ficou preparada para 50 slots diarios de foto, combinando um shuffle por data do acervo de Cruzeiro do Sul com imagens locais do proprio feed quando houver, para variar mais a abertura sem depender so de uma lista fixa.
- [script.js](C:/Users/junio/projeto codex/script.js) agora monta esse pool diario, aplica foco diferente por slot e acelera um pouco a rotacao da hero.
- A pagina [pesquisa-acre-2026.html](C:/Users/junio/projeto codex/pesquisa-acre-2026.html) ganhou copy mais neutra de pesquisa, sem a leitura tao puxada para editorial.
- [pesquisa-acre-2026.css](C:/Users/junio/projeto codex/pesquisa-acre-2026.css) foi puxado para uma paleta mais neutra e clara, mantendo contraste mas saindo do clima pesado anterior.
- O fluxo da consulta administrativa da pesquisa foi deixado mais robusto em [pesquisa-acre-2026.js](C:/Users/junio/projeto codex/pesquisa-acre-2026.js), sanitizando melhor a senha digitada e deixando o feedback mais claro.
- O dashboard grande [backend/public/admin-dashboard.html](C:/Users/junio/projeto codex/backend/public/admin-dashboard.html) agora reforca o usuario padrao `admin`, evita tropeco se o usuario ficar em branco e tambem ficou com visual mais neutro.
- [styles.css](C:/Users/junio/projeto codex/styles.css) recebeu um ajuste final para os feixes do trio anti-desinformacao nascerem mais alto, claramente da faixa dos olhos em vez de parecerem sair do pescoco.
- [script.js](C:/Users/junio/projeto codex/script.js) agora mantem um fallback leve para montar o trio do bloco `Insiders Infor` mesmo se o `IntersectionObserver` falhar em navegadores/headless mais instaveis.
- [script.js](C:/Users/junio/projeto codex/script.js) tambem foi corrigido em dois pontos de runtime: a chamada precoce de `registerArticleCardLinks(radarGrid)` passou a ser deferida e o helper `getHeroTourismDailyPool()` voltou a existir como alias de `buildHeroTourismDailyPool()`.

## Validacoes ja feitas

Capturas mais recentes em `.codex-temp/visual-verify/`:

- `turn5-popup-desktop.png`
- `turn4-popup-mobile.png`
- `turn8-footer-desktop.png`
- `turn12-footer-desktop-tall.png`
- `turn13-squad-desktop.png`
- `turn14-popup-mobile.png`
- `turn15-popup-desktop.png`
- `turn15-popup-mobile.png`
- `turn18-popup-desktop-tall.png`

Leitura atual dessas validacoes:

- popup mobile: melhorou bem, a leitura de guerra ficou clara e mais pesada
- popup mobile mais recente: ok com o diretor da caneta de volta e sem o personagem estranho do mural
- popup com letreiro de previsao: ok no desktop e mobile, com painel central animado e aliens observando de novo
- popup com laser do editor: ok, agora o feixe nasce da mao direita com ponto de origem luminoso
- faixa "analise editorial": validada no navegador em desktop e mobile; a descricao ficou maior e sem overflow horizontal/vertical no bloco
- popup desktop: melhorou, mas ainda vale revisar se quiser mais caos visual acima da linha media do card
- rodape: o bloco foi reduzido para 5 robos e o codigo agora posiciona o esquadrao muito mais alto; as capturas do rodape ficaram inconsistentes por causa do enquadramento do iframe de validacao
- sintaxe: `node --check script.js` e `node --check startup-experience.js` passaram
- sintaxe: `node --check script.js` passou de novo apos a patrulha/interacao dos robos
- validacao visual automatica do novo card dos robos ficou pendente: Chrome/Edge headless nao conseguiram gerar screenshot local nesta sessao
- ajuste extra pedido pelo usuario: aumentar a arena dos robos para baixo; validacao visual automatica continua pendente pelo mesmo bloqueio no headless
- ajuste extra do ajuste: o usuario queria preencher todo o espaco morto ate embaixo mantendo o card Insiders na frente; isso foi atendido com overlay absoluto do card e arena ocupando a ultima faixa inteira
- ajuste novo do popup: usuario pediu o diretor acima da "previsao"; CSS atualizado, mas a validacao visual automatica ainda nao saiu porque Edge headless segue sem gerar screenshot nesta sessao
- sintaxe: `node --check arquivo-noticias.js` passou depois da barra lateral do arquivo
- consistencia basica: `styles.css` ficou com balanco de chaves ok (`brace-balance 0`) apos corrigir um `}` extra no bloco responsivo do drawer
- sintaxe: `node --check script.js` passou depois do novo trio de robos
- consistencia basica: `styles.css` continuou com balanco de chaves ok (`brace-balance 0`) apos os overrides finais do rodape e do polimento mobile
- tentativa de screenshot mobile automatica do HTML local ficou instavel nesta sessao: Chrome headless respondeu com tela de conexao recusada mesmo com o servidor local pronto, entao a revisao mobile foi fechada principalmente por inspecao estrutural do CSS responsivo
- sintaxe: `node --check script.js`, `startup-experience.js` e `pesquisa-acre-2026.js` passaram depois da retomada das ultimas ordens
- consistencia basica: `styles.css`, `startup-experience.css` e `pesquisa-acre-2026.css` ficaram com `brace-balance 0`
- backend local: `POST /api/pesquisa-acre-2026/admin` respondeu `200` com a senha `99831455a`
- backend local: `GET /api/admin/dashboard` respondeu `200` com Basic Auth `admin:99831455a`
- validacao visual automatica por screenshot continuou bloqueada nesta sessao porque o Chrome headless abriu com erro de `crashpad CreateFile: Acesso negado` e nao escreveu os PNGs, entao a conferencia visual final ainda pede navegador manual
- o bloqueio do `crashpad CreateFile: Acesso negado` foi contornado nesta retomada usando DevTools/CDP do Chrome headless com perfil temporario, sem depender da flag nativa de screenshot
- erro de runtime identificado e corrigido: `registerArticleCardLinks(radarGrid)` estava sendo chamado cedo demais e interrompia a execucao do `script.js`
- erro de runtime identificado e corrigido: `getHeroTourismDailyPool is not defined` quebrava `initializeHeroTourismHero()` e impedia inicializacoes posteriores na home
- sintaxe: `node --check startup-experience.js` passou depois da recolocacao do diretor para fora do card; [startup-experience.css](C:/Users/junio/projeto codex/startup-experience.css) ficou com `brace-balance 0`
- capturas novas em `.codex-temp/visual-review-home/`:
- `home-popup-desktop.png`
- `home-top-after-popup.png`
- `home-insiders-stage-fixed.png`
- leitura atual: popup desktop ok; topo da home ok; bloco `Insiders Infor` voltou a montar o trio anti-desinformacao e ficou visualmente preenchido
- capturas novas em `.codex-temp/visual-review-pesquisa/`:
- `pesquisa-topo.png`
- `pesquisa-admin-aberto.png`
- leitura atual: pagina de consulta ficou neutra e legivel; painel administrativo abre com visual coerente e sem distorcoes evidentes no desktop
- refresh local concluido em `POST /api/news/refresh` da raiz: `news-data.js` e `data/runtime-news.json` foram regenerados com 28 itens; `ac24horas` veio com 18, `agencia-acre` com 10, `jurua-online` voltou vazio e `prefeitura-czs` respondeu `404`
- refresh local concluido em `POST /api/news/refresh` do backend: [backend/data/news-cache.json](C:/Users/junio/projeto codex/backend/data/news-cache.json) foi atualizado com 10 itens online
- auditoria local de 30 fotos do feed concluida em `.codex-temp/news-focus-check/report.json`: 22 imagens com rosto detectado, 5 com nitidez fraca de origem e 14 casos receberam ajuste manual de `imageFocus` em [script.js](C:/Users/junio/projeto codex/script.js) e [arquivo-noticias.js](C:/Users/junio/projeto codex/arquivo-noticias.js)
- modulo [noticia.html](C:/Users/junio/projeto codex/noticia.html) revisado: a rota `GET /noticia.html?slug=...` e `GET /api/news/:slug` responderam `200` com slug real
- bug corrigido no modulo de noticia: o backend ja calculava SEO por slug, mas [noticia.html](C:/Users/junio/projeto codex/noticia.html) ainda usava titulo/meta fixos; a pagina agora consome placeholders `SEO_*` do servidor
- bug corrigido no modulo de noticia: [noticia-enhance.js](C:/Users/junio/projeto codex/noticia-enhance.js) existia no projeto mas nao era carregado pela pagina; o script foi ligado e os seletores principais foram alinhados aos IDs reais (`#detail-title`, `#detail-category`, `#detail-source-name`)
- rotina diaria de auditoria de fotos criada em [scripts/audit-news-image-focus.js](C:/Users/junio/projeto codex/scripts/audit-news-image-focus.js), ligada ao script `npm run audit:news-images` e ao workflow `.github/workflows/daily-news-sync.yml`
- primeira auditoria local gerou [data/news-image-focus-audit.json](C:/Users/junio/projeto codex/data/news-image-focus-audit.json): 30 noticias checadas, 24 ok, 6 em revisao, 0 warnings/erros de imagem e 12 com foco manual reconhecido
- revisao adicional de [noticia.js](C:/Users/junio/projeto codex/noticia.js): a pagina interna agora le cache offline `catalogo_news_cache_v2`/`v1`, persiste `catalogo_last_article_v2`/`v1` e aplica os mesmos focos manuais por slug usados na home/arquivo
- retomada do pedido visual anterior: [startup-experience.js](C:/Users/junio/projeto codex/startup-experience.js) e [startup-experience.css](C:/Users/junio/projeto codex/startup-experience.css) ganharam um marcador legivel no popup para a abertura de materia (`abrir materia / foto + resumo + fonte`) sem desfazer a cena de guerra/previsao
- retomada do pedido visual anterior: [styles.css](C:/Users/junio/projeto codex/styles.css) reforca a abertura da materia em `noticia.html` com titulo/eyebrow/hero/categoria mais legiveis e corrige trechos pequenos/terminais do rodape que ficavam ilegíveis
- ajuste global da abertura de materia: [modern-launch.css](C:/Users/junio/projeto codex/modern-launch.css) agora carrega a trava final contra espaco morto em toda pagina `detail-body`, vencendo os CSS anteriores e valendo para qualquer slug, nao so para uma materia especifica
- ajuste fino do popup apos revisao do usuario: o marcador de abertura de materia ficou menor e foi movido para o canto superior direito no desktop; no modo compacto/mobile ele fica oculto para nao competir com a cena principal
- popup reescrito a pedido do usuario: terminal agora passa por binario, ASCII, codigo de probabilidade e meme final (`DESTRUICAO MUNDIAL EM POUCOS DIAS se continuar assim`, assinado por alienigenas); foram adicionados alienigenas perto da constelacao do Cruzeiro do Sul e um onibus espacial com `EM` sentado subindo e descendo
- correcao do popup a pedido do usuario: o diretor da lanterna/laser saiu do canto esquerdo e foi centralizado acima do card do terminal de codigo, com laser apontando para baixo em direcao ao painel
- layout da abertura de materia refeito em [noticia-enhance.css](C:/Users/junio/projeto codex/noticia-enhance.css) para remover espaco morto em telas largas: largura maxima do artigo, hero com altura controlada e conteudo subindo logo abaixo da imagem
- correcao final do meme do popup: as fases do terminal agora usam janelas exclusivas de animacao (`binario`, `ASCII`, `codigo`, `probabilidade`, `alerta`, `meme`) para evitar texto um em cima do outro e deixar a piada entendivel.
- novo ajuste do popup: o diretor da lanterna/laser foi isolado no lado direito da cena, fora do card do terminal; o ceu ganhou mais alienigenas, anjos observando a guerra e avioes soltando bombas sem cobrir a leitura central.
- correcao nova do popup apos a ultima ordem do usuario: o diretor da lanterna/laser saiu do bloco visual e agora fica como elemento externo ao card, preso no vazio da esquerda do modal e mirando a coluna das leis/diretrizes; a montagem foi separada em `buildDirectorMarkup()` e `catalogo-welcome-shell`.
- correcao do espaco morto na abertura de materia: [noticia-enhance.css](C:/Users/junio/projeto codex/noticia-enhance.css) agora remove `min-height` artificial, força linhas automáticas no grid do artigo e garante que blocos `hidden` nao reservem faixa branca entre resumo e conteudo.
- ajuste do topo/rodape: [index.html](C:/Users/junio/projeto codex/index.html) removeu botoes redundantes do acesso rapido, subiu `Administrativo`, `SPO` e `Tracer` para o topo e removeu o bloco escondido `footer-utility-buttons` do rodape.
- ajuste dos robos do rodape: [index.html](C:/Users/junio/projeto codex/index.html) deixou de carregar `fx-lite` fixo no `body`, e [styles.css](C:/Users/junio/projeto codex/styles.css) ganhou pernas separadas/animadas para o esquadrao Insiders, evitando pose de pernas cruzadas.
- ajuste do card `solucoes em destaque` no rodape Insiders: [styles.css](C:/Users/junio/projeto codex/styles.css) trocou o fundo claro ilegivel por painel escuro de alto contraste e reforcou animacoes dos cards, bots, guindaste, chao e faiscas.
- ajuste no painel `Central Jurua Online`: [styles.css](C:/Users/junio/projeto codex/styles.css) adicionou camada de terminal com stream de numeros binarios, varredura de grid e prompt decorativo sem cobrir a leitura principal.
- ajuste do `Trending & Buzz`: [script.js](C:/Users/junio/projeto codex/script.js) agora monta diariamente 6 cards no bloco, sendo 3 de influenciadores/opiniao no estilo do card principal e 3 de polemicas/buzz; [styles.css](C:/Users/junio/projeto codex/styles.css) recebeu grid responsivo para essa vitrine diaria.
- ajuste da hero principal: [script.js](C:/Users/junio/projeto codex/script.js) parou de preencher a hero com fotos turisticas aleatorias e passou a montar um pool editorial com imagens de destaque das noticias do dia/mais recentes, limitado a uma noticia por tema; o foco usa `imageFocus` ou heuristica de rosto. [index.html](C:/Users/junio/projeto codex/index.html) e [agentes-newsroom-hero.css](C:/Users/junio/projeto codex/agentes-newsroom-hero.css) adicionaram um card lateral pequeno com categoria, titulo e resumo da noticia ativa.
- ajuste da logo: [styles.css](C:/Users/junio/projeto codex/styles.css) substituiu a rotacao 3D/efeito de bola da marca por giro no proprio eixo, zoom curto, brilho de estrela e retorno ao normal; aplicado na logo do topo e no selo do splash.
- nova subpagina demo [pubpaid.html](C:/Users/junio/projeto codex/pubpaid.html) criada como bar arcade pixelado, com fluxo de perfil, avatar, lobby local, 4 mesas PvP e economia em moedas ficticias para demonstracao do conceito.
- a experiencia da demo foi isolada em [pubpaid.css](C:/Users/junio/projeto codex/pubpaid.css) e [pubpaid.js](C:/Users/junio/projeto codex/pubpaid.js), com login estilo Google em modo local, bonus inicial de 100 moedas, rival simulado e historico persistido em `localStorage`.
- [index.html](C:/Users/junio/projeto codex/index.html) ganhou atalhos para `PubPaid Demo` e [server.js](C:/Users/junio/projeto codex/server.js) passou a registrar `/pubpaid.html` no mapa de SEO/sitemap.
- redesign visual forte na `PubPaid`: [pubpaid.html](C:/Users/junio/projeto codex/pubpaid.html) e [pubpaid.css](C:/Users/junio/projeto codex/pubpaid.css) agora puxam a hero para um bar 16-bit mais rico, com fachada, letreiro, janelas, arcade, jukebox, banquetas, rug, mesas mais trabalhadas e personagens de palco com mais presenca.
- segunda passada visual na `PubPaid`: o palco agora tambem tem mesas laterais de lounge com NPCs conversando e bebendo, clientes sentados no balcao e rotas separadas de garcons/garconetes atravessando a cena em camadas para dar vida de bar sem parecer colisao.
- terceira passada grande na `PubPaid`: [pubpaid.html](C:/Users/junio/projeto codex/pubpaid.html), [pubpaid.css](C:/Users/junio/projeto codex/pubpaid.css) e [pubpaid.js](C:/Users/junio/projeto codex/pubpaid.js) agora abrem a demo pela porta do bar, passam por registro e montagem do avatar e so depois liberam o `Game Coin`.
- a `PubPaid` agora ganhou um grid com 8 mesas/jogos em demonstracao: `Sinuca Turbo`, `Xadrez Blitz`, `Damas Turbo`, `Quem Bebe Mais`, `Dado dos Copos`, `Blackout Bar`, `21 do Bar` e `Segredo da Dama Vermelha`.
- pedido inseguro ajustado na demo: a ideia de "levantar saias" nao entrou; foi substituida pela mesa secreta segura `Segredo da Dama Vermelha`, mantendo o clima de lounge/blefe sem assedio.
- o palco visual da `PubPaid` tambem ganhou a `Dama de Vermelho` no canto do bar, integrada ao cenario pixelado como gancho para a mesa secreta.
- validacoes novas da `PubPaid`: `node --check pubpaid.js` passou apos a reestruturacao completa, [pubpaid.css](C:/Users/junio/projeto codex/pubpaid.css) ficou com `brace-balance=0` e `GET /pubpaid.html` respondeu `200` na porta local `4016` com os novos marcadores de onboarding e versionamento `20260417a`.
- quarta passada grande na `PubPaid`: [pubpaid.html](C:/Users/junio/projeto codex/pubpaid.html), [pubpaid.css](C:/Users/junio/projeto codex/pubpaid.css) e [pubpaid.js](C:/Users/junio/projeto codex/pubpaid.js) foram reescritos para trocar a vitrine em cards por um pub jogavel com canvas central, mapa externo + interno, colisao, interacao por proximidade e HUD mais limpo.
- a `PubPaid` agora usa duas artes pixel novas em [assets/pubpaid-exterior-v2.png](C:/Users/junio/projeto codex/assets/pubpaid-exterior-v2.png) e [assets/pubpaid-interior-v2.png](C:/Users/junio/projeto codex/assets/pubpaid-interior-v2.png), geradas como base visual da fachada e do salao.
- a logica nova da `PubPaid` agora cobre entrada pela porta, ficha local do personagem com bonus inicial de 100 moedas, musica 16-bit sintetizada no navegador, palco/jukebox interativos e quatro mesas reais priorizadas: `Sinuca Real`, `Damas Pixel`, `21 do Bar` e `Copos e Dados`.
- correcao nova na home: [index.html](C:/Users/junio/projeto codex/index.html) restaurou a segunda faixa do topo como `Entretenimento e serviços`, com links para `games.html`, `infantil.html`, `estudantes.html`, `catalogo-servicos.html`, `ninjas.html`, `pubpaid.html` e `vendas.html`; `Administrativo`, `SPO` e `Tracer` ficaram so na faixa superior.
- [styles.css](C:/Users/junio/projeto codex/styles.css) agora anima codigo binario no fundo dessa faixa superior de atalhos (`header-services-strip`), com grid neon + stream correndo continuamente atras dos botoes.
- validacoes novas da home: `GET /` respondeu `200` na porta local `4017` com `Entretenimento e serviços`, os links de `Games`, `Infantil`, `Estudantil`, `Pedido de serviço`, `Ninjas`, `Pub Paid` e `Vendas locais`, e [styles.css](C:/Users/junio/projeto codex/styles.css) seguiu com `brace-balance=0`.
- validacoes novas da `PubPaid` apos a quarta passada: `node --check pubpaid.js` passou, [pubpaid.css](C:/Users/junio/projeto codex/pubpaid.css) ficou com `brace-balance=0`, [assets/pubpaid-exterior-v2.png](C:/Users/junio/projeto codex/assets/pubpaid-exterior-v2.png) e [assets/pubpaid-interior-v2.png](C:/Users/junio/projeto codex/assets/pubpaid-interior-v2.png) foram copiados para o workspace e `GET /pubpaid.html` respondeu `200` na porta local `4024` com os novos marcadores de canvas e artes.
- tentativa de screenshot automatica da nova `PubPaid` seguiu bloqueada nesta sessao: Chrome headless continuou falhando com `crashpad CreateFile: Acesso negado`, entao a validacao visual final ainda pede navegador manual.
- rodada nova nas subpaginas `Games`, `Infantil` e `Estudantes`: [games.html](C:/Users/junio/projeto codex/games.html), [infantil.html](C:/Users/junio/projeto codex/infantil.html), [estudantes.html](C:/Users/junio/projeto codex/estudantes.html), [subpages-redesign.js](C:/Users/junio/projeto codex/subpages-redesign.js) e [subpages-redesign.css](C:/Users/junio/projeto codex/subpages-redesign.css) foram atualizados para sair do visual placeholder e ganhar editorial funcional.
- `games.html` agora usa foto completa do `Meta Quest 3`, com ajuste de moldura VR para preservar o headset inteiro em vez de cortar a imagem.
- `infantil.html` trocou blobs por imagens reais de `Bob Esponja`, `Bluey`, `Dora`, `Mundo Bita`, `Turma da Monica` e `Galinha Pintadinha`; o bloco de brincadeiras agora tem memoria ilustrada por objetos, caça-palavras, continhas com icones e quebra-cabeça deslizante.
- o editorial infantil real foi reforcado em [server.js](C:/Users/junio/projeto codex/server.js) e [data/topic-feed-fallback.json](C:/Users/junio/projeto codex/data/topic-feed-fallback.json): a editoria `kids` agora prioriza Animation Magazine, AWN, Toy Insider, Cartoon Brew, YouTube Blog e fallback tematico de desenhos, animacao e creators.
- [noticia.html](C:/Users/junio/projeto codex/noticia.html) e [noticia-enhance.css](C:/Users/junio/projeto codex/noticia-enhance.css) ganharam mais um guarda de layout para derrubar o espaco branco entre resumo e conteudo em telas largas.
- o backend de `topic-feed` em [server.js](C:/Users/junio/projeto codex/server.js) foi acelerado: fontes em paralelo, preview de imagem so quando necessario, timeout menor para previews e trava total para cair em cache/fallback rapido em vez de deixar o botao travado.
- ajuste novo do popup em [startup-experience.js](C:/Users/junio/projeto codex/startup-experience.js) e [startup-experience.css](C:/Users/junio/projeto codex/startup-experience.css): o selo `abrir materia / foto + resumo + fonte` saiu, a cena do ceu foi mais separada, o Cruzeiro do Sul ganhou uma zona limpa de destaque e o onibus espacial passou a percorrer o lado direito do card sem invadir a constelacao.
- a guerra no popup tambem ficou mais explicita: entraram jatos baixos na faixa de combate e tanques visiveis na linha do chao, alem do reposicionamento dos bombardeiros para nao encavalarem no campo da constelacao.
- sintaxe: `node --check subpages-redesign.js` e `node --check server.js` passaram depois dessa rodada.
- sintaxe: `node --check startup-experience.js` passou depois da rodada nova do popup; [startup-experience.css](C:/Users/junio/projeto codex/startup-experience.css) ficou com `brace-balance=0`.
- ajuste estrutural final do popup em [startup-experience.css](C:/Users/junio/projeto codex/startup-experience.css): o card desktop agora trava a altura visual do painel esquerdo e faz a coluna de texto da direita rolar sozinha, evitando que a arte do ceu esticasse ate 1600px e jogasse guerra/chao para fora da area realmente visivel.
- validacao visual real do popup concluida com Chrome headless via `puppeteer-core` local; capturas novas em [.codex-temp/welcome-popup-review.png](C:/Users/junio/projeto codex/.codex-temp/welcome-popup-review.png), [.codex-temp/welcome-visual-panel-review.png](C:/Users/junio/projeto codex/.codex-temp/welcome-visual-panel-review.png), [.codex-temp/welcome-visual-panel-review-2.png](C:/Users/junio/projeto codex/.codex-temp/welcome-visual-panel-review-2.png) e [.codex-temp/welcome-visual-final.png](C:/Users/junio/projeto codex/.codex-temp/welcome-visual-final.png).
- leitura final dessa validacao: selo de `abrir materia` removido; chip superior sem interferencia; Cruzeiro do Sul limpo e dominante; onibus espacial inteiro no quadro; faixa de guerra e chao visiveis no card; tanques/jatos presentes e mais legiveis.
- consistencia basica: [subpages-redesign.css](C:/Users/junio/projeto codex/subpages-redesign.css) e [noticia-enhance.css](C:/Users/junio/projeto codex/noticia-enhance.css) ficaram com `brace-balance=0`.
- rotas locais novas responderam `200` na porta `4031`: `games.html`, `infantil.html`, `estudantes.html` e `noticia.html?slug=apos-enxurrada-bairros-da-baixada-recebem-mutirao-de-limpeza-nesta-sexta-17`.
- validacao do editorial global: `GET /api/topic-feed?topic=games&limit=3` respondeu em ~58 ms com fontes ao vivo; `GET /api/topic-feed?topic=study&limit=3` respondeu em ~3 ms com fontes ao vivo; `GET /api/topic-feed?topic=kids&limit=3` passou a responder em ~9 s usando fallback real/stale em vez de travar por 30 s ou mais.
- retomada da sessao interrompida em 2026-04-17: o pacote mais provavel recuperado do contexto local era `popup inicial + games + infantil + estudantes + noticia`; a correcao efetiva restante ficou concentrada em `games` e `noticia`.
- [noticia.js](C:/Users/junio/projeto codex/noticia.js) agora ativa de fato o bloco `#detail-fact-tabs` quando ele e renderizado e limpa a classe ao esconder; isso removeu a falsa faixa branca entre resumo e conteudo que era, na pratica, uma secao `reveal` com `opacity: 0`.
- [subpages-redesign.js](C:/Users/junio/projeto codex/subpages-redesign.js) deixou de autoabrir o modal de aluguel VR em `games.html`; a janela segue abrindo por clique e por hash explicito (`#vr-rental-popup`), sem cobrir a hero ao carregar a pagina.
- [games.html](C:/Users/junio/projeto codex/games.html), [subpages-redesign.css](C:/Users/junio/projeto codex/subpages-redesign.css), [noticia.html](C:/Users/junio/projeto codex/noticia.html), [infantil.html](C:/Users/junio/projeto codex/infantil.html), [estudantes.html](C:/Users/junio/projeto codex/estudantes.html) e [ninjas.html](C:/Users/junio/projeto codex/ninjas.html) receberam `cache bust` novo (`20260417b` / `20260417c`) para garantir que navegador e deploy puxem os JS/CSS corrigidos.
- a secao VR de `games.html` tambem foi corrigida para bater com a memoria da ultima rodada: trocou a foto fechada do Quest por uma imagem mais aberta do Wikimedia Commons (`Meta Quest 3 - 1.jpg`, `Kyu3a / Wikimedia Commons - CC BY-SA 4.0`) e o layout da moldura VR foi aberto/achatado para o headset aparecer inteiro, sem thumbnail encolhida no canto.
- validacoes novas da retomada em [.codex-temp/session-recovery-review/](C:/Users/junio/projeto codex/.codex-temp/session-recovery-review): `home-popup.png`, `games-top-fixed.png`, `games-vr-section-fixed-3.png`, `infantil-top.png`, `estudantes-top.png`, `noticia-top-fixed.png`.
- leitura atual dessas validacoes: popup continua coerente; `games` abre sem modal cobrindo a pagina; a secao VR agora mostra o Quest inteiro com leitura boa; `infantil` e `estudantes` seguem montando; `noticia` voltou a exibir a leitura editorial entre resumo e corpo, sem faixa branca fantasma.
- equipe local de revisao criada em `.codex-review-team/` com agentes fixos para UI/detail, editorial para leitor, CTA/funcao, scouting de fontes e revisao final de publicacao.
- auditor novo em [scripts/review-team-audit.js](C:/Users/junio/projeto codex/scripts/review-team-audit.js) ligado ao comando `npm run review:team`, gerando `.codex-temp/review-team/latest-report.md` e `.codex-temp/review-team/latest-report.json`.
- primeira passada do auditor encontrou muito ruido vindo de ambientes headless e de atributos tecnicos como `loading="lazy"`; o script foi refinado para ignorar esse lixo e destacar melhor problemas reais do site.
- retomada nova em 2026-04-17: a ordem do usuario para usar o script de memoria foi registrada com `node scripts/codex-memory.js add-order`, e os relatórios da equipe de revisão foram atualizados em `.codex-memory/assets.json`.
- limpeza editorial ampla aplicada apos `npm run review:team`: textos com cara interna como `pauta`, `carregando...`, `subindo em breve`, `painel interno` e copies de bastidor foram trocados por linguagem mais clara para leitor em home, arquivo, games, infantil, estudantes, noticia, ninjas, vendas, admin, widgets e dados eleitorais.
- [scripts/review-team-audit.js](C:/Users/junio/projeto codex/scripts/review-team-audit.js) recebeu filtros extras para nao marcar classe CSS tecnica com `briefing` nem regex sanitizadora que contem `loading`; isso remove falso positivo sem esconder copy real.
- validacao final desta retomada: `npm run review:team` ficou com `totalIssues: 0` em 66 arquivos; `node --check` passou para os JS tocados, incluindo `script.js`, `server.js`, `subpages-redesign.js`, `noticia.js`, `startup-experience.js`, `arquivo-noticias.js`, `elections-data.js`, `vendas.js` e `scripts/review-team-audit.js`.
- nova ordem registrada pelo script de memoria: criar o website filho `Escritorio` com equipe de especialistas do jornal/subpaginas, Codex como CEO operacional, agente de pixel art, hover explicativo, popup com avatar e escritório animado em pixel art.
- [escritorio.html](C:/Users/junio/projeto codex/escritorio.html), [escritorio.css](C:/Users/junio/projeto codex/escritorio.css) e [escritorio.js](C:/Users/junio/projeto codex/escritorio.js) foram criados com 13 agentes: CEO, editora-chefe, revisor, copy, games, infantil, estudo/fontes, vendas, design, pixel art/animação, checagem de fontes, social/buzz e dev/automação.
- A página `Escritório dos Agentes` tem planta grande com salas, redação, subpáginas, design, revisão, café/descanso, automação, movimento com colisão simples, conversas automáticas, hover com fala e popup `Quero conhecer você` com avatar pixel art e especialidades.
- [index.html](C:/Users/junio/projeto codex/index.html) ganhou botão `Escritório` na faixa `Entretenimento e serviços` e link no mapa do rodapé; [server.js](C:/Users/junio/projeto codex/server.js) registrou `/escritorio.html` no SEO/sitemap.
- Validações da página `Escritório`: `node --check escritorio.js` e `node --check server.js` passaram; `escritorio.css` ficou com `brace-balance=0`; `npm run review:team` passou com `totalIssues: 0` em 68 arquivos; `GET /`, `GET /escritorio.html` e sitemap local responderam `200`.
- Captura visual registrada em [.codex-temp/escritorio-office-review-2.png](C:/Users/junio/projeto codex/.codex-temp/escritorio-office-review-2.png): 13 agentes renderizados, planta limpa com nomes, cards de equipe e popup testado no agente `Pixo`.
- ajuste novo a partir da referência visual enviada pelo usuário: o `Escritório dos Agentes` foi redesenhado para um modelo top-down em pixel art mais parecido com um ambiente de IDE/VS Code, com moldura de editor, barra lateral, mapa principal e terminal à direita.
- [escritorio.html](C:/Users/junio/projeto codex/escritorio.html), [escritorio.css](C:/Users/junio/projeto codex/escritorio.css) e [escritorio.js](C:/Users/junio/projeto codex/escritorio.js) agora usam salas menores e mais claras, agentes em escala menor, móveis top-down, café/descanso, terminal que reage ao hover/clique e avatar pixelado no painel lateral.
- [index.html](C:/Users/junio/projeto codex/index.html) também recebeu o botão `Escritório` no menu principal (`main-nav`), além dos atalhos que já existiam na faixa de serviços e no rodapé.
- validação final do novo modelo do `Escritório`: `node --check escritorio.js` passou; [escritorio.css](C:/Users/junio/projeto codex/escritorio.css) ficou com `brace-balance=0`; `npm run review:team` passou com `totalIssues: 0` em 68 arquivos; `GET /` e `GET /escritorio.html` responderam `200` e confirmaram o botão no menu principal.
- captura final do modelo redesenhado registrada em [.codex-temp/escritorio-reference-redesign-final.png](C:/Users/junio/projeto codex/.codex-temp/escritorio-reference-redesign-final.png): 13 agentes, frame estilo IDE, terminal lateral e mapa top-down renderizados.
- nova passada visual do `Escritório` a pedido do usuário, usando as referências extras de escritório pixel art: a planta ganhou mais ambientação (janelas, quadro de tarefas, poster, painel de status, corredor/rug, cabo visual), novos props de escritório (estantes extras, bebedouro, impressora, mesa de apoio, planta adicional) e o fundo geral ficou mais bonito e mais próximo do clima de IDE/painel vivo.
- os agentes do `Escritório` também foram refinados em [escritorio.js](C:/Users/junio/projeto codex/escritorio.js) e [escritorio.css](C:/Users/junio/projeto codex/escritorio.css): `createAvatar()` agora monta sprites CSS mais elaborados, com rosto, acessório, mochila, cinto, sapatos e props por agente; cada especialista passou a ter perfil visual próprio (badge, óculos, headset, visor, laço, boné, tie e ferramentas/objetos diferentes).
- a movimentação local do `Escritório` deixou de ser só passeio aleatório por sala e passou a usar pontos de atividade por ambiente (`desk`, mural, café, lounge, rack/dev), com pequenas pausas contextuais para a cena parecer mais organizada e intencional.
- validações desta passada do `Escritório`: `node --check escritorio.js` passou; [escritorio.css](C:/Users/junio/projeto codex/escritorio.css) ficou com `brace-balance=0`; `GET /escritorio.html` respondeu `200` na porta local `4051`; tentativa de screenshot local por Edge/Chrome headless continuou bloqueada nesta sessão por `crashpad CreateFile: Acesso negado`, então a conferência visual final ainda pede navegador real.
- passada nova do `Escritório` a pedido do usuário com apoio de dois agentes (`design/art` e `layout`): os textos do mapa foram limpos para não ficarem sentados em cima de móveis/objetos, com plaquetas curtas de sala ancoradas na frente da arte e nomes dos agentes aparecendo principalmente em hover/interação.
- o `Escritório` agora também usa um background bitmap real gerado por imagem em [assets/escritorio-floor-art-v1.png](C:/Users/junio/projeto codex/assets/escritorio-floor-art-v1.png), ligado ao mapa principal em [escritorio.css](C:/Users/junio/projeto codex/escritorio.css) no lugar de depender só de fundo construído em CSS.
- para deixar a arte respirar, a camada de objetos decorativos do mapa passou a ficar oculta visualmente enquanto as colisões e a lógica dos agentes permanecem em [escritorio.js](C:/Users/junio/projeto codex/escritorio.js); isso preserva movimento e hover sem duplicar móveis por cima da arte.
- validações desta passada do `Escritório`: `node --check escritorio.js` passou; [escritorio.css](C:/Users/junio/projeto codex/escritorio.css) ficou com `brace-balance=0`; `GET /escritorio.html` respondeu `200` e `GET /assets/escritorio-floor-art-v1.png` respondeu `200` na porta local `4054`.
- nova passada estrutural no `Escritório` a pedido do usuário: foi gerada uma arte bitmap maior em [assets/escritorio-floor-art-v2.png](C:/Users/junio/projeto codex/assets/escritorio-floor-art-v2.png), com mais folga de circulação, mais mesas/estações de computador nas bordas e um desk executivo forte no canto superior esquerdo para o CEO.
- [escritorio.js](C:/Users/junio/projeto codex/escritorio.js) agora reescala `WORLD`, `rooms`, `obstacles`, `roomSpots` e os spawns iniciais dos agentes; eles passaram a nascer em pontos mais seguros e mais próximos dos computadores, fora de mesa/parede, enquanto o `Codex CEO` nasce na cadeira nobre do topo esquerdo e prefere continuar naquela zona.
- [escritorio.css](C:/Users/junio/projeto codex/escritorio.css) tambem ampliou a area visual do mapa (`office-vscode-body` e `office-map`) para o escritório respirar melhor e o navegador puxar a arte `v2` maior; [escritorio.html](C:/Users/junio/projeto codex/escritorio.html) recebeu novo cache-bust (`20260417d`) para forçar recarga do CSS/JS atualizados.
- validações desta passada do `Escritório`: `node --check escritorio.js` passou; [escritorio.css](C:/Users/junio/projeto codex/escritorio.css) ficou com `brace-balance=0`; `GET /escritorio.html` respondeu `200` e `GET /assets/escritorio-floor-art-v2.png` respondeu `200` na porta local `4055`.
- passada editorial nova no `Escritório` a pedido do usuário: a copy da página em [escritorio.html](C:/Users/junio/projeto codex/escritorio.html) foi reescrita para falar com visitante/leitor em vez de soar como texto interno para programador, com hero, cartões, método e terminal em tom mais público e convidativo.
- [escritorio.js](C:/Users/junio/projeto codex/escritorio.js) também ganhou uma nova agente, `Nina Texto`, dedicada a copy, edição e criação de texto do próprio escritório, além de ajustes nas strings do terminal, bolhas e descrição do `Codex CEO` para reduzir a leitura de bastidor técnico.
- validações desta passada editorial do `Escritório`: `node --check escritorio.js` passou e `GET /escritorio.html` respondeu `200` na porta local `4057`.
- nova passada de vida no `Escritório` a pedido do usuário: [escritorio.js](C:/Users/junio/projeto codex/escritorio.js) agora carrega notícias recentes via `fetch("./api/news")` com fallback local e usa isso para montar balões de conversa com assuntos do dia a dia e comentários sobre manchetes recentes, em vez de só frases genéricas de sistema.
- a lógica de `chooseConversation()` agora mistura papo cotidiano do escritório com comentários sobre notícias do dia, deixando os balões mais humanos e mais conectados ao portal.
- validações desta passada de conversas do `Escritório`: `node --check escritorio.js` passou; `GET /escritorio.html` respondeu `200` e `GET /api/news` respondeu `200` na porta local `4058`.
- nova frente pública criada a pedido do usuário: [escritorio-nerd.html](C:/Users/junio/projeto codex/escritorio-nerd.html) e [escritorio-nerd-config.js](C:/Users/junio/projeto codex/escritorio-nerd-config.js) apresentam um time irmão do escritório principal, focado em game dev, arte, física, HUD, som, avatar, economia e QA do `PubPaid`.
- [escritorio.js](C:/Users/junio/projeto codex/escritorio.js) foi adaptado para aceitar configuração externa via `window.__OFFICE_CONFIG__`, permitindo reutilizar a planta, o terminal e a lógica dos agentes para equipes públicas diferentes sem duplicar o motor da página.
- [pubpaid.html](C:/Users/junio/projeto codex/pubpaid.html) e [pubpaid.css](C:/Users/junio/projeto codex/pubpaid.css) agora destacam o novo `Escritório Nerd` com link próprio e uma seção pública explicando as frentes que estão redesenhando física, gráficos e experiência da noite.
- [escritorio.html](C:/Users/junio/projeto codex/escritorio.html), [escritorio.css](C:/Users/junio/projeto codex/escritorio.css) e [server.js](C:/Users/junio/projeto codex/server.js) também foram atualizados para ligar a nova página na navegação, dar tema visual próprio ao modo nerd e incluir a rota `/escritorio-nerd.html` no SEO/sitemap.
- validações desta rodada do `Escritório Nerd`: `node --check escritorio.js`, `node --check escritorio-nerd-config.js` e `node --check server.js` passaram; `npm run review:team` voltou com `totalIssues: 0` em 70 arquivos; `GET /escritorio-nerd.html` e `GET /pubpaid.html` responderam `200` na porta local `4075`.
- quinta passada grande na `PubPaid`: [pubpaid.js](C:/Users/junio/projeto codex/pubpaid.js), [pubpaid.html](C:/Users/junio/projeto codex/pubpaid.html) e [pubpaid.css](C:/Users/junio/projeto codex/pubpaid.css) ganharam modo demo explicito com lobby e apostas fixas (`2, 5, 10, 20, 30, 40, 50, 100`), rivais da casa, loja premium do garçom com bebidas consumíveis de sorte/azar leve, upgrades visuais permanentes e NPCs vivos no salão com falas decorativas sem colisão.
- balanceamento novo da `PubPaid`: a taxa da casa foi reduzida para também fazer sentido nas apostas menores do modo demo, evitando que entradas de `2` e `5` quase não tivessem retorno.
- validações desta passada da `PubPaid`: `node --check pubpaid.js` passou de novo e [pubpaid.css](C:/Users/junio/projeto codex/pubpaid.css) ficou com `brace-balance=0`; a conferência visual do novo posicionamento do garçom, NPCs e balões ainda pede navegador real.
- retomada assumida em 2026-04-19: a sessão anterior não estava mais executando; não havia Node/Chrome preso antes da retomada. O servidor local foi iniciado em `http://127.0.0.1:3000` com PID `17004`.
- validação da retomada: `node --check` passou para `server.js`, `script.js`, `startup-experience.js`, `pubpaid.js`, `site-google-auth.js`, `pesquisa-acre-2026.js`, `catalogo-servicos.js`, `escritorio.js`, `ninjas.js`, `noticia.js`, `backend/server.js`, `backend/source-config.js`, `esttiles-config.js` e `office-command-chat.js`; `npm run review:team` ficou com `totalIssues: 0` em 86 arquivos.
- CSS da retomada: `styles.css`, `startup-experience.css`, `pubpaid.css`, `pesquisa-acre-2026.css`, `catalogo-servicos.css`, `mobile-home-final.css` e `esttiles.css` ficaram com `brace-balance=0`.
- rotas locais validadas na retomada: `/`, `/pubpaid.html`, `/ninjas.html`, `/pesquisa-acre-2026.html`, `/catalogo-servicos.html`, `/esttiles.html` e `/fontes-monitoradas.html` responderam `200`; `/api/auth/config`, `/api/auth/session`, `/api/pesquisa-acre-2026/bridge` e `/api/news?limit=3` responderam ok.
- segurança Pix/Auth na retomada: localmente o Google Auth aparece desativado por falta de `GOOGLE_AUTH_CLIENT_ID`, como esperado; `/api/pubpaid/deposit/pix` e `/api/pubpaid/deposits` bloqueiam sem Google (`401`); `/api/ninjas/pix` fica indisponível sem `NINJAS_PIX_KEY` (`503`); as respostas testadas não expõem `copyCode` nem `key`.
- validação visual automática da retomada: Chrome/Edge headless não geraram PNG nesta máquina mesmo com perfis temporários e foram encerrados; a conferência visual final segue dependente de navegador real.
- rodada PubPaid/admin em 2026-04-20: [server.js](C:/Users/junio/projeto codex/server.js) ganhou carteira PubPaid, saques pendentes, revisão manual de depósitos/saques e série semanal Acre 2026; [backend/public/admin-dashboard.html](C:/Users/junio/projeto codex/backend/public/admin-dashboard.html) agora mostra KPIs PubPaid, filas pendentes, carteiras e variação semanal; [pubpaid.html](C:/Users/junio/projeto codex/pubpaid.html) recebeu o botão de topo `Editor Chefe Call`; [office-command-chat.js](C:/Users/junio/projeto codex/office-command-chat.js) abre por esse botão; [pesquisa-acre-2026.css](C:/Users/junio/projeto codex/pesquisa-acre-2026.css) inverteu mobile para formulário em cima e resultados embaixo.
- dados do jogo zerados em 2026-04-20: `data/pubpaid-deposits.json`, `data/pubpaid-withdrawals.json`, `data/pubpaid-wallets.json` e `data/pubpaid-sprite-scout.json` foram recriados com `[]` para tirar saldo legado local.
- enquete eleitoral da home semanal em 2026-04-20: [server.js](C:/Users/junio/projeto codex/server.js) passou a normalizar votos antigos, bloquear repetição só na semana corrente, entregar `currentWeekKey` e `weeklyTrend` e montar o snapshot público da home com votos/opinião da semana atual; [script.js](C:/Users/junio/projeto codex/script.js) trocou a mensagem da home para deixar claro que o voto vale por semana; [backend/public/admin-dashboard.html](C:/Users/junio/projeto codex/backend/public/admin-dashboard.html) ganhou a seção `Home eleitoral • variação semanal`.

## Pendencia principal agora

- Acompanhar o deploy da subida mais recente em `origin/main` e conferir o comportamento no servidor.
- Revisar visualmente a fila de 6 fotos marcadas em `data/news-image-focus-audit.json` e decidir se alguma precisa de novo `imageFocus`.
- Conferir localmente o popup, uma abertura de materia e o rodape apos os overrides de legibilidade.
- Conferir visualmente o popup em navegador local com o servidor ligado; a ultima checagem HTTP em `127.0.0.1:4010` falhou apenas porque nao havia servidor escutando nessa porta.
- Conferir visualmente o popup atualizado em `http://127.0.0.1:3000/`; a checagem HTTP da home respondeu `200`, mas a leitura final da composicao ainda depende do navegador.
- Conferir no navegador a materia `colegio-acreano-e-derrotado-e-vai-disputar-o-bronze-na-serie-prata`; rota local respondeu `200`, mas a confirmacao final do espaco morto deve ser visual.
- Conferir no navegador o topo e o rodape Insiders apos remover `fx-lite`; a home local respondeu `200`, mas a fluidez final dos robos deve ser avaliada visualmente.
- Decidir quando subir os ajustes locais da auditoria de fotos, workflow diario e modulo de noticia.
- Se o servidor ou DNS reagirem mal depois da subida, registrar o erro exato para a proxima passada.
- validar visualmente a nova `pubpaid.html` no navegador e decidir se ela entra tambem em algum bloco editorial da home alem do acesso rapido/rodape.
- validar visualmente a nova abertura da `PubPaid` no navegador, especialmente a leitura da porta, o onboarding por etapas e o encaixe da `Dama de Vermelho` no palco.
- decidir numa proxima passada quais das novas mesas da `PubPaid` viram multiplayer real primeiro e se alguma recebe arte pixel dedicada adicional.
- validar manualmente a nova `PubPaid` canvas-driven no navegador local, com foco em: fachada grande na abertura, navegacao com colisao dentro do salao, legibilidade do HUD e sensacao da `Sinuca Real` dentro do modal.
- validar manualmente no navegador a nova rodada de [games.html](C:/Users/junio/projeto codex/games.html), [infantil.html](C:/Users/junio/projeto codex/infantil.html), [estudantes.html](C:/Users/junio/projeto codex/estudantes.html) e uma materia em [noticia.html](C:/Users/junio/projeto codex/noticia.html), com foco em: foto inteira do Meta Quest, leitura dos cards infantis reais, sensacao dos minijogos e confirmacao visual final de que o espaco branco da materia sumiu.
- manter a equipe `.codex-review-team/` como gate antes de revisoes grandes; o relatorio atual esta zerado, entao o proximo foco e validacao visual/manual das paginas tocadas.
- validar manualmente `escritorio.html` no navegador real, especialmente hover, popup, caminhada dos agentes, legibilidade mobile e se o usuario quer mais salas/personagens.

## Observacoes importantes

- A partir de 2026-04-17, a memoria do projeto tambem passa a viver em `.codex-memory/` (`README.md`, `current-state.md`, `handoff.md`, `orders.json`, `assets.json`) com registro estruturado de ordens e referencias de anexos.
- `CODEX_MEMORY.md` continua sendo o resumo narrativo de alto nivel; `.codex-memory/` e a memoria operacional estruturada de retomada.
- O workspace continua com outras alteracoes ja existentes do usuario em `news-data.js`, `server.js` e arquivos de `data/`; nao reverter.
- Arquivos de `data/` mudam durante validacoes locais; evitar incluir ruido desnecessario em commit.
- O backend local criou JSONs vazios em `backend/data/` ao subir o servidor; isso e ruido operacional e nao precisa entrar no commit.
- O pacote desta rodada subiu para `origin/main` no commit `96b887c` (`Atualizar home final e renovar noticias`).
- A auditoria de foco de fotos feita depois disso ainda esta local; nao foi commitada nem enviada.
- O commit anterior que ja foi para `origin/main` foi `5cd6811` (`Ajustar popup inicial e aliviar exercito do rodape`).
- As artes novas da `PubPaid` em `assets/pubpaid-exterior-v2.png` e `assets/pubpaid-interior-v2.png` nasceram de image generation local e ainda estao so no workspace.
- Em 2026-04-23, a logica da `PubPaid 2.0` foi corrigida para `Intro -> Rua -> Porta -> Salao -> Garcom -> Lobby -> Oponente IA -> Aposta -> Confirma -> Tela propria do jogo`; `pubpaid-phaser/scenes/GameLobbyScene.js` concentra lobby/confirmacao/tela separada.
- A primeira passada visual nova da `PubPaid 2.0` adicionou fundos bitmap pixel art/2D em `assets/pubpaid/lobby/pubpaid-lobby-bg-v1.png`, `assets/pubpaid/lobby/pubpaid-darts-room-v1.png` e `assets/pubpaid/lobby/pubpaid-checkers-room-v1.png`, carregados por `BootScene.js` e usados por `GameLobbyScene.js`.
- Ainda em 2026-04-23, `pubpaid-phaser/scenes/DartsGameScene.js` e `pubpaid-phaser/scenes/CheckersGameScene.js` foram criadas como cenas jogaveis separadas: Dardos tem mira/alvo/IA/3 rodadas/resultado; Dama tem tabuleiro grande, selecao de peca, capturas simples, IA local e resultado.
- Correcao do salao em 2026-04-23: removidas as zonas antigas west/east de jogos dentro do bar. O garcom pequeno no centro do salao abre o lobby/catalogo; `GameLobbyScene.js` agora mostra Dardos e Dama como opcoes clicaveis antes de aposta/oponente.
- Regra nova visual em 2026-04-23: personagem deve virar sprite PNG, nao desenho procedural/canvas. O garcom ja foi convertido: `assets/pubpaid/characters/waiter-salon-small-v1.png` no salao e `assets/pubpaid/characters/waiter-lobby-large-v1.png` no lobby, carregados por `BootScene.js`.
- Lobby PubPaid atualizado em 2026-04-23: novo fundo `assets/pubpaid/lobby/pubpaid-lobby-bg-v2-crowd.png` com publico pixel art, e o garcom grande alterna com `assets/pubpaid/characters/waiter-lobby-speaking-v1.png` para parecer que fala antes da escolha de Damas/Dardos.
- Cantora adicionada ao lobby em 2026-04-23: `assets/pubpaid/characters/singer-lobby-v1.png`, carregada como sprite PNG e posicionada no canto lateral com brilho/idle leve.
- PubPaid 2.0 recebeu em 2026-04-23 a primeira interface DOM de jogo em `pubpaid-phaser/ui/domGameInterface.js`: HUD compacto, lobby, painel de Dardos, Dama em tabuleiro DOM e modal de resultado. `pubpaid-v2.html`, `pubpaid-phaser.css`, `app.js`, `DartsGameScene.js` e `GameLobbyScene.js` foram conectados a essa camada.
- Dardos agora aceita o evento DOM `pubpaid:darts-dom-throw` e emite `pubpaid:darts-result`; Dama tem loop local em DOM com seleção, casas válidas, captura obrigatória, IA simples e resultado. Pendente: validação visual em servidor local e ajuste fino dos botões antigos em canvas.
- Pedido visual do usuario aplicado: depois da intro, o frame final nao abre mais card/overlay de termos automaticamente. `IntroScene.js` congela no frame final e so entra no jogo quando o usuario clica na imagem ou aperta Enter; `app.js` escuta `pubpaid:intro-enter` e chama `startGame()`.
- PubPaid 2.0 parte 1 do prompt premium iniciada: lobby limpo. `GameLobbyScene.js` deixou de desenhar cards/botoes gigantes no canvas e passou a servir como fundo vivo do bar com garcom; `domGameInterface.js` controla o estado visual do lobby; `pubpaid-phaser.css` esconde HUD/prompt/painel antigos no lobby/minigames e reposiciona Dama/Dardos como placas DOM centrais embaixo.
- PubPaid 2.0 parte 2 iniciada: rua viva em `StreetScene.js`. Foram adicionados pedestres em loop, cachorro discreto de rua, carros/motos em passagem, farois/reflexos no asfalto e som procedural leve de motor via WebAudio. Cache do app atualizado para `20260423streetlife1`.
- Intro cinematica refeita em `IntroScene.js`: agora usa cortes com `street-bg`, frames de porta, `interior-bg` e `game-lobby-bg`, letterbox, farois passando, brilho de porta, placa final `ENTER GAME` e entrada direta por clique/Enter. Cache atualizado para `20260423cinematicintro1`.
- Correcao de escala humana aplicada em `spriteFactory.js` e `StreetScene.js`: criada `PUBPAID_WORLD_SCALE`, sprites procedurais de humanos passaram de 48x56 para 64x116 com silhueta adulta, e rua ajustou player/pedestres para escala de adulto em vez de miniatura/chibi. Cache atualizado para `20260423adultscale1`.
- Pedido do usuario para parar com sprites codificados executado na rua: `BootScene.js` agora carrega PNGs bitmap reais para player/pedestres/veiculos/animal; `spriteFactory.js` nao sobrescreve mais textura PNG carregada; `StreetScene.js` usa bitmaps estaticos para pedestres e player; criados `assets/pubpaid/vehicles/pubpaid-car-side-v1.png`, `assets/pubpaid/vehicles/pubpaid-motorbike-side-v1.png` e `assets/pubpaid/animals/pubpaid-street-dog-v1.png`; fontes registradas em `assets/pubpaid/PUBPAID_ASSET_SOURCES.md`. Cache atualizado para `20260424bitmapsprites1`.
- Correcao visual seguinte do PubPaid 2.0: os sprites/personagens/veiculos/animal improvisados foram retirados do runtime porque nao combinavam com os fundos e quebravam escala. `StreetScene.js` desligou `buildStreetLife()` ate existir pacote bitmap aprovado; `InteriorScene.js` removeu convidados/cantora/player PNG gigantes do salao; `PUBPAID_VISUAL_SCALE_GUIDE.md` travou as proporcoes adultas e `assets/pubpaid/PUBPAID_ASSET_SOURCES.md` agora separa aprovados, provisórios e rejeitados. Cache atualizado para `20260424visualcleanup1`.
- Retomada da ideia PubPaid 2.0 apos sumir o projeto/thread: criados recortes justos em `assets/pubpaid/sprites/adult-standing-tight-v1.png`, `guest-seated-tight-v1.png` e `singer-stage-tight-v1.png`; `BootScene.js` passou a carregar esses derivados, `StreetScene.js` religou vida leve apenas com pedestres bitmap em escala adulta e `InteriorScene.js` voltou a usar player/cantora/clientes como PNGs recortados e controlados. Veiculos/cachorro rejeitados continuam fora do runtime. Cache atualizado para `20260424tightsprites1`.
- Globalizacao da retomada PubPaid 2.0: criado `PUBPAID_2_GLOBAL_HANDOFF.md` como ponto oficial para qualquer conta/agente continuar mesmo se o projeto/thread sumir da lista. `AGENTS.md`, `PUBPAID_2_PACKAGE_README.md` e `.codex-memory/README.md` agora apontam para esse arquivo antes de qualquer edicao na frente PubPaid.
- PubPaid 2.0 ganhou variações e movimento de personagens: gerados `adult-standing-burgundy-tight-v1.png`, `adult-standing-teal-tight-v1.png`, `adult-standing-gold-tight-v1.png` e `guest-seated-blue-tight-v1.png`; `BootScene.js` carrega as novas texturas, `StreetScene.js` distribui pedestres diferentes com ciclo de passo e `InteriorScene.js` anima player/clientes/cantora com idle/movimento. Cache atualizado para `20260424walkchars1`.
- Reuniao de direcao PubPaid 2.0 registrada em `PUBPAID_2_REUNIAO_DIRECAO_2026-04-24.md`: decisao foi parar remendos, separar jogo de agentes, priorizar porta real sem hotspot visivel, rever intro antiga, criar personagens com silhuetas diferentes e rua viva antes de novos sistemas.
- PubPaid 2.0 recebeu passada integrada `20260424fullpass1`: `IntroScene.js` voltou a usar a sequencia antiga de 16 frames como base emocional; `StreetScene.js` moveu a porta para a coordenada real da fachada, removeu quadros/Google Port/texto tecnico, adicionou tráfego luminoso, pedestres mais próximos da fachada, cantora/porteiro na rua e clique direto na porta para entrar.
- PubPaid 2.0 recebeu pacote de sprites melhores `20260424bettersprites1`: derivados PNG com silhuetas diferentes em `assets/pubpaid/sprites/bouncer-wide-tight-v1.png`, `woman-red-stage-tight-v1.png` e `guest-jacket-short-tight-v1.png`; `BootScene.js`, `StreetScene.js` e `InteriorScene.js` agora usam segurança largo, mulher em vermelho e cliente baixo/casaco para quebrar a sensação de clones.
- PubPaid 2.0 reboot da entrada em 2026-04-24: corrigido o 404 de `pubpaid-phaser/config/sceneMap.js` que impedia o app Phaser de iniciar; `sceneMap.js` foi recriado com mapa semântico de rua/salão, walkable bounds, porta, ponto de ônibus e colisões. `BootScene.js` agora inicia `intro-scene` direto; `pubpaid-v2.html` começa com topbar/gate DOM antigo escondidos e sem link visível para agentes; `IntroScene.js` removeu dependência de `nerdTeam` e ganhou menu final integrado à arte com `ENTRAR NO JOGO` e `SAIR DO JOGO`; `app.js` trata `pubpaid:intro-exit`. Validação Playwright: `output/web-game/pubpaid-intro-reboot-check-3/shot-0.png`, `output/web-game/pubpaid-intro-menu-check/shot-0.png` e `output/web-game/pubpaid-intro-enter-check/shot-0.png`.
- Correção editorial/fotos em 2026-04-24: o importador de notícias deixou de considerar SVG automático em `assets/news-fallbacks/` como foto real definitiva, passou a decodificar entidades numéricas do RSS como `&#038;` e a preferir `og:image`/imagem da fonte quando existir. Foram reparadas 9 matérias do Batelão em `data/runtime-news.json` e `news-data.js`, incluindo a matéria `cemaf-aprova-por-unanimidade-metas-estaduais-do-progestao-e-reforca-gerenciamento-dos-recursos-hidricos-no-acre` com `https://batelao.com/upload/2026/04/021-5.jpeg` e 6 matérias da Mailza com fotos reais e não repetidas. Validações: `node --check server.js`, `node --check noticia.js`, `node --check script.js`, API local da matéria do Cemaf devolvendo a foto do Batelão e HEAD da imagem retornando `200`.
- PubPaid 2.0 limpeza da intro/menu em 2026-04-24: equipe local `npm run review:team` retornou 0 issues em 136 arquivos e agentes especificos diagnosticaram o vazamento `ENTER GAME`. `IntroScene.js` removeu o bitmap antigo `intro-frame-16`, apagou caption/progresso tecnico no menu final e trocou o painel central por ficha/placa diegetica `ENTRAR NO JOGO` com placa lateral `SAIR DO JOGO`; `pubpaid-v2.html` e `app.js` neutralizaram fallback DOM em ingles; `pubpaid-phaser.css` rebaixou o botao de som na intro. Validacao Playwright: `hasEnterGame=false`, Enter levou para `street-scene, ui-scene`; capturas em `output/web-game/pubpaid-intro-fix-20260424-v3/`.
- Correcao imediata do feedback do usuario em 2026-04-24: `pubpaid-v2.html` deixou de ter cabecalho explicativo, notas e rodape; a pagina oficial agora abre somente o jogo/canvas. `pubpaid-phaser.css` ajustou shell/stage/canvas official para ocupar a tela toda sem a casca editorial. Validacao Playwright em `output/web-game/pubpaid-gameonly-check-20260424/initial.png` com `hasExplainer=false`. Imagens/exemplos criados em 2026-04-23 foram reunidos em `.codex-temp/pubpaid-assets-ontem/index.html`.
- Prioridade editorial Mailza em 2026-04-24: ordem geral registrada para Codex CEO/agentes reais e prompt salvo em `PROMPT_MAILZA_PRIORIDADE_2026-04-24.md`. `server.js`, `script.js`, `scripts/re-rodada-dia-geral.js`, `scripts/agents-autonomy-cycle.js` e `scripts/real-agents-runtime.js` agora tratam Mailza/Mailsa/Mailza Assis Cameli/governadora Mailza como prioridade permanente, categoria Politica Regional, eyebrow `governadora mailza`, prioridade 950 e `editorialPriority: mailza-prioridade`.
- Rodada diaria online/offline corrigida em 2026-04-24: `scripts/re-rodada-dia-geral.js` passou a tentar Render online primeiro e usar cache apenas como fallback declarado, preservando focos manuais de imagem. Ultima execucao puxou 120 noticias sem fallback, promoveu 8 itens da Mailza e deixou `news-data.js` com Mailza no indice 0.
- Review geral de 2026-04-24: `npm run review:team` retornou `totalIssues: 0`; `npm run audit:news-images -- --offline --limit=80 --strict-new` retornou `total=80 ok=80 review=0`; `npm run agents:cycle` retornou `ok: true` com 181 agentes, 5 escritorios e review integrada sem EPERM.
- Trava editorial nova em 2026-04-25: criado `PROMPT_TRAVA_EDITORIAL_MATERIA_TRUNCADA_2026-04-25.md` e reforcados `scripts/real-agents-runtime.js`, `scripts/generate-181-agent-prompts.js` e `scripts/agents-autonomy-cycle.js` para impedir materia que termine no meio da frase, com conectivo/preposicao solta ou sem fechamento logico. A materia `mailza-define-linha-de-frente-da-sua-campanha-ao-governo` foi sincronizada; `lede`/`summary` foram cortados na ultima frase completa e o `body` recebeu fechamento editorial honesto com fonte/cautela.
- Lifestile Fashion 24h implantado em 2026-04-25 via worktree limpo `C:\Users\junio\projeto-codex-lifestile-deploy`, pois o worktree principal estava em rebase conflitado. Commit `657a82f` (`Adicionar Lifestile fashion 24h`) foi enviado para `origin/main` e confirmado como ancestral do `origin/main` atual. Producao `https://catalogo-cruzeiro-web.onrender.com/lifestile.html` respondeu 200, carregando `lifestile.html`, `lifestile.css` e `lifestile.js`, com HTML sem vazamento de termos bloqueados de politica/noticia dura.
- Lifestile acesso subordinado implantado em 2026-04-25: commit `ba46268` (`Destacar acesso subordinado ao Lifestile`) adicionou botao `Lifestile 24h` na barra principal, na faixa `Editoriais`, no Esttiles e um link de volta `Esttiles` dentro da pagina Lifestile. Push feito para `origin/main`; Render ainda podia estar propagando logo apos o push.
- Sincronizacao online-local em 2026-04-25: regra corrigida para home/cards/chamadas usarem resumo curto e pagina de leitura manter corpo completo. `npm run sync:online-local` passou com 120 noticias, 0 achados da equipe, 120 imagens ok/0 review e 6 itens Mailza/Mailsa priorizados.
- Reserva PubPaid em 2026-04-25: por ordem do usuario, qualquer ajuste local da PubPaid deve ficar fora de commit/deploy ate nova autorizacao explicita.
- Trava de idioma publico criada em 2026-04-27: corrigidos vazamentos de texto em ingles em `news-data.js`, `data/news-archive.json`, `data/runtime-news.json` e `data/topic-feed-tech.json`; `scripts/review-team-audit.js` ganhou `language-review`; `AGENTS.md` e `.codex-review-team/README.md` avisam que titulos, chamadas, ledes, resumos, destaques e corpo publico de noticia devem sair em portugues. Validado com `node --check scripts/review-team-audit.js` e `node scripts/review-team-audit.js` (totalIssues=0). Commit `26a4dc9` foi mergeado no PR #5 em `origin/main` (`8117d4d`).
- Rodada de segunda em 2026-04-27: `npm run sync:online-local` passou com 360 noticias no acervo/janela ativa, 0 imagens ausentes, 0 duplicatas locais por divisao, `sanitize public language` integrado e `review:team` totalIssues=0; `npm run audit:news-images -- --offline --limit=1000 --strict-new` retornou 360/360 ok; `npm run agents:cycle` rodou 181 agentes/5 escritorios com 360 noticias. Novo `scripts/sanitize-public-language.js` fica chamado por `scripts/sync-online-local.js` para sanear idioma publico antes do review. PubPaid seguiu fora do pacote sem autorizacao explicita. Commit `e325d52` foi mergeado no PR #7 em `origin/main` (`cf33a01`).
- Nova fase PubPaid em 2026-04-27: criado `PROMPT_PUBPAID_INSTRUTOR_TESTES_2026-04-27.md` para iniciar novas conversas/rodadas como instrutor de testes, auditor de ruido, condutor de reuniao e organizador de objetivos antes de criar novas funcionalidades. O prompt fixa `pubpaid-v2.html` + `pubpaid-phaser/` como frente oficial, preserva a trava de deploy PubPaid sem autorizacao explicita e exige fila P0/P1/P2 com evidencias.
- Mosaico regional da home em 2026-04-28: apos feedback do usuario de que a primeira versao ficou feia, `Edição visual` foi refeita como Capa Especial do Jurua em `premium-clarity.css`, com capa principal fotografica, cards laterais claros e mobile em miniatura + manchete. `script.js` agora separa escopo editorial e fonte, prioriza Juruá/Cruzeiro do Sul/Vale do Juruá e so completa com Acre geral/governo quando faltar, evitando puxar noticia nacional so por fonte local. Tambem foram corrigidos guards de artigo nulo na hidratacao de imagens/social cards. Validacoes: `node --check script.js`, `node --check news-data.js`, parse de `data/topic-feed-kids.json`, CSS braces 308/308, `npm run review:team` totalIssues=0 e Playwright com 12 itens, 0 imagens faltando e errors=[]; capturas finais em `output/playwright/mosaico-jurua-capa-especial-desktop-20260428-v4.png` e `output/playwright/mosaico-jurua-capa-especial-mobile-20260428-v4.png`.
- Refinamento do mosaico regional em 2026-04-28: a pedido do usuario, a Capa Especial passou de 12 para 13 destaques, o texto de apoio virou "Treze destaques" e a area de foto dos cards foi aumentada (`premium-clarity.css`) para melhorar enquadramento. `script.js` foi reforçado para bloquear assuntos nacionais/remotos sem sinal explicito de Acre/Juruá; validação final Playwright retornou `count=13`, `missingImages=0`, `errors=[]`, e a lista dos 13 titulos ficou regional. Capturas: `output/playwright/mosaico-jurua-capa-especial-desktop-20260428-v6.png` e `output/playwright/mosaico-jurua-capa-especial-mobile-20260428-v6.png`.
- Aviso de transparencia na home em 2026-04-28: rodape recebeu `footer-automation-notice` explicando que a pagina inicial usa rotinas automaticas e pode ter falhas de programacao/layout/ordenacao, sem alterar o compromisso editorial com a noticia. Cache CSS atualizado para `mosaico-capa5`. Validacoes: CSS braces 312/312, `node --check script.js`, `npm run review:team` totalIssues=0 e captura `output/playwright/home-footer-aviso-automatico-20260428.png`.
- PubPaid 2.0 trafego V2 em 2026-04-28: por feedback do usuario, sprites antigos de carros/motos foram refeitos em pacote separado para avaliacao antes de integrar. Gerados `assets/pubpaid/traffic/pubpaid-traffic-vehicles-5f-v2.png`, `assets/pubpaid/traffic/pubpaid-traffic-vehicles-5f-v2.json`, `assets/pubpaid/traffic/pubpaid-traffic-vehicles-5f-v2-preview.png`, sheets individuais em `assets/pubpaid/traffic/vehicles-v2/` e demo `pubpaid-traffic-sprites-demo.html`; cada veiculo tem 5 frames, rodas animadas dentro do proprio bitmap, motos com piloto integrado e margem transparente validada `minMargin >= 9px`. Demo local validada em `http://127.0.0.1:3000/pubpaid-traffic-sprites-demo.html` com 10 cards/10 veiculos e sem erros de console. Ainda nao integrar/deployar PubPaid sem aprovacao explicita.

