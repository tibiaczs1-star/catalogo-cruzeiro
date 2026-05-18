# Estudo Inicial da Equipe de Jogos

Data: 2026-05-18

## Pixel art 2D e game art

- Silhueta vem antes de detalhe. Um sprite precisa ser lido em tamanho real de
  jogo antes de ser considerado bonito.
- Paleta curta, clusters limpos e contraste funcional produzem leitura melhor
  que textura excessiva.
- Anti-aliasing manual deve ser usado com cuidado, principalmente nas bordas.
- Dithering e textura sao recursos, nao preenchimento automatico.
- Spritesheets precisam de grade fixa, mesmo pivo, mesma celula e nomes
  previsiveis.
- Personagens de 4 direcoes precisam preservar cabeca, roupa, proporcao, pes,
  paleta e personalidade entre `south`, `west`, `east`, `north`.
- Walk cycle pequeno pode comecar com 4 frames por direcao.
- Export de producao: PNG lossless, sem blur, nearest-neighbor, manifest/JSON
  quando util, validacao dentro do runtime.

## Direcao de arte e concept art

- Direcao de arte e sistema, nao colecao de imagens bonitas.
- Moodboard deve ser separado por funcao: personagem, ambiente, UI, cor, luz,
  material, referencias permitidas e referencias proibidas.
- Shape language ajuda a separar papel visual: confiavel, perigoso, neutro,
  premium, barato, rapido, pesado.
- Style bible curta deve guardar exemplos aprovados, rejeitados e criterios.
- Revisao de asset deve olhar silhueta, escala, contraste, paleta, animacao,
  grid, aderencia ao anchor e resultado no jogo.

## UI, HUD e interface

- HUD e instrumento de jogo, nao decoracao.
- Mostrar durante a partida apenas informacao que muda decisao imediata.
- Feedback critico deve ter mais de um canal: visual, som, texto curto ou icone.
- Estados de botao precisam ser explicitos: ativo, desabilitado, selecionado,
  cooldown, pressionado.
- Mobile landscape precisa pensar em polegares, alvos grandes, texto curto e
  controles nas bordas inferiores.
- Acessibilidade minima: contraste, tamanho legivel, alternativa a cor sozinha,
  reduzir vibracao/animacao quando necessario.

## Teste e seguranca gamer

- Multiplayer e economia exigem servidor autoritativo.
- Cliente envia intencao/input; servidor valida estado, resultado e saldo.
- QA de jogo precisa cobrir regressao, controles, fluxo principal, travas,
  estados de partida, reconexao, W.O., wallet e mobile real quando aplicavel.
- Logs de eventos importantes ajudam a detectar abuso e reproduzir bug.
- Seguranca gamer nao e so hacking: tambem e evitar exploit economico, resultado
  manipulado, estado impossivel e cliente confiavel demais.

## Camadas de um jogo

- Camada de produto: fantasia, promessa do jogo, publico, regra de diversao e
  criterio de pronto.
- Camada de design: regras, loop principal, modos, dificuldade, economia,
  progresso, recompensas e ritmo.
- Camada de direcao: decide o que entra, o que nao entra, prioridade, escopo e
  tradeoffs entre arte, jogabilidade, seguranca e prazo.
- Camada de runtime: engine, cenas, objetos, input, camera, animacoes, audio,
  fisica e render.
- Camada de UI/HUD: menus, lobby, pausa, feedback, controles, estados, tutoriais
  e acessibilidade.
- Camada de arte: concept, style bible, sprites, tiles, props, VFX, animacao,
  paleta, export e integracao.
- Camada de dados: configuracoes, manifestos, tabelas de balanceamento, assets,
  saves, partidas e telemetria.
- Camada de backend: autenticacao, sessoes, PvP, matchmaking, validacao,
  carteira, logs e antifraude.
- Camada de QA: testes locais, regressao, mobile, runtime real, console, fluxo
  feliz, fluxo quebrado e abusos.
- Camada de entrega: build, deploy, smoke online, rollback e handoff.

## Layers visuais e de cena

- Separar fundo, mundo jogavel, personagens, efeitos, HUD e overlays evita que a
  arte brigue com controles.
- Em Phaser, Scenes podem separar telas logicas como loading, menu, jogo,
  overlay de UI e loja. Uma cena dedicada a UI pode renderizar acima da cena do
  jogo.
- Display list/depth controla ordem de render e prioridade de input. Isso deve
  virar regra: HUD e botoes ficam acima, feedback transitorio acima do jogo,
  overlays bloqueantes acima de tudo.
