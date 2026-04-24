# PubPaid 2.0 - Reuniao de Direcao

Data: 2026-04-24

## Diagnostico honesto

A rodada atual nao esta passando a sensacao de jogo. A base tecnica existe, mas a experiencia ainda parece um prototipo com camadas coladas por cima da arte.

O problema principal nao e so um bug na porta. A direcao visual e de interacao ficou dividida entre:

- cena bitmap bonita;
- personagens reaproveitados sem linguagem comum;
- hotspots/HUD com cara de ferramenta;
- fluxo de entrada pouco intuitivo;
- intro nova menos forte que a antiga.

## Decisao da reuniao

Parar de remendar a versao atual da rua.

A PubPaid 2.0 deve voltar para uma direcao mais cinematica e jogavel, usando a intro antiga como referencia emocional, mas com um fluxo simples:

```text
Intro forte -> clique/tecla -> porta do pub -> salao -> garcom -> escolher jogo
```

Nada de agentes dentro do jogo. Agentes ficam como bastidor do projeto, nao como UI, lore ou texto da PubPaid.

## O que fica

- `pubpaid-v2.html` como entrada oficial.
- Phaser como runtime principal.
- `pubpaid-phaser/` como base modular.
- UI DOM para Dardos/Dama, desde que fique com cara de jogo.
- Fundos bitmap da fachada/salao/lobby, mas com ajustes de fluxo.
- Dardos e Dama como primeiros jogos.

## O que deve sair ou ficar escondido

- Quadros grandes de hotspot sobre a arte.
- Texto tecnico em cima da rua.
- Google Port como placa visual na rua.
- Link/botao de agentes dentro da tela da PubPaid.
- Personagens gerados de uma unica base parecendo clones.
- Veiculos/cachorro provisórios que nao combinam.
- Intro nova se ela estiver mais fraca que a antiga.

## Problemas vistos pelo usuario

1. A porta certa esta clara na imagem, mas o jogo nao faz a entrada parecer natural.
2. O player fica parado na porta e nao atravessa com confianca.
3. As variacoes de personagens parecem iguais na pratica.
4. Falta rua viva: carros, luz, efeitos, gente passando, barulho e profundidade.
5. A experiencia ainda nao parece jogo.
6. A intro antiga tinha mais impacto.

## Direcao nova para a porta

A porta deve ser um objeto de gameplay, nao um hotspot visivel.

Comportamento correto:

- Player clica na porta.
- Player caminha ate o tapete.
- Porta acende/abre.
- Tela faz transicao curta.
- Entra no salao.

Fallback obrigatorio:

- Se clicar duas vezes na porta, entra direto.
- Se apertar Enter perto da porta, entra direto.
- Se o player estiver em cima do tapete por 0,5s, entra direto.

## Direcao nova para personagens

Nao basta recolorir roupa. Precisa de silhuetas diferentes.

Pacote minimo:

- player masculino casual;
- player feminino casual;
- cliente de casaco;
- cliente de vestido;
- cliente sentado;
- seguranca/porteiro;
- garcom;
- cantora;
- bartender.

Cada um precisa ter pelo menos:

- idle;
- walk lateral;
- sombra coerente;
- escala de mundo travada.

## Direcao nova para rua

A rua precisa parecer viva antes do jogador entrar:

- chuva/reflexo mais forte;
- taxis/carros passando no fundo;
- moto ou bicicleta no midground;
- pessoas atravessando perto do bar;
- luz piscando no letreiro;
- porta com brilho quente;
- som ambiente curto;
- nenhum retangulo de debug visivel.

## Intro

Comparar a intro antiga com a atual antes de avançar.

Se a antiga for mais forte:

- restaurar a estrutura emocional da antiga;
- manter apenas melhorias tecnicas da nova;
- fazer a intro terminar apontando naturalmente para a porta do pub.

## Sprint proposto

### Sprint 1 - Jogabilidade da porta

- Remover qualquer hotspot visual.
- Ajustar coordenada da porta com base no bitmap real.
- Criar rotina `enterDoor()` unica.
- Fazer clique/duplo clique/Enter/tapete entrarem no salao.
- Adicionar transicao visual curta da porta.

### Sprint 2 - Rua viva

- Criar sprites dedicados, nao clones recoloridos.
- Reintroduzir pedestres com walk real.
- Reintroduzir veiculos so se combinarem com a arte.
- Melhorar reflexos/luzes sem cobrir a fachada.

### Sprint 3 - Intro

- Rever intro antiga.
- Escolher a melhor versao.
- Ligar intro diretamente na rua/porta.

### Sprint 4 - Salao e jogos

- Salão vira hub simples.
- Garçom abre escolha de jogo.
- Dardos e Dama entram com UI de jogo, nao painel tecnico.

## Ordem para a proxima sessao

Comecar pela porta, nao pelos personagens.

Motivo: se o jogador nao consegue entrar no bar, todo o resto parece quebrado.

Proxima ordem recomendada:

```text
PubPaid 2.0: refazer fluxo da porta com base na imagem real, sem hotspot visivel, com clique direto, Enter perto da porta e transicao para o salao.
```

Depois disso:

```text
Criar pacote novo de personagens com silhuetas diferentes e animacao real, nao recolor de clone.
```

## Conclusao

A PubPaid 2.0 ainda tem potencial, mas precisa voltar a ser dirigida como jogo, nao como pagina interativa.

Decisao final da reuniao:

- Jogo separado de agentes.
- Porta primeiro.
- Intro antiga como referencia.
- Personagens com silhueta real.
- Rua viva antes de adicionar mais sistemas.
