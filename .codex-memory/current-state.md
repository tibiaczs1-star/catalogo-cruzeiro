# Current State

Updated: 2026-04-24T22:55:10.000Z

## Active Goal

- Prioridade permanente da governadora Mailza

## Summary

Regra nova aplicada: Mailza/Mailsa/Mailza Assis Cameli/governadora Mailza virou prioridade editorial permanente. Servidor, front, rodada diaria offline/online e ciclo dos agentes agora promovem materias da Mailza como Politica Regional, `governadora mailza`, prioridade 950 e `editorialPriority: mailza-prioridade`.

O comando `node scripts\re-rodada-dia-geral.js` agora tenta Render online primeiro e usa cache apenas como fallback declarado. Rodada de 2026-04-24 puxou 120 noticias online, sem fallback, e deixou 8 materias da Mailza promovidas; `news-data.js` ficou com Mailza no indice 0 e 10 itens detectados.

Review geral do dia ficou limpa: `npm run review:team` retornou `totalIssues: 0`; `npm run audit:news-images -- --offline --limit=80 --strict-new` retornou `ok=80 review=0`; `npm run agents:cycle` terminou `ok: true` com 181 agentes e review integrada sem EPERM.

## Next

- Conferir visualmente a home no navegador real para confirmar os destaques da Mailza no topo.
- Se uma nova materia da Mailza aparecer nas fontes online, rodar `node scripts\re-rodada-dia-geral.js` e depois `npm run agents:cycle`.
