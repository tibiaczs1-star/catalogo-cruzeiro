# Handoff

Updated: 2026-04-28T14:42:00-05:00

Rodada atual: usuario pediu corrigir somente no mobile o bloco `Fundadores`, porque a copy parecia editorial e os cards exigiam arrastar. Use a arvore limpa `.codex-temp/deploy-home-sync` para deploy. Nao use a worktree principal suja para publicar, pois ela tem PubPaid local-only e outras pendencias.

Alteracoes: `index.html` so recebeu cache-bust de `premium-clarity.css` e `script.js`; texto/estrutura desktop do bloco foi preservado. `premium-clarity.css` adiciona regras dentro de `@media (max-width: 760px)` para transformar a faixa em destaque unico, sem scroll horizontal. `script.js` adiciona `initializeMobileFoundersSpotlight`, que muda copy/labels e alterna cards apenas quando `matchMedia("(max-width: 760px)")` esta ativo; ao sair do mobile, restaura os textos/cards originais.

Validacoes: `node --check script.js`, brace-balance em `premium-clarity.css`, `styles.css`, `styles-late-overrides.css` e `mobile-home-final.css`, checagem estatica confirmando que a copy original do desktop continua no HTML, e `npm run review:team` com `totalIssues=0`.

## Next

- Stage exato: `index.html`, `premium-clarity.css`, `script.js`, `CODEX_MEMORY.md`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md` e `.codex-memory/orders.json`.
- Commitar e enviar `HEAD:main`.
- Verificar producao com a home, o aviso de rodape e os cache-busts recentes.
- PubPaid segue local-only ate nova autorizacao explicita.
