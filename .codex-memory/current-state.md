# Current State

Updated: 2026-05-17T07:27:46-05:00

## Active Goal

- PubPaid 2.0 canonico: PvP real, reconexao/W.O., sinuca fisica e novas mesas funcionais.

## Summary

- Build local atual: `20260517-poolpvp-ledger1`.
- Damas PvP agora diferencia desconexao e desistência:
  - fechar navegador/pagehide marca mesa como `abandoned`;
  - jogador tem 60 segundos para voltar;
  - voltar via polling/state reativa a mesa;
  - botão `Desistir` finaliza por W.O. imediatamente.
- Damas recebeu ajuste geometrico de fullscreen: grid 8x8 com linhas fixas, visual mais limpo e mao animada no ultimo lance.
- Mobile: removida tentativa de lock de orientacao em aparelho touch; gate passa a orientar e observar rotacao sem travar.
- Sinuca foi reconstruida como cena fisica local: bola branca, 15 bolas em triangulo, mira, força, colisao bola-bola, paredes, caçapas e reposicao da branca.
- Xadrez, poker, truco e dados foram adicionados como mesas canonicas PvP:
  - xadrez usa `chess.js` no servidor para validar lance legal;
  - poker troca 5 cartas e resolve mao no backend;
  - truco simples melhor de 3 maos;
  - dados por palpite de soma em rodadas.
- Sinuca agora tambem usa o fluxo PvP real no DOM: fila, pareamento, dupla confirmacao e endpoint autoritativo de tacada.
- Dashboard PubPaid separa saldo atual, livre/travado, ganho PvP, perdido PvP e liquido PvP.
- Corrigido estado sujo: resultado `finished` antigo nao bloqueia nova fila do mesmo jogo.
- Corrigida recursao/render instavel da mesa generica: polling de presenca nao recria botoes enquanto o estado jogavel nao muda.

## Validation

- `node --check server.js`
- `node --check pubpaid-phaser/ui/domGameInterface.js`
- `node --check pubpaid-phaser/services/pvpService.js`
- `node --check pubpaid-phaser/services/accountService.js`
- `node --check pubpaid-phaser/app.js`
- `node --check pubpaid-phaser/scenes/PoolGameScene.js`
- `npm run guard:pubpaid`
- `git diff --check`
- Teste replay/backend local: depois de finalizar uma sinuca, novo join do mesmo jogador retorna `waiting` em vez de reaproveitar match `finished`.
- Teste Chromium local com duas sessoes autenticadas:
  - Sinuca: card do lobby, pareamento, ready duplo, tacada PvP e W.O.
  - Damas: card do lobby, pareamento, ready duplo, movimento e W.O.
  - Xadrez: card do lobby, pareamento, ready duplo, lance e W.O.
  - Poker: card do lobby, pareamento, ready duplo, duas trocas e resultado natural.
  - Truco: card do lobby, pareamento, ready duplo, carta jogada e W.O.
  - Dados: card do lobby, pareamento, ready duplo, dois palpites, rodada registrada e W.O.
- Teste backend local com duas sessoes/cookies:
  - Damas: join, ready duplo, desconexao -> `abandoned`, reconexao -> `active`, desistir -> `finished` com rival vencedor.
  - Xadrez: lance `e2-e4` validado pelo motor.
  - Poker: duas trocas concluem a mesa.
  - Dados: rodada registrada.
  - Truco: mao registrada.
- Browser local em build `20260517-poolpvp-ledger1`:
  - sem scroll em desktop 1280x720;
  - lobby mostra Sinuca, Damas, Xadrez, Poker, Truco e Dados;
  - Sinuca abre com 15 bolas em triangulo e tacada movimenta/colide bolas sem console errors.
- Observacao do usuario durante a rodada: o objetivo principal e tudo funcionar; arte pode ser reposicionada/substituida depois.

## Files In Focus

- `server.js`
- `pubpaid.html`
- `pubpaid-phaser.css`
- `pubpaid-phaser/app.js`
- `pubpaid-phaser/ui/domGameInterface.js`
- `pubpaid-phaser/services/accountService.js`
- `pubpaid-phaser/services/pvpService.js`
- `pubpaid-phaser/scenes/PoolGameScene.js`
- `pubpaid-runtime.js`
- `pubpaid-admin.html`
- `assets/pubpaid/lobby/icons/*.svg`
- `package.json`
- `package-lock.json`

## Next

- Rodar validacao visual mobile/landscape com Playwright/Chrome.
- Commit/push e confirmar `/api/pubpaid/build` online com `20260517-poolpvp-ledger1`.
- Testar online com duas contas Google reais quando o deploy novo estiver ativo nas duas janelas.
