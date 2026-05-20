# Handoff

Updated: 2026-05-20T08:39:00-05:00

PubPaid Sinuca atualizada em 20260520-poolturn1. O prototipo aprovado `.codex-temp/vale-pool-round2` foi promovido para `games/vale-pool/` e substitui a Sinuca antiga dentro do PubPaid. Demo abre por iframe sem ficha/carteira, com jogador vs Robo IA, controles por mouse/teclado, ponto de batida livre na bola branca do HUD, bolas dentro/fora, historico de jogadas, bloco superior `VEZ`, cartões laterais, taco/pontilhado e caçapas abertas visualmente para o lado do pano. A captura das caçapas foi ampliada no prototipo e no servidor PvP, incluindo checagem do trajeto entre frames para a bola cair sem rebater na boca. Modalidades implementadas: `Livre` (branca + bolas 1-9, placar por bolas), `Brasileira` (branca + 7 coloridas oficiais, bola da vez menor em mesa, placar por pontos) e `Par/Impar` (branca + 2-15, primeiro encaçape define grupo, 15 fecha/castiga). A abertura em Demo/IA e PvP segue: moeda animada; vencedor escolhe uma parte (`ser primeiro` ou `modalidade`); perdedor escolhe a parte restante; depois aparece animacao de `MODO ESCOLHIDO`; em seguida abre o tutorial da modalidade antes da mesa. Demo só começa ao apertar `COMEÇAR PARTIDA`; PvP só libera tacada quando os dois jogadores confirmam o tutorial. A HUD informa a regra viva durante a partida: Livre mostra alvo livre 1-9, Brasileira mostra a bola da vez, Par/Impar mostra definicao ou grupo PAR/IMPAR. Os cartoes laterais mostram donos do grupo (`VOCE/RIVAL/IA: PAR/IMPAR`) assim que a primeira bola valida cai. Falta de bola branca agora entrega a vez explicitamente ao rival/IA, evitando ficar presa no jogador 1. Os cartoes laterais têm botao `REGRAS` para abrir manual pop-up e fechar sem sair da partida. PvP usa endpoint `/api/pubpaid/pvp/pool/setup`, monta rack por modalidade no servidor e bloqueia tacada ate escolha/tutorial acabar. Conhecimento consolidado em `.codex-agents/game-director-system/projects/vale-pool.md` e `C:\Users\junio\.codex\skills\game-director-general\references\pool-modalities.md`.

## Next

- Nao redesenhar a mesa aprovada sem pedido explicito; manter o prototipo como fonte visual.
- Se houver ajuste visual, mexer primeiro em `games/vale-pool/` e so depois no wrapper PubPaid.
- Validar PvP real em duas sessoes autenticadas diferentes antes de considerar fluxo financeiro fechado; a logica de setup/shot ja esta no servidor, mas a validacao visual feita nesta rodada foi na Demo.
- Porta 3000 estava ocupada por outro app durante esta rodada; validação local rodou em `http://127.0.0.1:3001/pubpaid.html?v=20260520-poolturn1`.
- Manter jogos PubPaid em celular sempre horizontais e full width.

## Files In Focus

- games/vale-pool/index.html
- games/vale-pool/styles.css
- games/vale-pool/game.js
- pubpaid-phaser/ui/domGameInterface.js
- pubpaid-phaser.css
- server.js
- pubpaid.html
- .codex-memory/current-state.md
- .codex-memory/handoff.md
- .codex-memory/orders.json
- .codex-memory/assets.json

## Related Orders

- 2026-05-19-substituir-sinuca-pubpaid-pelo-prototipo-vale-pool
- 2026-05-19-refazer-sinuca-pubpaid-para-parecer-mesa-real-remover-faixa-sobre-a-mesa-e-adici