- Sprites animados devem usar grade/frame consistente. O Animation Manager guarda
  animacoes e Sprites mantem estado de playback.
- Input precisa de hit areas claras. Em mobile, area tocavel deve ser maior que
  o desenho quando necessario.

## Padroes de programacao para jogos

- Game loop: ciclo que atualiza input, estado, fisica, animacao e render. No web,
  engines abstraem isso, mas a mentalidade continua: cada frame precisa ser
  previsivel.
- Update method: objetos ativos recebem atualizacao por frame; bom para entidades
  pequenas, perigoso quando tudo vira logica espalhada.
- State pattern/state machine: essencial para menus, modos de partida, turnos,
  animacoes e acoes em etapas. Ex.: `aim -> locked -> power -> rolling`.
- Component pattern: separar comportamento em partes menores, como input, vida,
  render, fisica, wallet, status, animacao. Evita herancas gigantes.
- Object pool: reutilizar objetos frequentes, como particulas, tiros, efeitos,
  popups e marcadores, para evitar custo de criar/destruir em massa.
- Event queue/pub-sub: bom para feedback, som, conquistas, logs e UI reagindo ao
  jogo sem acoplamento direto demais.
- Command/input intent: cliente registra intencao do jogador; servidor ou motor
  decide resultado. Critico para PvP e economia.
- Data-driven config: regras de jogo, custos, textos, frame names, velocidade e
  balanceamento devem morar em dados quando mudam muito.
- Adapter/bridge UI: separar DOM/HUD de runtime Phaser para que interface possa
  mudar sem quebrar fisica, cena ou backend.

## Tipos de programador de jogos

- Gameplay programmer: regras, loop de partida, controles, entidades, modos e
  interacao.
- Engine/runtime programmer: performance, render, cenas, lifecycle, memoria,
  cameras, input e infraestrutura da engine.
- UI programmer: menus, HUD, estados visuais, responsividade, acessibilidade e
  ponte entre DOM/canvas/engine.
- Tools programmer: scripts de export, validadores, conversores de spritesheet,
  editores internos e automacao de pipeline.
- Backend/network programmer: matchmaking, sessoes, PvP, autoridade do servidor,
  carteira, reconexao, logs e APIs.
- Physics programmer: colisao, movimento, previsao, resposta fisica e
  determinismo quando necessario.
- AI/game systems programmer: bots, maquina de estados, dificuldade, tomada de
  decisao e simulacao.
- Build/release programmer: empacotamento, deploy, smoke, versao, rollback e
  reproducibilidade.
- Technical artist/technical designer: ponte entre arte/design e programacao;
  cria pipeline, shaders, export, rig, ferramentas e regras tecnicas de asset.

## Tipos de desenhista/artista de jogos

- Art director: guarda coesao visual e aprova estilo.
- Concept artist: explora personagem, mundo, objetos, mood, shape language e
  composicao antes da producao.
- Character artist: cria personagens finais, proporcao, roupa, rosto,
  personalidade e variacoes.
- Pixel artist: desenha em grade nativa, cuida de clusters, paleta, leitura e
  spritesheets.
- Animator: transforma poses em movimento, timing, smear, walk cycles, impacto e
  leitura.
- Environment artist: cenarios, tiles, props, fundos, parallax, mapas e
  ambientacao.
- UI artist/UX artist: botoes, menus, icones, HUD, legibilidade e fluxo visual.
- VFX artist: feedback visual de acao, impacto, brilho, particulas, transicoes e
  clareza de eventos.
- Production artist/finalizer: limpa, padroniza, exporta e prepara assets para
  entrar no jogo.
- Technical artist: garante que a arte funcione na engine, sem blur, sem peso
  excessivo, com nomes, pivots, atlas e formatos corretos.

## Fluxo de desenho para jogos

1. Brief do Diretor do Jogo: funcao do asset, tela onde aparece, tamanho real,
   restricoes e criterio de aprovado.
2. Referencias separadas: inspiracao permitida, exemplos proibidos, anchor local
   aprovado e moodboard por funcao.
3. Thumbnail/silhueta: validar leitura antes de detalhe.
4. Concept limpo: forma, roupa/material, paleta inicial, personalidade e escala.
5. Teste em tamanho real: ver em 1x/2x/3x e dentro do fundo do jogo.
6. Sprite/pixel base: grade nativa, clusters, contorno, paleta curta e pe
   ancorado.
