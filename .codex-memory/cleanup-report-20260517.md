# Cleanup Report

Updated: 2026-05-17T05:45:00.000Z

## Scope

Limpeza segura solicitada pelo usuario para reduzir lixo local, ruido do Git e rotinas automaticas escondidas.

## Removed Local Artifacts

Total removido: 111.3 MB.

Observacao: a auditoria inicial mediu `.codex-temp` com cerca de 4977.6 MB. A primeira tentativa de remocao limpou praticamente todo esse volume antes de falhar em dois logs travados; por isso o total detalhado abaixo contabiliza os alvos removidos com sucesso individual, mas a reducao real de disco foi muito maior.

- output/chrome: 6.2 MB, 9 arquivo(s), 2 pasta(s)
- output/instagram: 71.8 MB, 90 arquivo(s), 10 pasta(s)
- output/tv-ad: 0.6 MB, 4 arquivo(s), 1 pasta(s)
- output/video-reference: 1.9 MB, 7 arquivo(s), 2 pasta(s)
- output/web-game/pubpaid-character-select-20260507: 2.2 MB, 3 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-damas-ready-20260517: 0 MB, 0 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-integrated-flow-20260507: 2 MB, 3 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-interior-map-collision-20260507: 5.4 MB, 5 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-main-flow-20260507-checkers-hiddenfix: 1.3 MB, 3 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-main-flow-20260507-pool-hiddenfix: 0.5 MB, 2 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-main-flow-20260507-pool-timerfix: 4 MB, 8 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-main-flow-20260507-street-interior-final: 2.6 MB, 3 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-pool-redesign-p0-20260507: 4.1 MB, 10 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-street-traffic-map-20260507: 2.8 MB, 3 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-transition-door-wait: 1 MB, 2 arquivo(s), 1 pasta(s)
- output/web-game/pubpaid-transition-enter-roundtrip: 1.3 MB, 2 arquivo(s), 1 pasta(s)
- data/heartbeats.json.18460.1778260938077.tmp: 0.3 MB, 1 arquivo(s), 0 pasta(s)
- data/heartbeats.json.4020.1778514124144.tmp: 0.4 MB, 1 arquivo(s), 0 pasta(s)
- data/image-preview-cache.json.16480.1778418505738.tmp: 0.4 MB, 1 arquivo(s), 0 pasta(s)
- data/image-preview-cache.json.16816.1778519460334.tmp: 0.4 MB, 1 arquivo(s), 0 pasta(s)
- data/image-preview-cache.json.16980.1778702027034.tmp: 0.2 MB, 1 arquivo(s), 0 pasta(s)
- data/image-preview-cache.json.17568.1778632500484.tmp: 0.1 MB, 1 arquivo(s), 0 pasta(s)
- data/image-preview-cache.json.19068.1778699001774.tmp: 0.2 MB, 1 arquivo(s), 0 pasta(s)
- data/image-preview-cache.json.22776.1778191275092.tmp: 0.3 MB, 1 arquivo(s), 0 pasta(s)
- data/image-preview-cache.json.9100.1778245683079.tmp: 0.3 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.11352.1778201427970.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.11352.1778202323008.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.11352.1778209050946.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.11352.1778218042066.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.11352.1778218042311.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.22776.1778038636360.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.22776.1778038636627.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.22776.1778191171994.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.7776.1777410669793.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.7776.1777410669974.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.7776.1777410673537.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.7776.1777410673636.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.9100.1778213457682.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/topic-feed-buzz.json.9100.1778220647391.tmp: 0 MB, 1 arquivo(s), 0 pasta(s)
- data/visits.json.15508.1778434652921.tmp: 0.4 MB, 1 arquivo(s), 0 pasta(s)

## Skipped

- .codex-temp: EBUSY

## Kept On Purpose

- `.codex-backups/`: preservado como rollback da rodada atual, agora ignorado pelo Git.
- Arquivos de dados principais em `data/*.json`: preservados, exceto temporarios `.tmp`.
- Arquivos PubPaid/runtime: preservados para a proxima correcao pontual.

## .codex-temp Granular Pass

Antes: 0 MB. Removido nesta passada: 0 MB. Depois: 0 MB.

### Removed
- Nada

### Still Locked/Skipped
- .codex-temp/npm-start.err.log: EBUSY
- .codex-temp/npm-start.out.log: EBUSY

## Locked Server Logs

- Tentativa de encerrar o servidor local antigo em `node.exe` PID 7088 na porta 3000 falhou com `Acesso negado`.
- `.codex-temp` ficou reduzido a dois logs travados (`npm-start.err.log` e `npm-start.out.log`, cerca de 1 KB no total).
- Para remover o restante, fechar o servidor local/terminal que iniciou `npm start` ou encerrar esse PID como administrador.
