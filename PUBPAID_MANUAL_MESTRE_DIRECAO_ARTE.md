# PubPaid 2.0 - Manual Mestre de Direcao de Arte

Este documento consolida o nucleo de estudo dos 19 agentes de arte da PubPaid 2.0.

## Regra central

A PubPaid 2.0 deve parecer um unico jogo.

Tudo que entrar precisa obedecer:

- pixel art bitmap real
- leitura forte
- escala coerente
- silhueta aprovada
- paleta noturna controlada
- integracao no fundo real
- zero cara procedural

Melhor uma rua temporariamente vazia do que uma rua cheia de assets incoerentes.

## Identidade visual

A linguagem base e:

- urbano noturno
- pub adulto
- neon ciano/magenta controlado
- interior quente
- rua fria e molhada
- tijolo, madeira, metal, vidro e asfalto com leitura clara
- clima vivo por luz, reflexo, vapor e profundidade

## Hierarquia visual

Ordem de importancia na rua:

1. porta do pub
2. letreiro PubPaid
3. fachada central
4. calcada jogavel
5. rua de transito
6. ponto de onibus
7. arcade
8. beco
9. NPCs, veiculos e animais

Nenhum asset novo pode quebrar essa ordem.

## Protocolo anti-procedural

Todo asset novo passa por:

1. teste de silhueta
2. teste de escala
3. teste de paleta
4. teste de material
5. teste no fundo real
6. teste de animacao
7. aprovacao ou rejeicao

Se parecer bloco, placeholder, vetor, IA crua ou outro jogo, sai.

## Escala oficial

- humano base: 32x48
- humano detalhado: 48x64 somente se necessario
- animal pequeno: 24x24
- carro: 64x32
- moto: 48x24
- props pequenos: multiplos de 8
- grid: 8x8
- export final: PNG
- source mestre: .aseprite

## Ordem certa de producao

1. estudar referencia
2. definir funcao do asset
3. criar silhueta
4. validar no fundo real
5. aplicar cor base
6. revisar material/luz
7. animar se necessario
8. exportar
9. integrar no Phaser
10. validar no navegador
11. registrar no nucleo

## Rua

A rua precisa ler em tres faixas:

- fundo/cidade/fachadas
- calcada jogavel
- rua de transito

Vida da rua vem primeiro de:

- luz do letreiro
- janelas ao fundo
- reflexo no asfalto
- vapor/fumaca discreta
- beco com luz baixa

NPCs, carros e animais entram depois de aprovados como bitmap real.

## Bar

O bar deve ter zonas claras:

- entrada
- circulacao principal
- balcao
- mesas
- palco
- arcade

O centro precisa respirar. Props e personagens nao podem bloquear leitura de movimento.

## Personagens

Personagem aprovado precisa ter:

- silhueta forte
- gesto/postura com intencao
- proporcao coerente
- roupa integrada ao corpo
- clusters limpos
- paleta contaminada pela luz da cena

Proibido:

- corpo-retangulo
- perna-poste
- variacao apenas por cor
- mesma cabeca em todos
- animacao tentando salvar desenho ruim

## Animacao

Player ideal:

- 8 direcoes
- 4 frames por direcao para walk
- idle por direcao com 2 a 4 frames

NPC parado:

- 2 a 4 frames
- respiracao discreta
- microgesto especifico

Veiculos:

- rodas com 2 ou 3 frames
- deslocamento lateral
- sem deformacao falsa

Animacao boa tem peso. Pulo fake nao entra.

## Cor e luz

Paleta:

- base fria: azul, indigo, violeta, chumbo
- acento quente: ambar, dourado queimado, laranja suave
- neon: ciano e magenta em pontos chave
- sombra: colorida, nunca preto puro
- letreiro: pico de brilho e saturacao

## Materiais

Cada material precisa ler diferente:

- madeira: pesada, quente, pouco veio
- metal: highlight duro e pequeno
- vidro: reflexo + transparencia parcial
- neon: forma forte + halo controlado
- concreto: textura baixa e silenciosa
- tijolo: ritmo e desgaste controlado
- asfalto molhado: reflexo quebrado e alongado
- vapor: massa suave, sem outline dura

