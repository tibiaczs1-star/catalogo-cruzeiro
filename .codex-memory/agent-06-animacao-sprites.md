# Agente 06 - Animacao Sprite a Sprite

Status:

- consolidado a partir da primeira rodada
- observacao honesta do agente: sem acesso interno confiavel a playlist nesta sessao

## Diretriz central

O erro mais comum e fazer o sprite pular em vez de caminhar. Caminhada boa vem de transferencia de peso.

## Walk ideal

- minimo bom: 8 direcoes x 3 frames
- ideal: 8 direcoes x 4 frames

## Estrutura 3 frames

1. contato A
2. passing
3. contato B

## Estrutura 4 frames

1. contato A
2. down
3. contato B
4. up/passing

## Timing

- walk normal: 8 a 12 fps
- walk rpg: 10 fps
- run: 12 a 16 fps
- idle: 2 a 4 frames em loop lento

## Regras

- perna da frente legivel
- perna de tras empurra
- braco oposto acompanha
- cabeca quase estavel
- tronco com pouca oscilacao
- diagonal nao pode ser copia preguiçosa

## Idle

- 2 a 4 frames
- respiracao leve
- micro ajuste de postura
- nada de pulo fake

## Padrao recomendado para a PubPaid

- player: 8 direcoes x 4 frames walk + idle por direcao
- NPC andando: 8 direcoes x 3 frames
- NPC parado: 2 a 4 frames idle especifico