7. Direcoes/poses: frente, costas, lados, idle, walk ou acao necessaria.
8. Animacao: timing, frame count, arco de movimento, impacto e loop limpo.
9. Export tecnico: spritesheet/atlas, nomes, pivo, celula fixa, transparencia,
   manifest e sem interpolacao.
10. Integracao: importar no runtime, criar animacoes/estados e testar input,
    camera, HUD e performance.
11. Revisao de linha final: arte, jogo e interface juntos.

## Direcao de jogos

- O Diretor do Jogo nao e apenas chefe de arte. Ele protege a promessa jogavel:
  o que o jogador faz, por que importa, como entende, como ganha/perde e como o
  jogo se mantem justo.
- Direcao decide tradeoffs: mais detalhe ou mais leitura, mais regra ou mais
  fluidez, mais seguranca ou menos latencia, mais escopo ou mais polimento.
- Uma boa direcao transforma gosto em criterio: "legivel em 1 segundo", "sem
  depender de cor", "servidor decide saldo", "arte aprovada entra so depois de
  runtime".
- O diretor deve manter documentos vivos: style bible, matriz de decisao,
  criterios de pronto, backlog, riscos e lista de assets aprovados/rejeitados.

## Sub-subagentes necessarios por camada

- Direcao: produtor de escopo, designer de sistemas, guardiao de canon, redator
  de criterios de pronto.
- Arte: concept, pixel fundamentals, paleta, sprite anatomy, animacao, tiles,
  VFX, style bible, finalizacao/export.
- Interface: UX flow, HUD readability, controles mobile, acessibilidade,
  implementador UI, iconografia.
- Programacao: gameplay, UI programmer, backend/PvP, tools/pipeline, fisica,
  engine/runtime, build/release.
- Teste: gameplay QA, mobile QA, regressao, PvP/economia, abuse/security,
  linha final.
- Nerd support: engine, fisica, audio, economia, render, performance e automacao
  alimentam a equipe de jogos quando chamados.

## Rodada complementar de estudo

### Arquitetura web/Phaser

- Em jogo web, o browser ja tem um event loop. A engine usa esse ciclo, muitas
  vezes via `requestAnimationFrame`, para chamar codigo de jogo sem bloquear a
  interface. Isso reforca a regra: nunca fazer trabalho pesado sincronamente no
  frame critico.
- Em Phaser, `Scene` e a unidade principal de organizacao. Ela tem lifecycle
  claro: `init`, `preload`, `create`, `update`. Para PubPaid, isso significa que
  carregamento, criacao de arena e atualizacao por frame devem ficar separados.
- Cada Scene tem Display List, Update List, Camera, Input, Loader, Clock e Tween
  Manager. A direcao tecnica deve mapear qual camada pertence a qual Scene:
  Boot/Loading, Lobby, GameScene, UI overlay, resultados.
- Game Objects nao processam input por padrao. O programador deve habilitar input
  apenas no que e interativo. Isso reduz conflito entre HUD, tabuleiro, mesa e
  overlays.
- `depth` resolve ordem visual, mas nao deve virar gambiarra infinita. O correto
  e estabelecer bandas: background 0-99, mundo 100-499, efeitos 500-699, HUD
  700-899, modal/overlay 900+.
- Animacoes devem ser globais quando varios objetos compartilham frames e locais
  quando pertencem a um objeto especifico. Sprites pequenos do PubPaid devem
  priorizar nomes previsiveis e frame ranges simples.

### Autoridade e seguranca de jogo

- O principio mais importante para multiplayer/economia e servidor autoritativo:
  cliente captura input e renderiza, servidor decide estado, resultado e saldo.
- Nem tudo precisa ter validacao sincrona pesada. A regra e graduar autoridade:
  carteira, aposta, resultado, W.O. e matchmaking exigem autoridade forte;
  animacao visual e previsao local podem ser client-side.
- Defesa em camadas: validacao servidor, logs, defaults seguros, limitacao de
  debug em producao, sanitizacao de input e telemetria minima para investigar
  abuso.
- Para PubPaid, anti-cheat nao deve comecar por solucao invasiva. O primeiro
  nivel e: servidor autoritativo, input intent, validacao de estado, logs de
  partida, rate limit e deteccao de estado impossivel.

### Padrões que viram regra de implementacao

- State machine e obrigatoria para acoes em etapas. Ex.: Sinuca nao deve depender
  de flags soltas; deve passar por estados claros como mirar, travar, forca,
  tacada, rolando, resultado.
