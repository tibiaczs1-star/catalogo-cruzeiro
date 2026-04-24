# PubPaid 2.0 - Nucleo de Conhecimento de Arte

Objetivo:

- formar um nucleo permanente de especializacao em arte para jogo
- estudar playlist, artigos, breakdowns, documentacao, referencias e ferramentas
- transformar isso em regra, treino e producao para a PubPaid 2.0

## Missao do nucleo

Este nucleo existe para:

- estudar continuamente arte de jogo
- pesquisar fora do workspace em cada rodada
- mapear e dominar as skills e ferramentas disponiveis
- treinar a equipe para usar melhor essas ferramentas
- transformar estudo em padrao visual real

## Protocolo obrigatorio de cada rodada

Toda rodada de estudo deve fazer 4 coisas:

1. estudar a fonte principal da rodada
2. pesquisar na internet artigos, breakdowns, posts tecnicos, documentacao e referencias
3. mapear skills e ferramentas ja disponiveis na sessao e no workspace
4. transformar o estudo em regras praticas e treino interno

## Fontes de estudo por prioridade

1. playlist principal indicada pelo usuario
2. artigos tecnicos sobre pixel art, cenarios, sprites, animacao, paleta e pipeline
3. documentacao oficial de ferramentas
4. breakdowns de artistas de jogo
5. postmortems e pipelines de producao
6. bibliotecas, skills e ferramentas do proprio ambiente

## Perguntas que toda rodada deve responder

- o que aprendemos hoje
- o que isso muda na PubPaid 2.0
- que erro isso ajuda a evitar
- que ferramenta ja temos para executar isso
- como treinar a equipe nisso
- isso vira regra, experimento ou referencia

## Areas obrigatorias de especializacao

1. direcao artistica
2. fundamentos de pixel art
3. pipeline de producao
4. cenarios e mapa
5. personagens
6. animacao frame a frame
7. cor, luz e sombra
8. materiais visuais
9. props de cena
10. profundidade e composicao
11. efeitos ambientais
12. veiculos e animais
13. interface visual do jogo
14. consistencia anti-procedural
15. glossario tecnico
16. checklist de producao
17. progressao de estudo
18. resumo executivo
19. plano continuo de treinamento

## Skills e ferramentas relevantes ja disponiveis

### Skills centrais para esta frente

- `imagegen`: gerar ou editar bitmap raster para sprites, props, mockups e referencias
- `develop-web-game`: loop de implementacao e validacao para web game
- `frontend-skill`: reforco de composicao, leitura visual e UX de superficies
- `browser-use:browser`: inspecao no navegador local da cena real
- `playwright`: automacao e captura de validacao visual
- `playwright-interactive`: iteracao rapida de debug visual
- `game-studio:sprite-pipeline`: pipeline de sprites e animacoes 2D
- `game-studio:phaser-2d-game`: implementacao em Phaser
- `game-studio:game-playtest`: playtest estruturado

### Ferramentas locais do ambiente

- edicao de arquivos no workspace
- validacao com `node --check`
- organizacao da memoria local em `.codex-memory/`
- subagentes para pesquisa em paralelo
- navegador interno para teste visual da rua e do bar

## Padrao de treino interno

Todo agente deve treinar neste ciclo:

1. estudar
2. resumir
3. extrair regra
4. escolher ferramenta/skill para executar
5. propor exercicio pratico
6. validar no jogo real
7. registrar resultado

## Formato de entrega por rodada

Cada rodada deve gerar:

- resumo do estudo
- fontes consultadas
- tecnicas aprendidas
- ferramentas/skills relevantes
- como treinar a equipe nelas
- aplicacao direta na PubPaid 2.0
- riscos e erros a evitar
- decisoes que viram padrao

## Fontes externas uteis para o nucleo

Estas fontes foram verificadas e entram como base recorrente para a equipe:

- Lospec Tutorials - clusters:
  https://lospec.com/pixel-art-tutorials/beginners-guide-clusters-by-artem-brullov
- Lospec Tutorials - shapes and outlines:
  https://lospec.com/pixel-art-tutorials/pixel-art-shapes-and-outlines-by-cyangmou
