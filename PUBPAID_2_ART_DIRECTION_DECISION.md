# PubPaid 2 - Decisao de Direcao de Arte

Atualizado: 2026-05-07

## Escopo desta rodada

Comecar a resolver a direcao de arte sem mexer no runtime final.

Arquivos que ficam intocados ate aprovacao humana explicita:

- `pubpaid-v2.html`
- `pubpaid-phaser.css`
- `pubpaid-phaser/`
- assets finais carregados por `BootScene`/`StreetScene`

Preview externo criado:

- `pubpaid-art-direction-preview.html`
- `pubpaid-character-approval.html`

Prompt oficial de personagens registrado:

- `PUBPAID_V2_NPC_PIXEL_ART_MASTER_PROMPT.md`
- `PUBPAID_2_CHARACTER_ART_PROMPT.md`

## Decisao inicial

O PubPaid 2 deve seguir a linha "arcade de bairro em noite chuvosa": pixel art 2D ate 32 bits, humanos proporcionais, rua neon ciano/magenta com luz ambar quente, sombras simples no chao e assets desenhados como parte do mesmo mundo.

O fundo da rua continua sendo a ancora visual principal. Personagens, trafego e UI precisam se submeter ao fundo, nao o contrario.

## Triage dos assets atuais

### Preservar como norte

- `assets/pubpaid-v2-street-bg-v1.png`
  - Forte em atmosfera, profundidade 2D, luz e identidade.
- `assets/pubpaid/ui/pubpaid-wallet-phone-ui-v2.png`
  - Bom caminho para UI: bitmap, reto, pixelado e com cara de objeto do jogo.
- `assets/pubpaid/traffic/pubpaid-pixel-vehicles-art-pass-8f-v1-preview.png`
  - Bom norte visual de trafego, mas ainda precisa virar pacote individual verificavel antes de qualquer integracao.

### Manter apenas como comparacao ou temporario

- `assets/pubpaid/sprites/protagonist/protagonist-final-3sheet-preview.png`
  - Serve para escala, baseline e leitura de proporcao.
- `assets/pubpaid/background/pubpaid-street-ambient-life-4f-v6.png`
  - Pode ser referencia de chuva/reflexo discreto, mas nao resolve direcao sozinho.
- `assets/pubpaid/sprites/street-civilians/arcade-controller-wall-idle-v1.png`
- `assets/pubpaid/sprites/street-civilians/arcade-token-wall-idle-v1.png`
- `assets/pubpaid/sprites/street-civilians/arcade-phone-wall-idle-v1.png`
  - Ideia boa para identidade arcade, mas precisa refazer props/corpo com desenho integrado.

### Nao aprovar como final

- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v28.png`
  - Mantido apenas como estado atual restaurado; nao deve ser chamado de trafego final.
- `assets/pubpaid/sprites/street-civilians/arcade-nerd-*-idle-v4.png`
  - Guardar so para comparacao. A leitura ainda e chapada demais para elenco final.
- civis atuais com props retangulares colados ao corpo
  - O corpo tem uma base aproveitavel, mas os acessorios precisam nascer dentro da silhueta.

## Proximo pacote antes do runtime

1. Criar pacote de NPCs de calcada fora do jogo:
   - 96x144 por frame;
   - para pedestres andando, 5 ciclos completos de caminhada manual;
   - padrao lateral de producao: 5 ciclos x 5 frames em celulas 96x144;
   - pe no baseline row 139;
   - alpha apenas 0 ou 255;
   - sombra no PNG;
   - corpo e acessorio desenhados como uma unica silhueta.

2. Criar pacote de trafego fora do jogo:
   - cada veiculo em arquivo proprio;
   - carro renderizado entre 170 e 240 px;
   - moto renderizada entre 100 e 150 px;
   - piloto integrado ao bitmap;
   - sem semi-alpha e sem brilho plastico.

3. Criar comparacao final no preview:
   - fundo da rua;
   - protagonista;
   - tres NPCs de calcada;
   - dois NPCs de fundo;
   - um carro e uma moto;
   - UI/carteira como padrao de linguagem.

4. Integrar no runtime somente depois de aprovacao humana explicita.

## Regra nova de personagens/pedestres

Toda arte humana nova precisa seguir `PUBPAID_V2_NPC_PIXEL_ART_MASTER_PROMPT.md` e `PUBPAID_2_CHARACTER_ART_PROMPT.md`.

Entrega obrigatoria antes de runtime:

- HTML simples de aprovacao;
- spritesheet completo;
- frame 1 isolado em 1x e 2x quando houver asset novo;
- comparacao contra protagonista;
- comparacao contra cenario real;
- status claro: aprovado, em revisao ou rejeitado.

Nao existe aprovacao implicita por estar bonito isolado. Se o personagem parecer colado, chapado, procedural, generico, com prop solto, sem 5 ciclos reais de caminhada humana quando for pedestre andando, ou com recorte sujo, ele volta para refacao.

## Gate de conclusao

Antes de dizer que a direcao visual esta implementada:

- o usuario precisa aprovar a linha no preview;
- os assets precisam existir como PNG/spritesheet bitmap real;
- nao pode haver troca "para testar rapidinho" em `BootScene` ou `StreetScene`;
- `npm run pubpaid:visual-audit` precisa rodar e seus achados precisam ser reportados.

Nesta rodada, a direcao foi organizada e iniciada. Ela ainda nao esta implementada no runtime final.
