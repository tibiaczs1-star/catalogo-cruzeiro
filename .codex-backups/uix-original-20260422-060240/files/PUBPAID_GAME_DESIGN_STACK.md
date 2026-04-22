# PubPaid 2.0 - Stack Organizado de Game Design

Data: 2026-04-21

## Objetivo

Transformar o `PubPaid 2.0` em jogo de verdade, com intro dentro do proprio runtime, pipeline visual consistente e ferramentas certas para arte, mapa, audio e UI.

## Direcao fechada

- Abertura deixa de ser "pagina de splash".
- Tudo importante acontece dentro da tela do jogo.
- O fluxo correto passa a ser:
  - `BootScene`
  - `IntroScene`
  - aceite de termos
  - login Google
  - `StreetScene`
  - `InteriorScene`
  - `UIScene`

## O que deve morrer

- overlay com cara de landing page
- hero editorial disputando espaco com o jogo
- personagem fake montado em CSS como solucao final
- auth Google como bloco lateral de site

## O que entra no lugar

- intro cinematica em bitmap ou spritesheet
- personagem com poses reais
- celular saindo do bolso
- cerveja na mao
- toque no celular
- logo do pub acendendo
- CTA diegetico dentro da experiencia

## Ferramentas principais

### Runtime

- `Phaser`
- scenes separadas por responsabilidade

### Pixel art e sprites

- `Aseprite`
- `LibreSprite` como fallback livre

### Mapas

- `Tiled`

### Empacotamento

- `TexturePacker`
- `PhysicsEditor` se a colisao crescer

### Audio

- `Howler.js`

### UI e design system

- `Figma`
- `Rive` apenas para UI especial, nao para a intro bitmap

### Pesquisa visual e prototipagem

- `imagegen`
- `Sora`
- `screenshot`

## Extensoes recomendadas no editor

- `grimaldi-tech.aseprite-preview`
  Motivo: preview de `.ase` e `.aseprite` com animacao no VS Code.
- `Moonlit.vscode-tmx-preview`
  Motivo: preview rapido de mapas `.tmx` sem sair do editor.
- `unique-skills.phaser-dev-helper`
  Motivo: ajuda de API e snippets focados em Phaser.
- `streetsidesoftware.code-spell-checker`
  Motivo: evita textos quebrados em UI, dialogo e HUD.
- `dbaeumer.vscode-eslint`
  Motivo: padrao de qualidade no JavaScript do jogo.
- `esbenp.prettier-vscode`
  Motivo: manter codigo consistente enquanto a base cresce.
- `ms-vscode.vscode-typescript-next`
  Motivo: autocomplete e leitura melhores para evolucao futura da base.

## Skills ja reunidas para esta frente

- `develop-web-game`
- `frontend-skill`
- `playwright`
- `imagegen`
- `figma`
- `figma-generate-design`
- `figma-generate-library`
- `figma-implement-design`
- `figma-use`
- `figma-create-new-file`
- `figma-create-design-system-rules`
- `screenshot`
- `sora`
- `speech`
- `transcribe`

## Estrutura de trabalho recomendada

### Arte

- `assets/pubpaid/intro/characters`
- `assets/pubpaid/intro/props`
- `assets/pubpaid/intro/fx`
- `assets/pubpaid/locations/street`
- `assets/pubpaid/locations/interior`
- `assets/pubpaid/ui`

### Codigo

- `pubpaid-phaser/scenes/BootScene.js`
- `pubpaid-phaser/scenes/IntroScene.js`
- `pubpaid-phaser/scenes/StreetScene.js`
- `pubpaid-phaser/scenes/InteriorScene.js`
- `pubpaid-phaser/scenes/UIScene.js`

## Proxima implementacao certa

1. Remover a splash externa atual da rota `pubpaid-v2.html`.
2. Criar `IntroScene.js`.
3. Levar termos e Google para fluxo interno do jogo.
4. Trocar prototipo visual por sprites reais.
5. Montar pipeline Aseprite -> spritesheet -> Phaser.

## Regra de ouro

Menos "site bonito sobre o jogo".
Mais "jogo com direcao de arte, estados e entrada jogavel".
