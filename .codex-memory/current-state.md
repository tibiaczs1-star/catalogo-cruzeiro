# Current State

Updated: 2026-04-20T06:12:22.686Z

## Active Goal

- Backend PubPaid de producao corrigido

## Summary

O deploy PM2 usa backend/server.js; esse backend agora recebeu endpoints PubPaid reais: QR/deposito, account, withdrawals, dashboard com pubpaidPendingDeposits/pubpaidWallets, review admin de depositos/retiradas e CSVs. Botao do caixa mudou para "Confirmar meu deposito".

## Next

- Deployar e testar fluxo real: confirmar deposito no PubPaid
- abrir dashboard admin
- aprovar deposito pendente
- conferir carteira creditada.
