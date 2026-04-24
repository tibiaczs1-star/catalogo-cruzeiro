# Agente 03 - Pipeline de Arte para Jogo

Status:

- consolidado a partir da primeira rodada
- observacao honesta do agente: sem acesso interno confiavel a playlist nesta sessao

## Ferramentas recomendadas

- Aseprite para pixel art e animacao
- LibreSprite como alternativa
- Photoshop para composicao/revisao
- Phaser para integracao

## Regras do pipeline

1. nada procedural para personagem final
2. tudo vivo deve nascer como PNG bitmap real
3. definir escala-mae antes de produzir lote
4. animar somente depois da sprite base aprovada
5. integrar no Phaser so depois de validar no fundo real

## Escalas recomendadas

- humanos principais: 32x48
- humanos detalhados: 48x64 se necessario
- animais pequenos: 24x24 ou 24x32
- carro pequeno: 48x24
- carro medio: 64x32
- moto: 32x24

## Regras de exibicao

- desenhar pequeno
- ampliar em escala inteira
- nunca usar escala quebrada
- manter pixel perfect

## Ordem de producao

1. listar assets
2. aprovar silhueta
3. aprovar cor base
4. fazer sombra/volume
5. revisar outline
6. animar
7. exportar
8. integrar

## Estrutura de pastas recomendada

```text
assets/pubpaid/art-src/
assets/pubpaid/sprites/
assets/pubpaid/sheets/
assets/pubpaid/scenes/
```

## Convencao de nome

`area_categoria_nome_variacao_estado_tamanho_v01`

## Checklist de aprovacao

- silhueta clara
- escala correta
- nao parece procedural
- nao parece vetor
- le bem no fundo real
- animacao nao treme
- nome e pasta corretos
