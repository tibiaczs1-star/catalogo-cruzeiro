# Fluxo Operacional de Jogos

## Entrada

1. Codex recebe o pedido do usuario.
2. Codex classifica a frente:
   - jogo/PubPaid;
   - jornal/CZS;
   - Cheffe Call;
   - sistema local;
   - outra frente.
3. Se for jogo, ativa o Diretor do Jogo.
4. Se for jornal, segue o fluxo CZS separado.

## Ciclo de trabalho de jogo

1. Diretor do Jogo resume objetivo, risco e criterio de pronto.
2. Diretor chama os subagentes necessarios.
3. Escritorio Nerd envia contexto tecnico quando util:
   - engine;
   - fisica;
   - audio;
   - economia;
   - render;
   - QA;
   - HUD.
4. Subagentes entregam parecer curto e acionavel.
5. Diretor consolida:
   - o que fazer agora;
   - o que nao fazer;
   - arquivos em foco;
   - validacoes obrigatorias.
6. Codex/Hermes executam a decisao secundaria ou implementam.
7. Linha Final revisa jogo, arte e interface juntos.
8. Codex entrega ao usuario:
   - resumo;
   - validacao;
   - pendencias;
   - decisao que ainda precisa do usuario, se houver.

## Camadas obrigatorias de analise

Para qualquer rodada grande, o Diretor deve verificar estas camadas antes de
passar decisao para Codex/Hermes:

1. Produto: qual promessa jogavel esta sendo protegida.
2. Design: quais regras, objetivos e recompensas mudam.
3. Runtime: quais cenas, objetos, input, fisica, animacao ou camera mudam.
4. UI/HUD: quais informacoes, botoes, estados e feedback mudam.
5. Arte: quais anchors, sprites, tiles, paletas ou VFX mudam.
6. Dados/backend: quais APIs, sessoes, wallet, PvP, logs ou manifestos mudam.
7. QA/seguranca: quais regressos, abusos e estados impossiveis precisam teste.
8. Entrega: quais checks, build, deploy, rollback ou handoff sao necessarios.

## Matriz de decisao

Codex/Hermes podem decidir sem perguntar quando:

- a mudanca e reversivel;
- a regra ja existe na memoria local;
- a correcao e tecnica;
- o pedido do usuario e claro;
- o risco financeiro/PvP e baixo ou coberto por teste.

Subir ao usuario quando:

- envolve gosto visual final;
- muda economia, aposta, saldo, premio ou regra financeira;
- muda direcao de produto;
- troca anchor aprovado de arte;
- remove conteudo ou comportamento importante;
- ha conflito entre agentes.

## Ordem padrao dos subagentes

1. Teste e Seguranca Gamer, quando houver PvP, carteira, backend ou abuso.
2. Interfaces e HUD, quando houver controle, tela, mobile ou feedback.
3. Arte e Design, quando houver asset, estilo, sprite, concept ou visual.
4. Linha Final sempre antes de entrega grande.

## Sub-subagentes por necessidade

- Programacao: gameplay, runtime/engine, UI programmer, backend/PvP,
  tools/pipeline, fisica, build/release.
- Arte: concept, pixel fundamentals, paleta, sprite anatomy, walk cycle, tiles,
  VFX, style bible e export/finalizacao.
- Interface: HUD readability, controles, menu flow, acessibilidade, iconografia,
  estados e implementacao DOM/Phaser.
- Teste: gameplay QA, mobile QA, regressao, economia/PvP, abuse/security,
  performance leve e linha final.

## Linha final obrigatoria

Antes de considerar pronto:

- o jogo carrega;
- a acao principal funciona;
- HUD e controles sao legiveis em desktop e mobile landscape quando aplicavel;
- nenhum texto ou controle critico fica sobreposto;
- arte aprovada nao foi substituida por estudo/rejeitado;
- PvP/economia usam servidor autoritativo;
- `npm run guard:pubpaid` passou quando PubPaid foi tocado.

## Checklist por tipo de mudanca

### Novo jogo ou modo

- promessa jogavel em uma frase;
- loop principal;
- estados da partida;
- input principal;
- HUD minimo;
- criterio de vitoria/derrota;
- erro/empty/loading;
- validacao local;
- validacao PvP/economia se houver;
- linha final.

### Nova arte

- funcao do asset;
- anchor aprovado;
- tamanho real no jogo;
- paleta e silhueta;
- direcoes ou poses necessarias;
- spritesheet/atlas/manifest;
- integracao runtime;
- revisao de linha final.

### Nova interface/HUD

- hierarquia de informacao;
- estados de botao;
- feedback redundante;
- mobile landscape;
- foco/teclado quando aplicavel;
- acessibilidade basica;
- sem sobreposicao;
- teste de fluxo.

### Novo fluxo PvP/economia

- servidor autoritativo;
- cliente envia intencao, nao resultado;
- duas sessoes autenticadas;
- ready/turno/jogada;
- settlement e logs;
- desconexao/reconexao/W.O.;
- tentativa de estado impossivel;
- `npm run guard:pubpaid`.

### Mapa, arena ou colisao

- blockout/greybox antes da arte final;
- camadas visuais separadas de camadas de colisao;
- definir hitbox, hurtbox, trigger, sensor e colisao solida;
- documentar collision layers/masks;
- testar camera, escala, caminho e areas de toque;
- validar colisao em baixa velocidade e alta velocidade;
- em 3D, usar broad phase/narrow phase e volumes simples;
- incluir debug visual de colisores quando possivel.

### Balanceamento/economia

- regra e exemplo numerico;
- impacto em chance, payout, tempo, risco e percepcao de justica;
- log de partida/carteira;
- teste de regressao;
- rollback claro;
- decisao sensivel sobe ao usuario.

### Telemetria/QA

- eventos minimos definidos;
- build registrado;
- erro/abandono/reconexao/resultados logados;
- smoke;
- regression;
- exploratory;
- mobile/device;
- severidade de bug.