- Lospec Tutorials - guia amplo de fundamentos:
  https://lospec.com/pixel-art-tutorials
- Lospec Tutorials - walk cycle:
  https://lospec.com/pixel-art-tutorials/walk-cycle-by-pedro-medeiros
- Lospec Tutorials - quadruped walk / trot:
  https://lospec.com/pixel-art-tutorials/quadruped-walk-trot-by-pedro-medeiros
- Lospec Tutorials - animation planning:
  https://lospec.com/pixel-art-tutorials/animation-planning-by-pedro-medeiros
- Aseprite docs:
  https://www.aseprite.org/docs/
- Aseprite product/features overview:
  https://www.aseprite.org/
- Coartist - readability, silhouette, shape language and contrast:
  https://coartist.net/blog/character-design-readability-silhouette-shape-language-contrast

## O que estas fontes reforcam

- silhueta boa vem antes de detalhe
- clusters precisam ser limpos e intencionais
- leitura vem de forma, valor e contraste antes de vir de textura
- animacao precisa ser planejada a partir de poses legiveis
- quadrupedes, carros, props e personagens devem nascer de blocos simples
- ferramenta sem criterio nao resolve sprite ruim

## Ferramentas e skills reais do workspace/sessao

### Skills para arte e validacao

- `imagegen`
  - uso: gerar bitmap de referencia, exploracao visual, mockup de sprite e prop
  - treino: pedir 3 variacoes da mesma silhueta e comparar leitura

- `game-studio:sprite-pipeline`
  - uso: gerar e normalizar sprite strips e animacoes 2D
  - treino: transformar um idle aprovado em folha simples coerente

- `game-studio:phaser-2d-game`
  - uso: ligar sprite, escala, animacao e depth no runtime do jogo
  - treino: plugar um sprite parado e validar leitura no mapa real

- `develop-web-game`
  - uso: iterar com validacao visual curta e constante
  - treino: rodadas pequenas de "troca sprite -> sobe -> testa -> corrige"

- `browser-use:browser`
  - uso: inspecionar a cena real no navegador interno
  - treino: validar sprite sobre o fundo da rua e do bar

- `playwright` e `playwright-interactive`
  - uso: capturar telas e comparar legibilidade em resolucoes diferentes
  - treino: tirar snapshot desktop/mobile de cada rodada de arte

- `frontend-skill`
  - uso: leitura visual, composicao, hierarquia e integracao entre fundo e elementos
  - treino: revisar se o sprite compete ou conversa com o cenario

### Ferramentas e ativos locais

- `sprite-vault/`
  - cofre local com personagens, UI, tilesets e props licenciados
  - treino: estudar packs da Kenney para escala, economia de forma e modularidade

- `assets/pubpaid/` e `assets/`
  - bases visuais da PubPaid para teste de integracao
  - treino: montar folha de comparacao "sprite isolado vs sprite sobre cenario"

- `PUBPAID_2D_ART_PIPELINE.md`
  - guia local da frente de arte 2D
  - treino: alinhar producao nova ao pipeline ja definido

- `PUBPAID_VISUAL_SCALE_GUIDE.md`
  - guia local de escala visual
  - treino: validar altura relativa de humano, animal, veiculo e props

## Como treinar a equipe nestas skills e ferramentas

### Treino 1 - silhueta

- cada agente pega 1 tipo de personagem ou prop
- faz 3 versoes monocromaticas
- valida qual continua legivel em tamanho pequeno
- so depois passa para cor

### Treino 2 - clusters e limpeza

- escolher 1 sprite ruim ou procedural
- redesenhar com massas maiores e menos ruído
- marcar pixel sem funcao e remover
- comparar antes e depois

### Treino 3 - leitura no cenario real

- colocar o sprite sobre `assets/pubpaid-exterior-v3.png`
- testar leitura contra neon, janela, beco e calçada
- ajustar valor e contraste antes de mexer na animacao

### Treino 4 - animacao minima

