# PubPaid 2.0 Visual Scale Guide

Base canvas: 1280x720.

## Target Style

Pixel art bitmap semi-realista, coerente com o garçom/lobby. Nada de chibi, boneco cabeçudo, sprite procedural visível ou PNG gigante usado fora de contexto.

## World Scale

- Porta externa do pub: 190-220 px de altura visual.
- Adulto em pé, foreground/gameplay: 105-130 px.
- Adulto em pé, midground: 75-100 px.
- Adulto em pé, background: 50-75 px.
- Personagem sentado: 55-85 px.
- Garçom guia:
  - lobby/UI: 140-190 px se estiver claramente como guia.
  - dentro do mundo: max 130 px.
- Carro lateral: 170-240 px de largura.
- Moto lateral: 100-150 px de largura.
- Cachorro: 28-45 px.

## Asset Rules

- Todo personagem final deve ser PNG bitmap com fundo transparente.
- O canvas do PNG deve ser justo ao personagem, sem pernas/corpo gigante cortado fora de escala.
- Código pode posicionar, trocar frames e animar; não deve desenhar arte final.
- Sprites procedurais ficam apenas como marcador temporário/debug.
- Todo sprite precisa ter base dos pés clara, sombra compatível e luz ambiente coerente.
- Não misturar pixel densities. Se o sprite parece mais ampliado que o cenário, ele volta para revisão.

## Current Policy

- Manter menos elementos na tela enquanto o pack aprovado de sprites não existe.
- Reintroduzir vida na rua e no bar somente com assets aprovados.
- Primeiro coerência; depois densidade.
