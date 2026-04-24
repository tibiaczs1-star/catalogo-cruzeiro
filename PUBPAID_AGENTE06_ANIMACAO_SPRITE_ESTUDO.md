# PubPaid 2.0 - Agente 06 - Animacao Sprite a Sprite

## Missao

Especializacao permanente em:

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

## Protocolo permanente

Toda rodada deste agente deve:

1. estudar a playlist principal indicada pelo usuario
2. buscar na internet artigos, breakdowns e referencias sobre animacao sprite a sprite para jogos 2D/pixel art
3. mapear skills e ferramentas disponiveis no workspace e na sessao
4. registrar o conhecimento em formato reaproveitavel pela equipe

## Fontes externas uteis

- Playlist principal do usuario: https://www.youtube.com/watch?v=BT-PadfxAZU&list=PLXiMbAkZF_Bnfek4nfHAxB8C6ey6roq-n
- Aseprite Animation Docs: https://www.aseprite.org/docs/animation/
- Aseprite CLI Docs: https://www.aseprite.org/docs/cli/
- Lospec Walkcycle tutorials: https://lospec.com/pixel-art-tutorials/tags/walkcycle
- Lospec Idle Animation quicktip: https://lospec.com/pixel-art-tutorials/pixelart-quicktip-idle-animation-by-endesga
- Lospec beginner guide: https://lospec.com/articles/pixel-art-where-to-start
- Sandro Maglione - Pixel art character animations guide: https://www.sandromaglione.com/articles/pixel-art-character-animations-guide
- Saultoons walk cycle tutorial: https://www.youtube.com/watch?v=7T6yOk5n-zk

## Skills e ferramentas relevantes

### Skills

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
- `node --check`
- `pubpaid-v2.html`
- `pubpaid-phaser/`

## Como treinar a equipe

### Treino A - walk lateral em 4 frames

Objetivo:

- aprender contato, down, passing e up

Passos:

1. escolher um frame-semente aprovado
2. desenhar os 4 key poses
3. revisar silhueta em zoom 1x e 2x
4. gerar preview sheet
5. validar em loop

### Treino B - idle respirando em 3 frames

Objetivo:

- dar vida sem parecer pulo

Passos:

1. frame base
2. corpo desce 1 pixel
3. detalhe secundario atrasa 1 frame

### Treino C - consistencia entre direcoes

Objetivo:

- manter volume, altura e personalidade entre 8 direcoes

Passos:

1. definir frente e lado como direcoes-mestre
2. derivar diagonais com leitura propria
3. conferir cabeca, tronco, cintura e passo

### Treino D - validacao em jogo

Objetivo:

- confirmar que a animacao funciona no runtime real

Passos:

1. ligar no Phaser
2. testar no cenario da rua
3. checar escala e contraste
4. capturar screenshot
5. ajustar

## Padrao ideal recomendado

### Player

- walk: 8 direcoes x 4 frames
- idle: 8 direcoes x 3 frames

### NPC andando

- walk: 8 direcoes x 3 frames

### NPC parado

- idle: 2 a 4 frames por acao

## Regras que viram padrao

- walk bom mostra transferencia de peso
- idle bom mexe pouco e com intencao
- pernas precisam vender o deslocamento
- bracos compensam o passo
- diagonais precisam ser legiveis
- nada de pulo fake para simular caminhada
- se parecer procedural ou bloco duro, reprovar

## Registro obrigatorio por rodada

- o que foi estudado
- quais fontes foram consultadas
- quais tecnicas ficaram claras
- quais duvidas ficaram abertas
- qual regra vira padrao
- qual exercicio de treino sera aplicado na equipe
- qual aplicacao vai para a PubPaid 2.0