- Event queue/observer deve ser usado para feedback lateral: som, popup, log,
  vibracao, conquistas e HUD podem reagir ao evento de jogo sem reescrever a
  regra principal.
- Object pool e util para efeitos visuais, particulas, marcadores, popups e sons
  repetidos. Em JavaScript ainda ha GC, mas reduzir cria/destrói no gameplay
  ajuda estabilidade.
- Componentizacao deve separar entrada, render, regra, audio, feedback e
  integracao backend. Se uma classe sabe demais, o Diretor deve chamar isso de
  risco.
- Config data-driven e preferivel para balanceamento, textos, velocidades,
  custos, premios, frame names e parametros de HUD.

### Papéis e fronteiras de equipe

- Gameplay programmer decide como a regra vira interacao.
- UI programmer decide como a interacao vira tela responsiva.
- Backend/PvP programmer decide como a partida vira estado autoritativo.
- Tools programmer decide como asset vira runtime sem trabalho manual repetido.
- Technical artist garante que arte entra certa na engine: escala, pivot, atlas,
  manifest, nome, compressao e nearest-neighbor.
- Art director decide coesao; concept artist explora; pixel artist executa na
  grade; animator da vida; UI artist faz leitura; VFX artist cria feedback.
- Linha Final nao e designer nem produtor: e auditor integrado. Ela bloqueia
  entrega quando jogo, HUD, arte e seguranca nao combinam.

### Checklist de aprendizagem aplicado ao PubPaid

- Todo jogo novo precisa de `modo`, `estado`, `input`, `feedback`, `validacao`,
  `HUD`, `erro`, `resultado` e `handoff`.
- Toda arte nova precisa de `funcao`, `anchor`, `tamanho real`, `direcoes`,
  `animacao`, `export`, `manifest` e `teste no runtime`.
- Toda UI nova precisa de `estado normal`, `hover/focus quando aplicavel`,
  `pressionado`, `desabilitado`, `erro`, `loading`, `mobile landscape` e
  alternativa quando cor nao bastar.
- Todo PvP precisa de `duas sessoes`, `ready`, `jogada`, `settlement`,
  `desconexao`, `W.O.`, `logs` e tentativa de estado impossivel.

## Rodada literal de 30 minutos: producao e sistemas completos

Inicio local: 2026-05-18 13:42:18 -05:00
Fim minimo cumprido: 2026-05-18 14:12:18 -05:00

### Producao real de jogos

- Vertical slice e o primeiro alvo forte: uma fatia pequena, completa e jogavel
  que prova arte, regra, UI, audio, feedback, performance e entrega.
- Milestones devem ter criterio de pronto, nao apenas lista de tarefas. Ex.:
  prototipo prova mecanica; vertical slice prova experiencia; alpha tem sistemas
  principais; beta foca estabilidade; polish melhora sensacao; release exige
  smoke, rollback e suporte.
- Backlog de jogo precisa separar: feature, bug, polish, asset, risco tecnico,
  QA, seguranca, economia, documentacao e deploy.
- O Diretor do Jogo deve evitar pacote grande invisivel. Para PubPaid, cada mesa
  nova deve passar por mini vertical slice: lobby, demo, PvP se existir, HUD,
  erro, resultado e logs.

### GDD, TDD e documentacao

- GDD deve responder o que o jogador faz, por que e divertido, quais modos
  existem, qual o loop, como ganha/perde, quais controles, quais telas, qual
  arte/audio e quais restricoes.
- TDD documenta como o jogo funciona por baixo: cenas, estados, APIs, dados,
  manifestos, wallet, eventos, erros, persistencia e testes.
- Art bible/style bible documenta paleta, escala, anchors, exemplos aprovados,
  rejeitados, grid, export e criterios de revisao.
- Test plan documenta matriz de plataformas, fluxos felizes, fluxos quebrados,
  regressao, mobile, rede ruim, abuso e severidade.

### Level design, mapas e ritmo

- Level design nao e so mapa. E fluxo de atencao, risco, recompensa, leitura,
  dificuldade, tutorial e ritmo.
- Blockout/greybox vem antes da arte final. Serve para testar tamanho, caminho,
  colisao, camera, ritmo e objetivos sem gastar tempo com acabamento.
- Mapa bom guia sem explicar demais: contraste, luz, composicao, landmarks,
  linhas de movimento, tamanho de corredor, obstaculos e recompensa visual.
- Para PubPaid, "mapa" tambem pode ser lobby, arena da sinuca, mesa de cartas,
  tabuleiro, layout de botoes e fluxo de entrada/saida de partida.

