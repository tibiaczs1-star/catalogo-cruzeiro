# Handoff

Updated: 2026-05-20T16:56:40.850Z

Xadrez PubPaid publicado em 20260520-chess3d1. Render /api/pubpaid/build confirmou o build e o smoke mobile landscape online passou com frame 3D, 5 controles de camera, rotacao aplicada, 64 casas, 32 pecas, IA pensando 3 segundos, preview de origem/alvo e lance aplicado depois. Criterio atualizado: para Xadrez estilo Damas, preservar mesa grande 3D e camera, nao voltar para janela pequena.

## Next

- Validacoes feitas: node --check
- npm run guard:pubpaid
- git diff --check
- Playwright mobile local
- desktop local e mobile no Render.
- Evidencias: .codex-temp/chess3d-mobile.png
- .codex-temp/chess3d-desktop.png e .codex-temp/chess3d-render-mobile.png.

## Files In Focus

- pubpaid-phaser/ui/domGameInterface.js
- pubpaid-phaser.css
- pubpaid-phaser/app.js
- pubpaid.html
- server.js

## Related Orders

- 2026-05-20-corrigir-xadrez-pubpaid-para-usar-modelo-visual-3d-estilo-damas-com-camera-rotat
