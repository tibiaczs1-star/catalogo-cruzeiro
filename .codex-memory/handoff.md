# Handoff

Updated: 2026-04-25T23:53:03.197Z

Hotfix em andamento: captura do usuario mostrou 3 cards do bloco polêmicas/buzz com a mesma imagem genérica e HTML cru no resumo. Correção aplicada em script.js: ebc.gif da Agência Brasil vira placeholder rejeitado, cards sem foto real usam fallbacks diferentes por posição, resumo passa por cleanArticleExcerpt. index.html atualiza cache-bust para script.js?v=20260425buzz-image-clean1. Validações locais: node --check script.js e npm run review:team com 0 issues.

## Next

- Commitar e subir apenas script.js
- index.html
- CODEX_MEMORY.md e memoria local desta ordem.
- Manter alterações antigas de .codex-agents e caches fora do commit.

## Files In Focus

- script.js
- index.html
- CODEX_MEMORY.md
- .codex-memory/current-state.md
- .codex-memory/handoff.md
- .codex-memory/orders.json

## Related Orders

- 2026-04-25-corrigir-o-bloco-de-polemicas-buzz-para-nao-repetir-a-mesma-imagem-em-materias-d
