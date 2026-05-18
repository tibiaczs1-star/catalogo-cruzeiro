# Correio do Jurua: Rua Viva

## Entrega do Diretor do Jogo

Este documento e uma entrega de pre-producao. Ele existe para evitar outro
prototipo com cara de cubos genericos. A regra e arte primeiro, runtime depois.

## Promessa

Um jogo 2D/2.5D de uma fase onde uma pessoa de rua do Correio do Jurua atravessa
uma quadra viva para entregar/apurar uma informacao antes da chuva apertar. O
jogo deve parecer um pequeno diorama pixel art: fachadas, placas, calcada,
barracas, poças, postes, radio local, luz quente e personagens com presenca.

O jogador deve sentir:

- lugar: uma rua especifica, nao um labirinto abstrato;
- missao: entregar/apurar algo simples, mas importante;
- movimento: caminhar, desviar, pegar atalhos e ler a rua;
- cuidado: nao trombar, nao molhar a encomenda, nao se perder;
- recompensa: chegar na porta final e ver a rua reagir.

## Escopo Da Primeira Entrega

- 1 tela de loading.
- 1 intro curta.
- 1 fase unica.
- 1 personagem jogavel.
- 1 objetivo principal.
- 1 tipo de obstaculo movel.
- 1 tipo de obstaculo ambiental.
- 3 itens coletaveis opcionais.
- 1 tela de vitoria.
- 1 tela de falha.

Nada de loja, PvP, carteira, aposta, ranking, mundo aberto ou varias fases nesta
primeira entrega.

## Estilo Visual

### Direcao

Pixel art 2D com volume 2.5D falso. A camera e top-down baixa, como um diorama
de rua. Os objetos tem frente/lateral simples, sombra curta e leitura clara. A
base visual segue o caminho chibi realista: personagens compactos, rosto
expressivo e proporcao util para animacao, mas com luz, roupa e presenca menos
infantil.

O estilo deve ficar entre:

- pixel art limpa;
- forma chibi funcional;
- volume de brinquedo/diorama;
- luz regional quente;
- detalhes poucos, mas intencionais.
- rua amazonica urbana inspirada, nao copia literal.

### O Que Evitar

- cubos sem identidade;
- labirinto abstrato;
- personagem quadrado sem rosto;
- props genericos sem funcao;
- UI azul/cinza padrao;
- textura demais parecendo IA filtrada;
- pixel art fake com blur;
- arte bonita que nao vira sprite jogavel.
- UI com cara de portal de noticia ou dashboard administrativo;
- mistura indevida com site/CZS/editorial publico sem pedido explicito.

### Paleta Base

- Ceu/ambiente: azul-rio `#24384a`, azul noite leve `#182634`.
- Rua/calçada: concreto quente `#5f6f75`, asfalto umido `#34414a`.
- Luz: amarelo de poste `#f0c85a`, laranja comercio `#d98236`.
- Vegetacao: verde umido `#4f9b58`, verde escuro `#2f6241`.
- Personagem: camisa clara `#f7d86a`, mochila/colete vermelho `#c84f4f`.
- Encomenda/pauta: papel kraft `#c99355`, fita/selo azul `#4277a8`.
- Perigo/boato/erro: vermelho seco `#d94f4f`, roxo sombra `#5b456f`.

### Shape Language

- Personagem: cabeca levemente maior, corpo compacto, mochila/caderneta
  reconhecivel, pose ativa.
- Casas: blocos retangulares irregulares, telhados baixos, fachadas coloridas,
  portas altas.
- Obstaculos: formas diagonais ou pontudas quando bloqueiam.
- Coletaveis: formas pequenas com brilho quadrado simples.
- Saida: porta verde iluminada ou varanda com luz quente.

## Personagem Principal

Nome de trabalho: Lia.

Silhueta:

- baixa e compacta;
- mochila grande nas costas;
- boné ou cabelo simples;
- encomenda pequena na mao;
- pernas curtas, leitura forte de passos.

Sprites necessarios para a primeira entrega:

- idle south;
- walk south 4 frames;
- walk north 4 frames;
- walk east 4 frames;
- walk west 4 frames;
- hit/stumble 2 frames;
- delivery pose 2 frames.

Regra tecnica:

- grade nativa;
- celula fixa;
- pe ancorado;
- sem blur;
- export PNG lossless;
- manifest com nomes previsiveis.

## Fase Unica

Nome: Rua da Chuva.

Formato:

- canvas 16:9;
- mapa jogavel com percurso em S leve;
- visual de rua, nao labirinto;
- uma rota principal e dois microatalhos;
- porta final visivel desde cedo, mas nao diretamente acessivel.

Composicao:

- primeiro terco: introduz movimento e coleta;
- segundo terco: obstaculo movel;
- terceiro terco: chuva/poças e entrega final.

Camadas visuais:

1. fundo/chao;
2. marcas da rua e calçada;
3. props baixos;
4. personagens/obstaculos;
5. fachadas/foreground parcial;
6. chuva/particulas;
7. HUD;
8. overlay de intro/vitoria/falha.

