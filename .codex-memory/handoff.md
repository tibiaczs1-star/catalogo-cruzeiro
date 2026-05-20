# Handoff

Updated: 2026-05-20T16:52:44.385Z

Xadrez PubPaid esta em correcao 20260520-chess3d1. Usuario rejeitou a versao anterior por ser janela pequena; criterio atualizado: precisa seguir o modelo 3D da Damas, com mesa grande, perspectiva, rotacao de camera, zoom/arrasto e visual cinematografico. Local ja validou mobile e desktop; falta subir e confirmar Render.

## Next

- Validacoes locais feitas: node --check
- npm run guard:pubpaid
- git diff --check
- Playwright mobile landscape e desktop.
- Evidencias locais: .codex-temp/chess3d-mobile.png e .codex-temp/chess3d-desktop.png.

## Files In Focus

- pubpaid-phaser/ui/domGameInterface.js
- pubpaid-phaser.css
- pubpaid-phaser/app.js
- pubpaid.html
- server.js

## Related Orders

- 2026-05-20-corrigir-xadrez-pubpaid-para-usar-modelo-visual-3d-estilo-damas-com-camera-rotat
