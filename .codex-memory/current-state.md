# Current State

Updated: 2026-05-27T18:13:36.241Z

## Active Goal

- Home CZS com carregamento fatiado real aplicado

## Summary

A home agora inicia com payload leve: preload de noticias limitado a 18 itens firstFold, CSS critico separado, home-main-loader no lugar de script.js direto, estilos premium/modulos auxiliares atras de viewport/intent/fallback tardio, e cinematic-parallax oculto no CSS critico para nao empurrar a home no mobile. Validacao: desktop Browser e mobile Playwright mostram que aos 5.6s/12.6s nao entram script.js, arquivo/admin/Cheffe ou premium-home; rolagem aciona modo completo por reader-intent.

## Next

- Testar em Chrome real do usuario se ainda aparecer aguardando resposta
- Se for para publicar rodar fluxo de deploy normal

## Files In Focus

- index.html
- script.js
- catalogo-app-core.js
- early-home-surfaces.js
- home-main-loader.js
- home-critical.css

## Assets In Focus

- czs-desktop-final-gate-5600
- czs-desktop-page-after-close
- czs-mobile-final-fixed-5600
