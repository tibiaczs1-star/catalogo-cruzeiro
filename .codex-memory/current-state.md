# Current State

Updated: 2026-05-20T00:46:47-05:00

## Active Goal

- Sinuca PubPaid usando o prototipo aprovado Vale Pool com modalidades reais e HUD explicando a regra viva

## Summary

O prototipo isolado `.codex-temp/vale-pool-round2` foi promovido para `games/vale-pool/` e substitui a Sinuca antiga do PubPaid via iframe. Build atual `20260520-poolrules1`. Demo abre o prototipo sem ficha/carteira, com jogador vs Robo IA, controles funcionais por mouse/teclado, ponto de batida livre na branca do HUD, bolas dentro/fora, historico de jogadas, bloco `VEZ`, cartões laterais, taco/pontilhado voltando ao estado `MIRANDO`, escala maior/responsiva e caçapas abertas visualmente para o lado do pano. A captura das caçapas foi ampliada no prototipo e no PvP do servidor, considerando tambem o trajeto entre frames para a bola cair sem rebater na boca. Demo/IA e PvP têm moeda animada: vencedor escolhe apenas uma parte (`ser primeiro` ou `modalidade`) e perdedor escolhe a parte restante. Depois das escolhas, abre tutorial da modalidade; Demo só começa ao apertar `COMEÇAR PARTIDA` e PvP só libera tacada quando os dois jogadores confirmam o tutorial. Modalidades implementadas: Livre, Brasileira e Par/Ímpar. A HUD agora informa a regra viva de cada modo durante a partida e os cartoes laterais têm botao `REGRAS` com manual em pop-up. PvP usa endpoint `/api/pubpaid/pvp/pool/setup`.

## Next

- Usuario testar `http://127.0.0.1:3000/pubpaid.html?v=20260520-poolrules1` e a Demo direta `http://127.0.0.1:3000/games/vale-pool/index.html?mode=demo&v=20260520-poolrules1`.
- Validar PvP real em duas sessoes autenticadas quando houver dois usuarios/sessoes disponiveis.
- Manter Sinuca em mobile sempre horizontal e full width.

## Assets In Focus

- games/vale-pool/index.html
- games/vale-pool/game.js
- games/vale-pool/styles.css
- .codex-temp/pubpaid-vale-pool-demo.png
- .codex-temp/pubpaid-vale-pool-pvp.png
- .codex-temp/pubpaid-vale-pool-demo-functional.png
- .codex-temp/pubpaid-vale-pool-effect-control.png
- .codex-temp/vale-pool-pool8-moeda.png
- .codex-temp/vale-pool-pool8-modalidades.png
- .codex-temp/vale-pool-pool8-brasileira.png
- .codex-temp/vale-pool-pool11-pocket-subtle.png
- .codex-temp/vale-pool-poolrules1-rule-live.png
