# PubPaid 2.0 - Exemplos de Interface que Casam com o Projeto

Objetivo: definir exemplos de UI antes de implementar HUDs, menus e paineis no jogo.

Regra principal:

- a interface deve parecer parte do PubPaid
- nao pode parecer dashboard, site, Canva ou app moderno colado
- centro da tela precisa ficar livre para o jogo
- UI sempre menor que a porta, o letreiro e a cena
- texto curto, pixelado, direto

## Direcao visual

Materiais:

- vidro escuro molhado
- borda fina de latao envelhecido
- brilho pequeno ciano/magenta
- fundo quase preto com ruido pixelado
- highlights ambar para a parte do bar

Tipografia:

- titulo com serif/pixel dramatico apenas em telas grandes
- textos pequenos em fonte monoespacada/pixel legivel
- nada de fonte futurista generica

Paleta:

- fundo: azul-preto / violeta escuro
- borda: dourado queimado / latao
- acento frio: ciano
- acento quente: ambar
- alerta: magenta controlado

## Exemplo 1 - HUD minimo de rua

Uso: enquanto o jogador anda na rua.

Componentes:

- canto superior esquerdo: dinheiro/credito pequeno
- canto superior esquerdo abaixo: status local, exemplo `RUA - CHUVA`
- rodape esquerdo: botao pequeno de som
- centro livre
- prompt contextual aparece perto da porta: `ENTRAR`

Nao usar:

- barra grande no topo
- cards enormes no rodape
- lista permanente de controles

## Exemplo 2 - Prompt da porta

Uso: quando o jogador chega na porta do pub.

Visual:

- chip pequeno acima ou ao lado da porta
- borda ambar fina
- fundo preto translúcido
- texto curto: `ENTRAR`
- subtexto opcional: `aperte E`

Movimento:

- pisca suave em 2 frames
- nao fica pulando

## Exemplo 3 - Menu de pausa

Uso: pausa / inventario / configuracoes.

Visual:

- painel central estreito, nunca tela cheia opaca
- moldura de latao
- fundo de vidro escuro
- opcoes em lista vertical:
  - continuar
  - mapa
  - inventario
  - ajustes
  - sair

Regra:

- a cena deve continuar aparecendo atras escurecida
- sem cards dentro de cards

## Exemplo 4 - Diario / missoes

Uso: objetivos, pistas e historia.

Visual:

- gaveta lateral direita
- abas pequenas: `OBJ`, `NOTAS`, `MAPA`
- papel escuro ou couro velho, nao app branco
- textos curtos

Exemplo:

- `Entrar no PubPaid pela porta principal`
- `A rua esta viva, mas o bar chama mais`

## Exemplo 5 - Dialogo

Uso: NPCs e interacoes.

Visual:

- caixa baixa no rodape, ocupando no maximo 35% da largura em desktop
- retrato pequeno opcional apenas se for bitmap aprovado
- nome em ambar
- fala em branco quente

Movimento:

- type-in curto
- pode pular texto
- nada de caixa gigante cobrindo personagem

## Exemplo 6 - Interface interna do bar

Uso: dentro do pub.

Componentes:

- ficha de mesa/jogo como painel pequeno
- contador de aposta ou rodada em chip ambar
- botoes de acao como placas pequenas:
  - jogar
  - pagar
  - sair

Visual:

- mais quente que a rua
- madeira escura, latao e luz de bar
- menos ciano, mais ambar

## Exemplo 7 - Mapa simples

Uso: mapa do local.

Visual:

- mini-mapa so quando aberto
- desenho pixelado das zonas:
  - porta
  - calcada
  - rua
  - ponto de onibus
  - arcade
  - beco
  - bar interno

Regra:

- nao precisa detalhar tudo
- serve para orientar, nao para virar UI principal

## Exemplo 8 - Tela inicial

Uso: entrada do jogo.

Visual:

- usar a propria imagem do PubPaid ao fundo
- placa escura com borda latao
- texto grande: `ENTER GAME`
- subtexto pequeno: `clique ou aperte enter`

Regra:

- nao desenhar menu por cima da porta sem necessidade
- o botao deve parecer placa do bar, nao botao web

## Checklist

Uma UI passa se:

- a rua/bar continuam sendo protagonistas
- funciona em desktop e mobile
- texto cabe sem quebrar feio
- parece parte do mundo PubPaid
- nao cobre a porta
- nao cobre o personagem
- nao parece Canva
- nao parece dashboard
- nao parece placeholder

