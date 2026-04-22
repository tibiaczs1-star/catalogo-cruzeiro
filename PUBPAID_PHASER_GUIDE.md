# PubPaid Phaser Guide

Guia curto da equipe para migrar a PubPaid 2.0 para Phaser sem quebrar o que ja existe.

## Objetivo

Manter o site e a carteira em HTML/CSS/JS como hoje, mas mover o nucleo do jogo para uma engine 2D mais organizada.

## O que continua fora do Phaser

- login Google
- overlays editoriais
- paginas institucionais
- dashboard/admin
- carteira e painéis de deposito/saque

## O que entra no Phaser

- rua viva
- salao interno
- player e NPCs
- colisao
- zonas interativas
- camera
- transicao entre scenes
- tilemap e props do jogo

## Ordem segura de migracao

1. Criar laboratorio isolado em Phaser: `pubpaid-phaser-lab.html`
2. Validar rua viva com:
   - background
   - player
   - clique para mover
   - teclado
   - camera
   - primeira zona de porta
3. Extrair para Phaser a logica de scene da rua.
4. Criar `InteriorScene` separada.
5. Migrar props do salao.
6. So depois conectar matchmaking e carteira real.

## Arquitetura mental

- `BootScene`: preload e assets
- `StreetScene`: mapa externo
- `InteriorScene`: salao
- `UIScene`: HUD e overlays de jogo
- `services/`: carteira, auth, matchmaking, api
- `config/`: stakes, jogos, zonas, interacoes

## Tecnologias recomendadas

- Phaser para o jogo 2D
- Tiled para mapas/tilemaps
- Howler.js para audio
- Colyseus para multiplayer autoritativo

## Regra da equipe

Nao reescrever tudo de uma vez.
Primeiro provar uma scene boa em Phaser.
Depois migrar por camadas.