## UI visual

A UI deve parecer parte do jogo, nao app moderno colado.

Regras:

- HUD minima
- mensagens curtas
- botoes pixelados simples
- tags pequenas
- baloes raros e rapidos
- nada de overlay gritante sobre a rua

## Checklist de aprovacao

Antes de entrar no jogo:

- le em 1 segundo?
- funciona em silhueta?
- respeita escala?
- respeita a porta e o letreiro?
- combina com a noite da cena?
- nao parece procedural?
- nao parece placeholder?
- nao parece outro jogo?
- foi testado no fundo real?
- tem source salvo?

## Skills e ferramentas

Skills principais:

- imagegen
- game-studio:sprite-pipeline
- game-studio:phaser-2d-game
- game-studio:game-playtest
- game-studio:game-ui-frontend
- develop-web-game
- browser-use:browser
- playwright
- playwright-interactive
- frontend-skill

Ferramentas locais:

- apply_patch
- shell_command
- view_image
- node --check
- .codex-memory

## Fluxo de treino

Toda rodada deve:

1. estudar uma fonte
2. pesquisar fontes externas
3. extrair regras
4. produzir microteste
5. validar no jogo
6. aprovar/rejeitar
7. registrar aprendizado

## Plano continuo de treinamento

### Hoje

- ler os arquivos vivos dos agentes
- travar as regras soberanas
- criar treino curto de silhuetas e micro-assets
- nao integrar nada novo no runtime sem aprovacao

Fila curta de treino:

- 3 silhuetas de NPC de rua
- 2 props de calcada
- 1 estudo de carro 64x32
- 1 estudo de gato 24x24
- 1 estudo de balao UI

### Esta semana

Rotina diaria:

1. estudar 1 trecho da playlist ou material equivalente
2. pesquisar 2 fontes externas
3. extrair 5 regras praticas
4. treinar uma skill/ferramenta
5. criar ou revisar uma micro-entrega
6. testar no fundo real
7. registrar aprovacao, rejeicao ou retrabalho

Distribuicao:

- dia 1: silhueta, escala e proporcao
- dia 2: cor, luz e materiais
- dia 3: props e ambientacao
- dia 4: personagens estaticos
- dia 5: veiculos, animais e animacao minima
- dia 6: UI visual, baloes e tags
- dia 7: integracao experimental em cena teste

### Padrao permanente

Toda entrega segue:

```text
Fonte estudada -> Regra extraida -> Exercicio -> Asset teste -> Validacao -> Padrao ou rejeicao
```

Nada entra direto no jogo final. Primeiro entra em avaliacao.

## Avaliacao visual

Toda entrega visual recebe nota de 0 a 3 em:

- silhueta
- escala
- leitura no fundo real
- consistencia com a noite urbana
- cor/luz
- material
- limpeza de clusters
- animacao/timing
- nao-proceduralidade
- respeito ao foco da porta/letreiro

Decisao:

- 0: rejeitado
- 1: precisa redesenhar
- 2: quase aprovado, ajustar
- 3: aprovado para teste no runtime

Um asset so entra no jogo quando tiver:

- media minima 2.5
- nota 3 em nao-proceduralidade
- nota 3 em escala
- nota 3 em leitura no fundo real

## Producao em lote

So produzir lote depois de:

- escala oficial validada
- paleta validada
- materiais validados
- silhuetas aprovadas
- checklist aplicado
- teste no navegador

## Decisao executiva

A PubPaid 2.0 so deve voltar a receber personagens, carros e animais quando eles obedecerem ao nucleo de arte.

A proxima etapa recomendada e um lote piloto pequeno:

1. uma prop de rua
2. uma placa/UI pequena
3. um estudo de material
4. um NPC parado em silhueta
5. um veiculo em silhueta

Cada item deve ser testado no fundo real antes de qualquer expansao.