Camadas de colisao:

- walls: fachadas, bancas, postes, caixas grandes;
- soft blockers: poças, lama, area molhada;
- triggers: coleta, porta final, aviso de chuva;
- enemy patrol: cachorro/brinquedo/carrinho passando;
- debug: hitboxes visiveis apenas em modo teste.

## Obstaculos

### Obstaculo Movel

Carrinho de feira atravessando a rua.

- movimento horizontal previsivel;
- aviso visual antes de cruzar;
- colisao reduz vida/tempo;
- nao deve parecer inimigo agressivo, mas elemento da rua.

### Obstaculo Ambiental

Poças de chuva.

- nao matam;
- reduzem velocidade;
- molham a encomenda se ficar tempo demais;
- criam decisao de rota.

## HUD E Interface

O HUD deve parecer etiqueta de entrega, nao painel generico.

Elementos:

- tempo ate a chuva apertar;
- encomenda seca/molhada;
- pacotes extras coletados;
- mini objetivo curto;
- feedback transitorio no centro baixo.

Loading:

- mostra uma rua se montando em camadas;
- texto curto: "separando rua", "marcando colisao", "chamando Lia".

Intro:

- Lia recebe a encomenda;
- camera mostra a porta final;
- uma frase: "Entrega antes da chuva."

Vitoria:

- porta abre, luz quente, Lia entrega;
- resumo: tempo, extras, encomenda seca/molhada.

Falha:

- chuva fecha a rua ou encomenda molha demais;
- botao reiniciar claro.

## Game Feel

- passo com oscilacao de 1 px;
- poeira leve em piso seco;
- splash pequeno em poca;
- micro shake quando tromba;
- som de coleta curto;
- som de porta ao finalizar;
- feedback visual imediato antes de qualquer validacao mais pesada;
- camera fixa com leve respiro, sem seguir demais.

## Regras De Jogo

Objetivo:

- chegar a porta final com a encomenda.

Condicoes:

- coletaveis aumentam avaliacao, mas nao sao obrigatorios;
- poças reduzem velocidade e aumentam nivel de molhado;
- obstaculo movel tira tempo ou vida;
- se tempo acaba, falha;
- se molhado chega ao limite, falha parcial ou avaliacao baixa.

Primeira versao deve preferir falha simples:

- tempo acaba: perdeu;
- 3 trombadas: perdeu;
- chegou na porta: venceu.

## Arquitetura Para Implementar Depois

Estados:

- `loading`;
- `intro`;
- `playing`;
- `paused`;
- `win`;
- `lose`.

Sistemas:

- input;
- player movement;
- tile/map collision;
- triggers;
- patrol obstacle;
- collectibles;
- HUD;
- particles/audio feedback;
- telemetry;
- debug collision overlay.

Padroes:

- state machine para tela e acoes;
- data-driven map;
- separacao visual/collision;
- event queue para HUD/audio/particles;
- object pool para gotas/particulas;
- render_game_to_text para QA automatizado;
- advanceTime para teste deterministico.

## Lista De Assets

Personagem:

- `lia_idle_south.png`
- `lia_walk_south.png`
- `lia_walk_north.png`
- `lia_walk_east.png`
- `lia_walk_west.png`
- `lia_hit.png`
- `lia_deliver.png`

Cenario:

- chao rua;
- calcada;
- parede/fachada 1;
- parede/fachada 2;
- porta final iluminada;
- poste;
- banca;
- caixa;
- vegetacao pequena;
- poca.

UI:

- etiqueta HUD;
- icone tempo;
- icone encomenda;
- icone pacote extra;
- botao reiniciar;
- tela loading em camadas.

FX/audio:

- passo seco;
- splash;
- coleta;
- trombada;
- porta;
- chuva leve.

## Agentes Responsaveis

Diretor do Jogo:

- protege escopo, aprova criterio visual e decide quando implementar.

Arte e Design:

- cria concept, style bible, sprites, tiles, props e paleta.

UI/HUD:

- cria etiqueta HUD, intro/loading/vitoria/falha no estilo da rua.

Mapeamento/Colisao/Game Feel:

- cria blockout, colisores, triggers, patrol e sensacao.

Teste e Seguranca:

- valida fluxo, colisao, estados, mobile, screenshot e render_game_to_text.

Linha Final:

- bloqueia se parecer cubos genericos ou prototipo sem direcao.

## Criterios De Aprovacao

Antes de codar:

- existe mockup visual da fase;
- Lia tem silhueta reconhecivel;
- a rua parece lugar, nao grade;
- HUD combina com o mundo;
- colisao esta planejada;
- assets tem lista e tamanho;
- estilo nao parece IA generica.

Antes de entregar jogavel:

- loading, intro, fase, vitoria e falha existem;
- colisao funciona;
- objetivo e claro;
- HUD informa sem poluir;
- feedback visual/sonoro responde;
- screenshot parece jogo com direcao;
- render_game_to_text descreve estado real;
- funciona em desktop e mobile landscape.