### Game feel

- Game feel nasce de input responsivo, feedback imediato, animacao curta, som,
  camera, tween, hit pause, microdelay intencional, squash/stretch, particulas e
  clareza de resultado.
- A regra pode estar certa e ainda parecer ruim se o feedback for fraco.
- Controle precisa ter latencia percebida baixa. Botao que faz algo importante
  deve mostrar resposta visual imediatamente, mesmo que o servidor valide depois.
- Para PubPaid, game feel precisa respeitar seguranca: previsao local e feedback
  visual podem ser imediatos; saldo, payout e resultado final devem esperar o
  servidor.

### Audio design

- Audio e canal de feedback, nao so trilha.
- Sons de UI devem diferenciar: hover/focus, confirmar, negar, erro, premio,
  alerta, turno, bloqueio, contagem, vitoria e derrota.
- Sons repetidos cansam; precisa variar volume, pitch ou limitar frequencia.
- Jogo deve funcionar sem som. Feedback sonoro nunca pode ser a unica pista.
- Para acessibilidade, manter mute, volume por categoria e alternativa visual.

### Balanceamento e economia

- Balanceamento envolve dificuldade, chance, tempo de partida, recompensa,
  frequencia de vitoria, custo, payout, risco, expectativa e percepcao de justica.
- Quando existe dinheiro, o criterio precisa ser mais rigoroso: transparencia,
  logs, limites, odds/resultado auditavel, sem inducao enganosa e sem depender de
  estado client-side.
- Toda mudanca de economia deve ter: regra, justificativa, exemplo numerico,
  teste, log e rollback.
- Para PubPaid, "divertido" nao pode atropelar "justo e verificavel".

### Multiplayer, rede e estado

- Multiplayer deve separar input local, estado autoritativo, sincronizacao,
  reconexao, abandono, W.O. e settlement.
- Jogos por turno podem ser mais simples: servidor valida lance e publica estado.
  Jogos em tempo real exigem mais cuidado com latencia, previsao, reconciliacao e
  anti-cheat.
- Cliente pode otimizar sensacao, mas nao deve decidir vencedor, saldo ou estado
  final.
- Logs de partida precisam permitir reconstruir o que aconteceu.

### Telemetria e metricas

- Telemetria boa registra eventos acionaveis, nao ruido.
- Eventos minimos: abriu lobby, iniciou jogo, escolheu modo, entrou na fila,
  pareou, deu ready, jogou, erro, abandono, reconexao, resultado, payout, tempo
  de partida, dispositivo, build e console error.
- Funis ajudam a achar onde o jogador cai: lobby -> modo -> fila -> ready ->
  primeiro lance -> fim -> nova partida.
- Metricas de jogo: tempo ate primeira acao, taxa de abandono, partidas
  concluidas, erros por build, travas por dispositivo, saldo antes/depois,
  win/loss e repeticao de partida.

### Pipeline e ferramentas

- Pipeline bom transforma asset em runtime com pouca mao manual.
- Scripts devem validar nomes, tamanho, peso, transparencia, grid, frame count,
  pivots, padding/extrude, manifest, assets orfaos e referencias quebradas.
- Assets devem ter estados: estudo, aprovado, integrado, rejeitado, descartado.
- Para pixel art, regra dura: sem blur/interpolacao, PNG lossless, nearest,
  celula fixa ou atlas bem documentado.
- Ferramenta ideal para PubPaid: validador de spritesheet, validador de HUD
  contra overflow, auditor de assets de lobby e checklist de PvP.

### QA profissional

- QA nao e so "testar se abriu". E matriz de risco.
- Smoke: jogo abre e acao principal funciona.
- Regression: o que ja funcionava continua funcionando.
- Exploratory: tentar quebrar com caminhos estranhos.
- Device/mobile QA: tela pequena, toque, orientacao, dedo cobrindo botao, teclado
  ausente, performance e rede instavel.
- Severity: blocker, critical, major, minor, polish.
- Bug bom tem passos, resultado esperado, resultado atual, ambiente, build,
  evidencias e possivel area afetada.

### Monetizacao e etica

- Qualquer jogo com saldo, premio, aposta ou recompensa precisa ser claro sobre
  custo, risco, regra, resultado e historico.
- Evitar dark patterns: botao confuso, recompensa enganosa, urgencia falsa,
  ocultar perda, dificultar pausa/saida ou misturar demo com dinheiro real.
