# Relatorio PubPaid 2.0 - Instrutor de Testes

Data: 2026-04-27

## Escopo da rodada

- Frente oficial: `pubpaid-v2.html`, `pubpaid-phaser/`, `pubpaid-phaser.css` e `assets/pubpaid/`.
- `pubpaid.html` continua historica/demo.
- Sem deploy da PubPaid sem autorizacao clara.
- Trabalho em modo instrutor de testes: ler memoria, separar ruido, rodar reuniao, transformar decisoes em objetivos testaveis e so entao corrigir pontos pequenos.

## Decisoes e objetivos testaveis

| Objetivo | Entrada | Evidencia | Criterio de pronto | Arquivos afetados |
| --- | --- | --- | --- | --- |
| Remover texto publico em ingles da PubPaid | Varredura e playtest da frente oficial | Playtest local e busca de textos publicos | Fluxo sem `Enter Game`, `Lobby`, `Escrow`, `Bullseye` e semelhantes na UI publica | `pubpaid-v2.html`, `pubpaid-phaser/`, `pubpaid-phaser.css` |
| Estabilizar fluxo Phaser + DOM | Intro, rua, salao, mesas, Dardos e Dama | `.codex-temp/pubpaid-playtest/playtest-report.json` e `pixel-report.json` | Zero erros de pagina, screenshots nao vazias, Dama com 64 casas, Dardos com resultado sem modal duplicado | cenas Phaser e `pubpaid-phaser/ui/` |
| Bloquear reincidencia de ingles em noticias | Captura do card Google/The Verge em ingles | `npm run review:team` e smoke test de frases conhecidas | `totalIssues=0` e `englishLeakSmokeHits=[]` | `scripts/review-team-audit.js`, `scripts/sanitize-public-language.js`, `server.js`, dados de noticias |
| Separar ruido operacional de mudanca real | `git status --short` e rotinas locais | Relatorio de status e memoria atualizada | PubPaid sem commit/deploy; caches e dados gerados classificados como ruido/rotina | `.codex-memory/`, `data/`, `.codex-agents/` |

## Reuniao local

- `npm run agents:cycle` rodou com 181 agentes, 5 escritorios e 120 noticias.
- A equipe local de revisao rodou dentro do ciclo e depois manualmente.
- Resultado final: `npm run review:team` com `totalIssues=0`.

## Validacoes finais

- `node --check server.js`
- `node --check scripts/sanitize-public-language.js`
- `node --check scripts/review-team-audit.js`
- `node --check` nos JS principais da PubPaid
- JSON ok para `orders`, `assets`, `runtime-news` e `news-archive`
- Smoke test anti-ingles: `englishLeakSmokeHits=[]`

## O que continua pendente

- PubPaid nao foi commitada nem deployada.
- O workspace segue com muitos arquivos gerados por rotinas (`data/*`, `.codex-agents/*`, caches e relatorios).
- Antes de qualquer commit, escolher pacote fechado: PubPaid/testes, ou idioma/noticias/rotina, ou dados gerados. Nao misturar sem decisao explicita.
