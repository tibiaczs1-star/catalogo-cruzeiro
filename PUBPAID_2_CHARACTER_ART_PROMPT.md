# PubPaid 2 - Prompt Oficial de Personagens

Atualizado: 2026-05-07

Este e o contrato operacional para criar ou reavaliar personagens, pedestres e figurantes humanos da PubPaid 2. Nenhum personagem novo entra no runtime final antes de aparecer em HTML simples de aprovacao e receber aprovacao humana explicita.

O prompt master em ingles fica preservado em `PUBPAID_V2_NPC_PIXEL_ART_MASTER_PROMPT.md`. Se houver conflito, a regra mais exigente vence.

## Objetivo

Criar personagens e pedestres 2D em pixel art 32 bits para enfeitar ruas, interiores, bares, delegacias, lojas e ambientes urbanos.

Eles precisam parecer naturais no jogo, como se tivessem sido feitos pelo mesmo artista, para o mesmo universo visual e com o mesmo nivel de detalhe, contraste, paleta e proporcao dos cenarios existentes.

## Regras absolutas

- Nao usar Canvas.
- Nao usar arte procedural.
- Nao usar geracao procedural.
- Nao gerar personagens por formas automaticas, vetoriais, filtros ou montagem generica.
- Nao usar animacao procedural.
- Nao usar interpolacao, auto inbetweening, tweening ou runtime animation para inventar frames.
- Nao usar bonecos placeholder.
- Nao usar personagem cartoon generico fora do estilo.
- Nao criar personagem que pareca de outro jogo.
- Nao usar sprite liso, moderno, 3D, semi-3D ou vetorizado.
- Tudo deve ser pixel art 2D estilo 32 bits.
- Tudo deve ser desenhado como sprite manual, com pixels intencionais.
- A arte deve casar com o cenario existente.
- Cada frame precisa parecer desenhado por um artista senior de pixel art, nao corrigido por filtro.

## Estilo obrigatorio

- Proporcoes semi-realistas, nao chibi exagerado.
- Cabeca, tronco, bracos e pernas proporcionais ao cenario.
- Sombras em blocos de pixels, sem blur.
- Luz e sombra consistentes com o ambiente.
- Paleta limitada e controlada.
- Contorno escuro limpo.
- Anti-aliasing manual em pixel art, sem suavizacao automatica.
- Volume por clusters de pixels, nao gradiente liso.
- Roupas com detalhes legiveis, sem ruido excessivo.
- Silhueta clara e reconhecivel.
- Visual urbano, natural e compativel com pedestres de rua.

## Analise obrigatoria antes de criar

Comparar contra as referencias e contra o cenario real:

- escala dos personagens existentes;
- tamanho da cabeca em relacao ao corpo;
- largura dos ombros;
- comprimento dos bracos;
- comprimento das pernas;
- espessura do contorno;
- quantidade de cores por personagem;
- nivel de sombreamento;
- direcao da luz;
- contraste;
- resolucao aparente dos pixels;
- estilo de rosto;
- estilo de cabelo;
- estilo de roupas;
- acabamento dos sprites.

O personagem nao pode parecer colado por cima do cenario.

## Tipos de personagens

Criar variacao urbana sem caricatura exagerada:

- homem comum andando;
- mulher comum andando;
- idoso;
- jovem;
- trabalhador;
- policial;
- atendente;
- morador de rua;
- pessoa com mochila;
- pessoa usando casaco;
- pessoa com roupa social;
- pessoa casual;
- figurantes para bar, loja, recepcao, praca, calcada ou delegacia.

## Animacao de andar

Todo pedestre de rua que anda precisa ter 5 ciclos completos de caminhada, nao apenas 5 frames.

Pacote minimo por pedestre andando:

- ciclo relaxado;
- ciclo apressado;
- ciclo cansado;
- ciclo confiante;
- ciclo distraido usando celular ou olhando para baixo.

Cada ciclo deve ter locomocao humana legivel. O padrao de entrega para cada ciclo e uma linha de 5 frames manuais, totalizando 25 frames por pedestre lateral quando a arte for aprovada para producao.

Dentro de cada ciclo de 5 frames:

