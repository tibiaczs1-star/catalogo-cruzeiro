# PubPaid 2.0 - Pipeline de Imagem, Ilustracao 2D e Pixel Art

Data: 2026-04-23

## Regra principal

Toda mecanica nova da PubPaid 2.0 deve nascer com camada visual junto:

- ilustracao 2D ou pixel art
- profundidade
- luz e sombra
- props e objetos de cena
- leitura clara de personagem/mesa
- acabamento suficiente para parecer jogo, nao esqueleto

Nao entregar apenas canvas funcional.

## Ferramentas confirmadas ou mapeadas

### Ja confirmadas no projeto

- `Phaser` para runtime
- `imagegen` como motor principal para gerar bitmaps e concept art
- `Figma` para UI e mock de telas
- `VS Code` com extensoes:
  - `grimaldi-tech.aseprite-preview`
  - `Moonlit.vscode-tmx-preview`
  - `unique-skills.phaser-dev-helper`

### Encontradas no sistema / catalogo

- `Tiled` no `winget`
  - id: `Tiled.Tiled`
  - uso: montar mapas, colisao, layers e props do pub

- alternativa para texture packing encontrada no `winget`
  - nome: `spright`
  - id: `houmain.spright`
  - uso: empacotar spritesheets e atlas

### Nao encontradas nessa busca

- `Aseprite`
- `LibreSprite`
- `TexturePacker`

Se precisar, tratar essas tres como aquisicao dedicada depois.

## Equipe visual local da PubPaid

### 1. Direcao de arte 2D

Missao:
- definir mood do pub
- garantir paleta consistente
- cuidar de profundidade, luz e silhueta

Entrega:
- guias de cena
- prompts de imagegen
- revisao de unidade visual

### 2. Pixel art de props e mesas

Missao:
- transformar conceitos em objetos jogaveis
- criar gabinetes, portas, letreiros, lampadas, mesas, placares

Entrega:
- sprites de props
- variantes danificadas/brilho/acento

### 3. UI/HUD pixelada

Missao:
- transformar painel, chips, fila e status em interface com cara de jogo

Entrega:
- molduras
- placas
- badges
- mini componentes de mesa

### 4. FX e iluminacao

Missao:
- dar vida com neon, glow, luz de palco, reflexo e scanline

Entrega:
- overlays
- emissive accents
- pequenas animacoes visuais

## Ordem de producao recomendada

1. concept art 2D
2. recorte de elementos
3. simplificacao para leitura em jogo
4. versao pixel art / sprite util
5. atlas / organizacao por pasta
6. integracao no Phaser
7. polimento de luz, sombra e FX

## O que produzir primeiro

### Dardos

- gabinete pixel art premium
- placa de pontuacao
- dardos visiveis no alvo
- glow de acerto
- moldura de torneio

### Dama

- mesa de madeira/neon
- lampada superior
- pecas melhores com coroa
- destaque visual de turno
- feedback de captura

### Fila PvP

- portal/porta do pub
- placa de matchmaking
- luzes de espera
- contador visual de stake/escrow

## Pastas recomendadas

- `assets/pubpaid/locations/street`
- `assets/pubpaid/locations/interior`
- `assets/pubpaid/ui`
- `assets/pubpaid/tables/darts`
- `assets/pubpaid/tables/checkers`
- `assets/pubpaid/fx`
- `assets/pubpaid/props`

## Regra de prompt para imagegen

Sempre pedir:

- pixel art ou ilustracao 2D de game
- leitura clara em tela
- sem aspecto de mock vazio
- sem texto aleatorio
- com luz, sombra, material e profundidade
- coerente com pub noturno premium, neon e madeira escura

## Criterio de aprovado

Um asset so entra se cumprir os quatro:

1. parece parte do mesmo jogo
2. tem leitura clara em tamanho real
3. melhora a fantasia do pub
4. nao parece placeholder