- aprovar frame parado
- fazer idle de 2 ou 3 frames
- checar se o movimento parece respirar e nao pular
- so entao considerar walk cycle

### Treino 5 - consistencia anti-procedural

- comparar sprite novo com o fundo real da PubPaid
- se parecer bloco gerado, boneco falso ou shape sem anatomia visual, reprovar
- registrar por que reprovou

## Nucleo permanente de conhecimento da equipe

Toda rodada nova deve alimentar este nucleo com 5 blocos:

1. fonte principal estudada
2. fontes externas complementares
3. ferramentas/skills usadas ou recomendadas
4. regra pratica para a PubPaid 2.0
5. exercicio de treino da equipe

## Regra especifica do Agente 02

O Agente 02 responde por:

- forma
- silhueta
- proporcao
- leitura
- clusters
- limpeza

Sempre que houver sprite novo para rua ou bar, o Agente 02 deve fazer a primeira triagem:

- passa no teste de silhueta?
- esta proporcional ao cenario?
- tem leitura contra o fundo?
- clusters estao limpos?
- parece pixel art real ou procedural?

## Regra especifica do Agente 09

O Agente 09 responde por:

- props de rua
- props de bar
- objetos de navegacao
- objetos de atmosfera
- objetos de interacao
- familias de props

Arquivo-base atual:

- `.codex-memory/agent-09-props-catalog.md`

Toda rodada do Agente 09 deve responder:

- que props sao obrigatorios para leitura do mapa?
- que props sao secundarios?
- o que ainda e ruido e nao precisa entrar?
- qual familia de props precisa nascer junta para nao quebrar consistencia?
- que skill/ferramenta do ambiente ajuda a validar isso mais rapido?

## Regra especifica do Agente 19

O Agente 19 responde por:

- plano continuo de treinamento
- cadencia da equipe
- transformacao de estudo em producao real
- rotina de avaliacao
- controle de entrada de assets no runtime
- fechamento do ciclo entre playlist, pesquisa externa, skills e PubPaid 2.0

Arquivo-base atual:

- `.codex-memory/agent-19-continuous-training-plan.md`

Toda rodada do Agente 19 deve responder:

- o que a equipe estuda hoje?
- que fonte externa sustenta o treino?
- que skill/ferramenta sera treinada?
- que micro-entrega nasce da rodada?
- como essa entrega sera avaliada no fundo real?
- o que vira padrao, rejeicao ou experimento?

## Regra permanente

Nao basta estudar.

O nucleo deve:

- aprender
- comparar
- testar
- padronizar
- treinar
- registrar

Se uma descoberta nao vira regra, experimento ou exercicio de equipe, o ciclo ainda nao terminou.

## Protocolo permanente atualizado - rodadas de estudo

Toda rodada daqui para frente deve seguir este protocolo sem excecao:

1. estudar a playlist principal indicada pelo usuario
2. buscar na internet artigos, breakdowns, referencias e documentacao sobre o tema da rodada
3. mapear skills, ferramentas e scripts ja disponiveis no workspace e na sessao
4. transformar o estudo em nucleo de conhecimento reutilizavel pela equipe

## Foco atual do Agente 06

Responsabilidade principal:

- animacao sprite a sprite para jogo 2D/pixel art
- caminhada
- idle
- ciclos simples
- peso
- timing
- pernas
- bracos
- respiracao
- consistencia entre frames
- padrao ideal para 8 direcoes
- padrao ideal para NPCs parados

## Nucleo operacional do Agente 06

### O que vira regra

- walk bom nao e pulo fake
- todo ciclo de caminhada precisa mostrar transferencia de peso
- cabeca e tronco oscilam pouco; pernas vendem o deslocamento
- bracos compensam as pernas; nao balancam sem motivo
- idle bom e sutil, lento e vivo
- NPC parado nao pode parecer morto nem quicando
- diagonais nao podem ser copia preguiçosa de frente/lado

### Padrao recomendado para a PubPaid 2.0

- player principal: 8 direcoes x 4 frames walk
- player principal: 8 direcoes x 3 frames idle
- NPC andando: 8 direcoes x 3 ou 4 frames walk
- NPC parado: 2 a 4 frames idle por acao
- loops devem ser validados em escala real dentro da rua e do bar

