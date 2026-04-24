# PubPaid 2.0 - Prompts de Producao dos 20 Personagens RPG 32-bit

Objetivo: treinar os agentes de arte e gerar um modelo visual coerente antes de cortar sprites finais.

Regra soberana:

- nao gerar personagem procedural
- nao gerar boneco de bloco
- nao gerar vetor
- nao gerar personagem chibi
- nao integrar no jogo sem aprovacao visual
- primeiro: folha de modelo
- depois: sprites individuais aprovados
- por ultimo: spritesheets animados

## Prompt mestre - folha visual dos 20

```text
Create one clean character model sheet with 20 distinct 2D pixel art RPG sprites for a modern indie urban RPG.

Art direction: late 32-bit / PS1-era RPG atmosphere reimagined as crisp hand-made pixel art, semi-realistic adult proportions, urban rainy neon night, PubPaid bar world, not chibi, not vector, not procedural.

Layout: 4 rows x 5 columns, flat neutral dark slate background, no labels, no UI, no scenery, generous spacing, each character full body and readable.

Sprite feel: 32x48 RPG sprite proportions, some larger characters up to 48x64, clean 8x8 pixel logic, strong silhouette first, integrated clothing, believable limbs, no rectangular bodies, no stick legs, no same-face repetition.

Palette: cold blue and violet shadows, small amber highlights, subtle cyan/magenta neon contamination, controlled saturation, characters must not overpower the PubPaid sign or door.

Characters:
1 protagonist base, dark jacket, confident stance
2 protagonist urban variant, open coat, light shirt hit by neon
3 pub security guard, broad body, dark clothes, firm stance
4 bar waiter, elegant uniform, indoor-only silhouette
5 stage singer, expressive performance pose, warm highlight
6 betting client, casual social shirt, leaning table vibe
7 woman at bus stop with umbrella, headphones, subtle dancing posture
8 nerd seated on ground with phone, face lit by screen, hoodie/backpack
9 nerd conversation A, slim body, speaking gesture
10 nerd conversation B, different body shape, listening gesture, phone or backpack
11 homeless man sleeping seated, low silhouette, coat/blanket, respectful depiction
12 drunk leaning, heavy unbalanced human posture
13 elderly woman waiting for bus, long coat, purse, patient stance
14 old man with cane, readable cane, slightly curved back
15 hooded boy, discreet suspicious vibe, shaded face
16 motorcycle courier, helmet or delivery bag, urban posture
17 taxi driver, simple jacket, waiting stance, subtle amber detail
18 elegant bar woman, social outfit, warm indoor light
19 veteran player, older, classic clothes, game-table posture
20 mysterious alley figure, dark silhouette, low facial information

Quality constraints: hand-made pixel art look, crisp clusters, readable silhouettes, varied heights and body shapes, no block placeholders, no fake canvas shapes, no text.
```

## Prompt individual base

```text
Create a single 2D pixel art RPG character sprite concept for PubPaid 2.0.

Character: [character name]
Role: [role in street/bar]
Pose: [pose]

Style: modern indie 32-bit RPG pixel art with late PS1-era urban mood, adult semi-realistic proportions, not chibi.
Canvas: isolated full-body sprite, 32x48 RPG sprite proportions, flat neutral dark slate background.
World: rainy neon urban night around the PubPaid bar.
Palette: cold blue/violet shadows, controlled amber highlights, subtle cyan/magenta neon contamination.
Pixel quality: strong readable silhouette, clean pixel clusters, integrated clothing, believable limbs, no rectangular body, no stick legs, no procedural look, no vector look, no text, no UI, no background scene.
```

## Ordem de treino dos agentes

1. Agente Silhueta: reprova qualquer corpo bloco antes da cor.
2. Agente Escala: compara com porta, calcada, ponto de onibus e interior.
3. Agente Paleta: limita neon para nao competir com letreiro.
4. Agente Material: valida tecido, couro, metal, vidro, guarda-chuva e cabelo.
5. Agente Animacao: marca quais personagens precisam idle, walk ou microgesto.
6. Agente Integracao: so aprova depois de teste no fundo real.

## Protocolo de entrega

Para cada personagem aprovado na folha:

1. recortar sprite individual
2. remover fundo
3. normalizar escala
4. testar no fundo da rua/bar
5. gerar idle com 2 a 4 frames
6. gerar walk apenas para personagens que precisam andar
7. registrar nota no nucleo

## Corte para runtime

Nenhum personagem entra em `StreetScene.js` ou `InteriorScene.js` ate cumprir:

- nota 3 em nao-proceduralidade
- nota 3 em escala
- nota 3 em leitura no fundo real
- media final minima 2.5