- Demo e dinheiro real precisam ser visualmente e tecnicamente separados.
- Para decisao sensivel, o Diretor do Jogo deve subir ao usuario.

### Mapeamento 2D

- Tilemaps separam camadas: chao, parede, decoracao, colisao, triggers, spawn,
  foreground e debug.
- Object layers sao bons para spawn points, zonas, caminhos, gatilhos, areas de
  interacao e marcadores de gameplay.
- Colisao visual e colisao fisica nao precisam ser iguais. Arte pode ser rica; a
  colisao deve ser simples e previsivel.
- Em 2D top-down, colisao comum: tile solid, AABB, circle, trigger area, overlap,
  ray/line para mira e zonas de evento.
- Em plataforma, swept AABB e resposta de colisao ajudam a evitar atravessar
  parede quando velocidade e alta.
- Hitbox e hurtbox devem ser separadas: hitbox ataca; hurtbox recebe; trigger
  detecta evento sem bloquear movimento.

### Colisao 2D em Phaser/PubPaid

- Arcade Physics resolve muitos casos simples: overlap, collide, groups,
  tilemap collision e separacao basica.
- Matter.js entra quando precisa de fisica mais complexa, corpos compostos,
  torque, formas poligonais e filtros mais ricos.
- Para jogos de mesa do PubPaid, preferir colisao simples e auditavel quando a
  regra for competitiva. Ex.: sinuca visual pode ter fisica local, mas PvP real
  precisa validar resultado/estado no backend.
- Camadas recomendadas: `world`, `player`, `projectile`, `ui`, `trigger`,
  `sensor`, `debug`. Cada uma com regra clara de colisao/overlap.

### Mapeamento e colisao 3D

- Em 3D, blockout e ainda mais importante: testar escala, camera, caminho,
  altura, colisao e leitura antes de arte final.
- Broad phase filtra candidatos rapido com volumes simples; narrow phase calcula
  colisao mais precisa so nos pares provaveis.
- Volumes comuns: AABB, sphere, capsule, OBB, mesh collider simplificado e ray.
- Spatial partitioning ajuda performance: grid, spatial hash, quadtree para 2D,
  octree/BVH para 3D.
- Character controller geralmente usa capsule, nao malha real do personagem.
- Em 3D para web, colisao deve ser conservadora e leve; raycaster e bounding
  boxes servem para muita interacao de UI/seleção, mas gameplay fisico exige
  motor ou camada propria.

### O que o Diretor aprendeu a decidir

- Se a tarefa muda mapa/arena, chamar level design e colisao antes da arte final.
- Se muda controle ou sensação, chamar game feel, UI/HUD e QA.
- Se muda saldo, payout, chance ou PvP, chamar balanceamento, seguranca e subir
  riscos ao usuario.
- Se adiciona asset novo, chamar arte, technical art e pipeline.
- Se adiciona modo novo, exigir mini vertical slice antes de polimento grande.
- Se mexe em colisao, separar visual, fisico, hitbox, hurtbox e trigger.

## Organizacao recomendada

- Diretor do Jogo: guarda visao e coordena subagentes.
- Arte e Design: cuida do visual jogavel, nao apenas imagem bonita.
- Interface e HUD: transforma regra em tela, feedback e controle.
- Teste e Seguranca: protege funcionamento, PvP, economia e regressao.
- Linha Final: revisa tudo junto antes de Codex/Hermes entregar ao usuario.
- Codex/Hermes: ferramentas finais de decisao operacional abaixo do usuario,
  recebendo do Diretor o resumo, riscos e recomendacao.

## Fontes

- https://derekyu.com/makegames/pixelart.html
- https://lospec.com/pixel-art-tutorials/
- https://www.aseprite.org/docs/sprite-sheet/
- https://www.aseprite.org/docs/exporting
- https://www.aseprite.org/docs/cli/
- https://docs.phaser.io/phaser/concepts/animations
- https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity
- https://owasp.org/www-project-gamesec-framework/
- https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/
- https://gameaccessibilityguidelines.com/basic/
- https://gameprogrammingpatterns.com/
- https://docs.phaser.io/phaser/concepts/scenes
- https://docs.phaser.io/phaser/concepts/gameobjects
- https://docs.phaser.io/phaser/concepts/input
- https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame
- https://docs.godotengine.org/en/stable/tutorials/2d/using_tilemaps.html
- https://www.leagueoflegends.com/en-us/news/dev/dev-behind-the-scenes-of-vfx-updates/
