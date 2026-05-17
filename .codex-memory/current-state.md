# Current State

Updated: 2026-05-17T06:47:49.785Z

## Active Goal

- PubPaid 2.0 unificado

## Summary

PubPaid agora foi consolidado como unico projeto 2.0: pubpaid.js/pubpaid.css removidos, /pubpaid.html redireciona para pubpaid-v2.html?v=20260517-pubpaid-unified2, cache-bust unificado, dados legados de carteira/deposito mesclados em data/pubpaid-store.json e arquivos legados esvaziados. API local confirmou saldo legado fake-sub/email teste.pubpaid@example.com = 5, e a tela inicial nao tem mais titulo branco duplicado sobre o letreiro.

## Next

- Validar online no Render com Google real/admin real apos commit/push; se carteira ainda zerar online
- checar DATA_DIR persistente /opt/render/project/src/render-data/data/pubpaid-store.json e migracao do disco Render.
