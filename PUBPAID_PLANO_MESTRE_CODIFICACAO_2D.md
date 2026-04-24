# PubPaid 2.0 - Plano Mestre de Codificacao 2D

Este plano consolida a rodada de treino dos agentes sobre jogo 2D, Phaser, mapas interativos, spritesheets, UI pixel art e QA.

## Decisao central

PubPaid 2.0 deve ser um jogo 2D real.

- Phaser: mundo, sprites, camera, colisao, mapa, animacao e input.
- DOM: HUD, pausa, dialogo, diario, mapa visual, lobby e paineis de texto.
- Pixel art bitmap: personagens, props, veiculos, animais, UI visual e mapas.
- Sem canvas procedural para personagem final.
- Sem dashboard/app moderno por cima do jogo.

## Ordem de implementacao

### 1. Fonte unica de mapa

Criar um sistema de consulta de mapa antes de mexer em arte.

Arquivos:

- `pubpaid-phaser/systems/mapQuerySystem.js`
- `pubpaid-phaser/config/mapTypes.js`

Funcoes:

- `getSceneMap(sceneId)`
- `isWalkable(sceneId, x, y)`
- `getInteractionAt(sceneId, x, y)`
- `getNearestInteraction(sceneId, x, y, types)`
- `getTransition(sceneId, transitionId)`

Meta:

- porta, rua, calcada, ponto de onibus, beco, arcade, bar, balcao, mesas e saidas devem vir do mapa, nao de codigo solto nas scenes.

### 2. Manifesto de assets

Todo asset deve ter chave estavel.

Arquivos:

- `pubpaid-phaser/data/assetManifest.js`
- futuro: `assets/pubpaid/spritesheets/manifest.json`

Categorias:

- backgrounds
- characters
- props
- vehicles
- animals
- ui
- fx
- audio
- maps

Meta:

- parar de espalhar caminhos de imagem dentro das scenes.

### 3. PlayerController

Unificar movimento de rua e interior.

Arquivos:

- `pubpaid-phaser/core/PlayerController.js`
- `pubpaid-phaser/core/InputController.js`
- `pubpaid-phaser/core/Direction.js`
- `pubpaid-phaser/config/playerConfig.js`

Regras:

- clique/touch anda ate destino valido
- teclado anda em 8 direcoes
- diagonal normalizada
- `E` ou `Enter` interage com ponto proximo
- clique na porta move ate o ponto de uso antes de transicionar
- cenas nao devem duplicar movimento

### 4. InteractionSystem

Separar interacao do render.

Arquivo:

- `pubpaid-phaser/core/InteractionSystem.js`

Tipos:

- porta
- saida
- ponto de onibus
- arcade
- balcao
- mesa
- palco
- NPC
- prop

Meta:

- prompt contextual muda conforme o ponto ativo.
- transicao rua/bar usa ponto de mapa.

### 5. DepthSystem

Profundidade por eixo Y.

Arquivo:

- `pubpaid-phaser/core/DepthSystem.js`

Regra:

```text
depth = baseDepth + y / 1000
```

Meta:

- player e NPCs passam na frente/atras corretamente.
- props e mapas nao parecem colados.

### 6. Spritesheets reais

Formato oficial de personagem que anda:

```text
1 personagem = 1 spritesheet PNG
8 direcoes
3 frames por direcao
24 frames total
frame base = 32x48
personagem grande = 48x64
origin = 0.5, 1
anchor = bottom-center
```

Direcoes:

- down
- down-right
- right
- up-right
- up
- up-left
- left
- down-left

Walk:

```text
0 -> 1 -> 2 -> 1
110ms a 150ms por frame
sem tween de y
```

Arquivos:

- `pubpaid-phaser/core/animationRegistry.js`
- `pubpaid-phaser/core/actorFactory.js`
- `pubpaid-phaser/systems/animationState.js`
- `assets/pubpaid/spritesheets/characters/`

Primeiro piloto:

- protagonista 8 direcoes x 3 frames.

### 7. UI pixel art DOM

Estados oficiais:

- hidden
- street
- doorPrompt
- dialog
- journal
- pause
- barPanel

Arquivos:

- `pubpaid-phaser/ui/GameHud.js`
- `pubpaid-phaser/ui/InteractionPrompt.js`
- `pubpaid-phaser/ui/DialogBox.js`
- `pubpaid-phaser/ui/JournalPanel.js`
- `pubpaid-phaser/ui/PauseMenu.js`
- `pubpaid-phaser/ui/BarPanel.js`
- `pubpaid-phaser/state/uiState.js`

Regra visual:

- vidro escuro molhado
- borda fina de latao
- neon ciano/magenta pequeno
- ambar no bar
- centro livre
- nada de dashboard

Primeiro pacote:

- HUD minimo
- prompt da porta
- pausa

### 8. Debug e QA

Arquivos:

- `pubpaid-phaser/debug/debugOverlay.js`
- `pubpaid-phaser/debug/qaHooks.js`
- `tests/pubpaid-smoke.spec.js`

QA minimo:

- boot sem erro de console
- jogo abre na rua
- porta transiciona para interior
- saida volta para rua
- resize desktop/mobile nao quebra
- HUD nao cobre porta/personagem
- screenshot valida visual

## Checklist anti-erro

- cena nao guarda regra de jogo pesada
- estado salvo nao depende de sprite Phaser
- todo ponto interativo vem do mapa
- todo asset vem do manifest
- UI DOM nao vira site
- player final nao usa canvas procedural
- personagem nao anda pulando
- debug overlay nao e arte final
- mapa identifica rua, calcada, porta, ponto de onibus, beco, arcade e bar

## Primeiro passo recomendado

Implementar sem mudar visual:

1. `mapQuerySystem.js`
2. `assetManifest.js`
3. trocar a consulta da porta para usar mapa/sistema
4. criar contrato de UI DOM
5. criar teste smoke da porta

Depois disso:

1. `PlayerController`
2. `InteractionSystem`
3. `DepthSystem`
4. piloto de spritesheet do protagonista
5. HUD minimo aprovado

