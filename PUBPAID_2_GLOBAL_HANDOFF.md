# PubPaid - Handoff Canonico

Este arquivo manteve o nome antigo porque `AGENTS.md` manda le-lo antes de mexer no jogo. O conteudo atual substitui a historia anterior: existe um unico PubPaid vivo.

## Canon

- URL publica e de teste: `/pubpaid.html`
- Runtime do jogo: `pubpaid-phaser/`
- HTML shell unico: `pubpaid.html`
- CSS principal: `pubpaid-phaser.css`
- Backend: `server.js`
- Carteira canonica: `pubpaid-runtime.js` + `data/pubpaid-store.json`
- PvP canonico: `data/pubpaid-pvp.json`

`/pubpaid-v2.html` e qualquer rota antiga sao apenas compatibilidade/redirect para `/pubpaid.html`. Nao usar como caminho de trabalho.

## Regras duras

- Nao recriar PubPaid 1.0.
- Nao usar demo money, IA local ou modo teste para validar PvP real.
- Nao promover laboratorio, prompt, screenshot ou arte conceitual para o runtime.
- Antes de validar: `npm run guard:pubpaid`.
- Runtime `pubpaid-phaser/` e `pubpaid.html` nao podem usar `spriteFactory`, `document.createElement`, `canvas`, `createCanvas` ou `addCanvas`.

## Fluxo esperado

1. Abrir `http://127.0.0.1:3000/pubpaid.html`.
2. Checagem de build/cache antes do jogo.
3. Google autentica e entra sem botao intermediario.
4. Nick persistido por conta, com opcao de alterar.
5. Em celular/touch, o jogo deve ser jogado em horizontal; retrato bloqueia com o gate `Mude para horizontal`.
6. Mesas ativas atuais: Sinuca, Damas e Xadrez. Treino/Demo nao mexe em saldo; PvP real exige saldo real aprovado.
7. PvP: jogador A espera, jogador B entra, ambos confirmam `Estou pronto`, servidor ativa a partida e cada lado move no proprio tabuleiro.

## Foco atual

Build local atual: `20260520-poolmobileintro1`.

Foco vivo: PubPaid canonico com Sinuca/Damas/Xadrez, abertura mais leve, mobile horizontal obrigatorio e Sinuca usando o prototipo Vale Pool aprovado. A Sinuca tem modalidades Livre, Brasileira e Par/Impar. Abertura em Demo/IA e PvP: moeda animada; vencedor escolhe apenas uma parte (`ser primeiro` ou `modalidade`); perdedor escolhe a parte restante. Depois das escolhas, uma animacao de `MODO ESCOLHIDO` aparece antes do tutorial do modo; no PvP os dois jogadores precisam confirmar o tutorial antes da primeira tacada. PvP usa `/api/pubpaid/pvp/pool/setup`, rack por modalidade e bloqueio de tacada ate a escolha/tutorial acabar. Em `20260520-poolmobileintro1`, a HUD e os cartoes laterais mostram regra viva por modalidade, o modo Livre encerra quando acabam as bolas de ataque, e falta da branca gera `bola na mão`: adversario ganha a vez e posiciona a branca antes de tacar. Demo posiciona automaticamente para IA e por clique para jogador; PvP grava `ballInHandSeat` no servidor e recebe `cueX/cueY` do cliente. Mobile/touch agora joga em duas etapas: primeiro mira, depois toca para abrir a força e toca de novo para tacar. A entrada do Vale Pool tem animacao curta do taco batendo na bola e abrindo a mesa. O botao `REGRAS` em cada cartao abre manual pop-up e fecha de volta para a partida. Validar com `node --check`, `npm run guard:pubpaid` e `/api/pubpaid/build=20260520-poolmobileintro1`. PvP real ainda deve ser testado em duas sessoes autenticadas antes de fechar fluxo financeiro.
