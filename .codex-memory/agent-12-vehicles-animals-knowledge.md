# Agente 12 - Veiculos e Animais em Pixel Art

Status:

- consolidado a partir da segunda rodada
- observacao honesta do agente: sem acesso interno confiavel a playlist nesta sessao

## Veredito rapido

Veiculo e animal so entram se tiverem:

- silhueta clara
- poucos volumes grandes
- animacao curta e funcional
- proporcao coerente com porta, calcada e ponto de onibus
- detalhe controlado
- zero cara procedural

## Padroes recomendados

### Carros

- base: 64x32
- leitura lateral ou lateral com 3/4 muito leve
- massas principais: cabine, corpo, rodas
- rodas legiveis
- paleta curta
- animacao: 2 ou 3 frames de roda + deslocamento lateral

### Motos

- base: 40x24 ou 48x24
- leitura com duas rodas, banco/corpo e guidao
- simplificar mais que carro
- animacao: rodas 2 frames, micro vibracao opcional

### Cachorro

- base: 24x24 ou 24x20
- cabeca, tronco, patas e cauda legiveis
- melhor estilo: cachorro de rua magro, lateral
- animacao: walk de 4 frames

### Gato

- base: 20x20 ou 24x24
- topo do arcade, beco ou parede/caixote
- orelhas, dorso e cauda legiveis
- animacao: groom de 3 ou 4 frames; idle de observacao curto

## Regras

- carro e moto nao podem ser retangulo com roda
- cachorro e gato nao podem ser blob com orelha
- reflexo e brilho ficam no ambiente, nao salvam sprite fraco
- menos detalhe costuma ler melhor sobre fundo rico

## Erros proibidos

- roda pequena demais
- vidro picotado
- gato sem cauda legivel
- cachorro sem separacao de cabeca e tronco
- moto fina demais
- carro procedural fake em bloco
- tentar compensar ma forma com neon

## Fontes externas uteis

- Aseprite tutorials/docs
- Lospec tutorials
- Lospec shapes and outlines
- Learn to create pixel art for your games
- Lospec car tutorials
- Creative Bloq - modern pixel art

## Skills e ferramentas relevantes

- imagegen
- game-studio:sprite-pipeline
- game-studio:phaser-2d-game
- develop-web-game
- browser-use:browser
- playwright
- playwright-interactive
- view_image
- apply_patch

## Plano de treino

1. silhuetas de carros, moto, cachorro e gato
2. aprovar em preto
3. aplicar cor base
4. testar no fundo real
5. animacao minima
6. normalizacao por sprite-pipeline
7. validacao no Phaser/browser