### Leituras tecnicas que o agente deve procurar nas fontes

- contato
- passing
- down
- up
- frame holds
- timing desigual
- follow-through leve
- secondary motion minima
- leitura da silhueta em baixa resolucao

## Fontes externas uteis para o nucleo

### Documentacao e base de ferramenta

- Aseprite Animation Docs: https://www.aseprite.org/docs/animation/
- Aseprite CLI Docs: https://www.aseprite.org/docs/cli/
- Aseprite Preview Window: https://www.aseprite.org/docs/preview-window/

### Tutoriais e indices de referencia

- Lospec Walkcycle Tutorials: https://lospec.com/pixel-art-tutorials/tags/walkcycle
- Lospec Idle Animation tutorial index: https://lospec.com/pixel-art-tutorials/pixelart-quicktip-idle-animation-by-endesga
- Lospec beginner guide: https://lospec.com/articles/pixel-art-where-to-start
- Sandro Maglione character animation guide: https://www.sandromaglione.com/articles/pixel-art-character-animations-guide
- Saultoons walk cycle tutorial: https://www.youtube.com/watch?v=7T6yOk5n-zk

### Como usar essas fontes

- Aseprite docs: fluxo, timeline, onion skin, tags, preview, export
- Lospec: biblioteca viva de breakdowns e exemplos de walk/idle/run
- Sandro Maglione: guia rapido de principios aplicados a idle, walk e acoes
- Saultoons: leitura de key poses, timing e breakdown visual em video

## Skills e ferramentas mais relevantes para este nucleo

### Skills da sessao

- `game-studio:sprite-pipeline`
- `imagegen`
- `develop-web-game`
- `browser-use:browser`
- `playwright`
- `playwright-interactive`
- `game-studio:phaser-2d-game`
- `game-studio:game-playtest`

### Ferramentas do workspace

- `scripts/build_sprite_edit_canvas.py`
- `scripts/normalize_sprite_strip.py`
- `scripts/render_sprite_preview_sheet.py`
- validacao com `node --check`
- memoria local em `.codex-memory/`
- runtime real da PubPaid em `pubpaid-v2.html` + `pubpaid-phaser/`

## Como treinar a equipe nessas skills

### Treino 1 - leitura de movimento

- pegar um sprite aprovado
- desenhar 4 frames de walk lateral
- validar se existe contato, passing, down e up
- revisar em preview sheet

Skill principal:
- `game-studio:sprite-pipeline`

### Treino 2 - consistencia de frame

- usar um frame-semente aprovado
- montar edit canvas grande
- gerar ou editar a strip inteira de uma vez
- normalizar para ancora unica bottom-center
- comparar frame 1 com o seed

Skills principais:
- `game-studio:sprite-pipeline`
- `imagegen`

### Treino 3 - idle vivo para NPC

- criar 2, 3 e 4-frame idles
- testar respiracao, blink e leve troca de peso
- verificar se o NPC parece vivo sem parecer pulando

Skills principais:
- `game-studio:sprite-pipeline`
- `browser-use:browser`

### Treino 4 - validacao em jogo

- ligar o asset no runtime real
- testar no cenario real da rua ou bar
- conferir escala, contraste, legibilidade e ritmo
- capturar screenshot para revisao

Skills principais:
- `develop-web-game`
- `playwright`
- `game-studio:game-playtest`

## Formato de registro obrigatorio do Agente 06

Toda rodada desse agente deve registrar:

- tema estudado
- fontes consultadas
- tecnica aprendida
- regra extraida
- skill/ferramenta usada ou recomendada
- exercicio de treino proposto
- aplicacao direta na PubPaid 2.0
- risco/erro que o estudo ajuda a evitar

## Nota de honestidade metodologica

Se a playlist principal nao puder ser lida integralmente pela sessao, o agente deve dizer isso explicitamente, continuar pesquisando fontes externas de alta utilidade e registrar o que ficou pendente para validacao futura.
