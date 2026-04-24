# Agente 16 - Checklist Operacional de Producao

Status:

- consolidado a partir da terceira rodada
- observacao honesta do agente: sem acesso interno confiavel a playlist nesta sessao

## Antes de desenhar

- definir o asset
- definir a funcao na cena
- definir categoria
- definir tamanho-base
- definir se anima
- definir quantos frames
- definir camada
- definir se colide, decora ou interage
- validar hierarquia da cena

## Aprovacao de base

- silhueta funciona em preto
- proporcao funciona contra porta/calcada/ponto/arcade
- leitura funciona no fundo real
- nao parece procedural
- nao parece vetor
- nao parece placeholder
- nao compete com o letreiro

## Producao estatica

- massa grande primeiro
- detalhe depois
- clusters limpos
- paleta limitada
- luz e sombra coerentes
- salvar sempre a source antes do export

## Producao de animacao

- aprovar frame base antes
- idle sutil
- walk com transferencia de peso
- veiculo com roda legivel
- animal com silhueta estavel
- timing sem tremido

## Export

- source em .aseprite
- export PNG com transparencia
- sheet ou sequencia conforme caso
- nomes padronizados
- manter escala nativa
- nunca blur
- nunca JPG

## Integracao

- integrar so asset aprovado
- testar na cena real
- validar escala, profundidade e legibilidade
- rejeitar asset com cara procedural

## QA visual

- ficou bom parado?
- ficou bom em loop?
- continua legivel em 1 segundo?
- respeita o foco da porta?
- nao polui a rua?
- nao parece colado no fundo?

## Padrao de producao

- humanos: 32x48
- animais pequenos: 24x24
- carro: 64x32
- moto: 48x24
- grid: 8x8
- export final: PNG
- source mestre: .aseprite

## Checklist de rejeicao imediata

- corpo em bloco reto
- sprite diferente demais do fundo
- brilho para esconder desenho fraco
- contraste ruim
- animacao de pulo fake
- cluster quebrado
- escala inconsistente
- sem source
- so funciona ampliado
- IA crua sem curadoria

## Skills e ferramentas relevantes

- imagegen
- game-studio:sprite-pipeline
- game-studio:phaser-2d-game
- develop-web-game
- browser-use:browser
- playwright
- playwright-interactive
- frontend-skill
- view_image
- apply_patch
- shell_command