1. pose neutra inicial;
2. uma perna avancando e o braco oposto acompanhando;
3. passagem do corpo pelo centro;
4. outra perna avancando e braco oposto acompanhando;
5. retorno fluido para loop.

A animacao precisa mostrar:

- perna apos perna;
- balanco natural dos bracos;
- leve movimento do tronco;
- leve variacao vertical da cabeca/corpo;
- pes alternando corretamente no chao;
- sensacao real de peso;
- sem deslizamento;
- sem pernas grudadas;
- sem caminhada robotica;
- sem moonwalk;
- sem personagem flutuando.
- sem pernas espelhadas como atalho;
- sem copy-paste de pernas/bracos sem correcao manual;
- sem smear ou blur de movimento.

## Direcoes

Quando necessario, criar:

- frente;
- costas;
- lado esquerdo;
- lado direito.

Para pedestres de rua, priorizar caminhada lateral em 5 ciclos completos.

## Recorte e limpeza

O sprite deve estar pronto para engine:

- fundo transparente real;
- sem mancha branca;
- sem mancha verde;
- sem borda de recorte;
- sem pixel solto fora do personagem;
- sem halo claro;
- sem serrilhado sujo;
- sem sombra externa artificial;
- sem contaminacao de cor do fundo.

O contorno deve ser desenhado manualmente com pixels escuros compativeis com a paleta do personagem.

## Formato do spritesheet

Cada personagem deve ser entregue em spritesheet:

- todos os frames alinhados na mesma linha;
- cada frame com a mesma largura e altura;
- personagem centralizado em cada celula;
- pes na mesma linha de chao;
- espacamento uniforme;
- fundo transparente;
- sem elementos extras;
- sem texto;
- sem marca d'agua;
- sem grade visivel na versao final.

Formato padrao para pedestre lateral em producao:

```text
[relaxed_01]    [relaxed_02]    [relaxed_03]    [relaxed_04]    [relaxed_05]
[hurried_01]    [hurried_02]    [hurried_03]    [hurried_04]    [hurried_05]
[tired_01]      [tired_02]      [tired_03]      [tired_04]      [tired_05]
[confident_01]  [confident_02]  [confident_03]  [confident_04]  [confident_05]
[distracted_01] [distracted_02] [distracted_03] [distracted_04] [distracted_05]
```

## Escala padrao PubPaid 2

- Pedestre de calcada: 96x144 por frame.
- Pedestre lateral de producao: 480x720 por spritesheet quando usar 5 ciclos x 5 frames em celulas 96x144.
- Adulto primeiro plano: 105 a 130 px renderizados.
- Adulto meio plano: 75 a 100 px renderizados.
- Fundo: 50 a 75 px renderizados.
- Pe no baseline row 139 quando a celula for 96x144.
- Alpha final apenas 0 ou 255 para personagem, veiculo e objeto de mundo.

## Checklist de aprovacao

Antes de finalizar, responder sim:

1. O personagem esta realmente em pixel art 2D 32 bits?
2. Parece pertencer ao mesmo jogo das referencias?
3. A escala combina com o cenario?
4. O contorno esta limpo?
5. A paleta combina com os exemplos?
6. A animacao de andar tem 5 ciclos completos, e cada ciclo tem frames manuais reais?
7. As pernas alternam corretamente?
8. Os bracos acompanham o movimento?
9. Nao existe fundo, halo, mancha branca, mancha verde ou pixel solto?
10. O sprite esta pronto para uso em engine de jogo?

Se qualquer item falhar, refazer antes de pedir aprovacao.

## Entrega obrigatoria

Sempre entregar primeiro em HTML simples de aprovacao.

O HTML deve mostrar:

- spritesheet completo;
- frame 1 isolado em tamanho 1x e 2x;
- comparacao contra o protagonista;
- comparacao contra o cenario da rua ou interior correspondente;
- quando houver caminhada, uma tabela com os 5 ciclos e seus frames;
- status de aprovacao;
- lista curta do que ainda precisa refazer.

Depois da aprovacao humana explicita, a integracao no runtime deve ser minima: carregar PNG/spritesheet, posicionar e animar. Nenhuma arte final pode ser desenhada pelo runtime.
