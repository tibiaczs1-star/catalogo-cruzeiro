# Handoff

Updated: 2026-04-24T22:55:10.000Z

Prioridade Mailza aplicada e validada em 2026-04-24.

Arquivos principais tocados: `server.js`, `script.js`, `scripts/re-rodada-dia-geral.js`, `scripts/agents-autonomy-cycle.js`, `scripts/real-agents-runtime.js`, `scripts/review-team-audit.js`, `news-data.js`, `data/runtime-news.json`, `PROMPT_MAILZA_PRIORIDADE_2026-04-24.md`.

Comportamento novo: toda materia que citar Mailza/Mailsa/Mailza Assis Cameli/governadora Mailza/governadora em exercicio e marcada como Politica Regional, eyebrow `governadora mailza`, prioridade 950 e `editorialPriority: mailza-prioridade`. A ordenacao do front coloca esses itens antes da fila comum.

Validacoes: `node --check` passou para arquivos JS tocados; `node scripts\re-rodada-dia-geral.js` puxou Render online sem fallback, 120 noticias e 8 itens Mailza priorizados; `npm run review:team` deu `totalIssues: 0`; `npm run audit:news-images -- --offline --limit=80 --strict-new` deu 80/80 ok; `npm run agents:cycle` deu `ok: true`.

## Next

- Conferir visualmente a home real em wide screen e desktop comum.
- Continuar usando a rodada diaria online/offline antes de publicar alteracoes editoriais grandes.
