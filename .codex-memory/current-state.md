# Current State

Updated: 2026-04-25T23:53:03.197Z

## Active Goal

- Hotfix Buzz: imagens repetidas e HTML cru

## Summary

Usuario apontou captura com 3 materias diferentes da mesma area usando a mesma imagem e resumo exibindo tags HTML. script.js agora rejeita o pixel genciabrasil.ebc.com.br/ebc.gif como foto real, usa fallback visual variado por posicao nos cards sem foto real e limpa o resumo com cleanArticleExcerpt. index.html recebeu cache-bust novo do script.

## Next

- Subir o hotfix para origin/main.
- Apos deploy
- conferir no bloco de polêmicas/buzz que os cards da Agencia Brasil nao repetem a mesma foto e nao exibem <p><img>.

## Files In Focus

- script.js
- index.html
- CODEX_MEMORY.md
- .codex-memory/orders.json

## Assets In Focus

- output/playwright/buzz-image-clean-local-consent.png
