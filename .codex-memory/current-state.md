# Current State

Updated: 2026-04-23T14:05:00.000Z

## Active Goal

- PubPaid 2.0 com mesas PvP vivas, pixel art e feedback de resultado dentro do salão

## Summary

A PubPaid 2.0 em `pubpaid-v2.html` + `pubpaid-phaser/` já tem fila real, escrow, painel jogável, minicenário de Dardos no salão, minicenário de Dama no salão e agora também feedback visual de resultado. O painel mostra bloco de vitória/derrota/empate com payout e taxa da casa; o salão reage com glow, badge e texto de payout nas duas mesas quando a partida fecha.

## Next

- Subir a camada seguinte de FX pixel art: partículas, estouro de placar, brilho de payout e comemoração/derrota por mesa
- Depois enriquecer props 2D dedicados de Dardos e Dama para tirar ainda mais cara de protótipo

## Files In Focus

- pubpaid-phaser/scenes/InteriorScene.js
- pubpaid-phaser/ui/panelActions.js
- pubpaid-phaser/ui/overlay.js
- pubpaid-phaser.css
