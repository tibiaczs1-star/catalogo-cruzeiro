# Handoff

Updated: 2026-05-16T22:50:11.728Z

PubPaid 2.0 hotfix realflow2: removido de vez o gancho interno de Google da rua/jogo (syncStreetGoogleGate e chamadas). pubpaid-v2.html e BootScene.js agora usam cache-bust 20260516-google-wallet-realflow2; CSS ganhou regra para respeitar hidden dentro do game shell; o gate de orientacao mobile nao cobre mais o Google antes do login. Validado localmente com Google mockado: gate autenticado mostra identidade, carteira mostra nome/email/sub e deposito pendente, intro carrega, rua aparece sem Google Port, Damas fica bloqueada sem saldo real aprovado.

## Next

- Depois do push
- esperar Render servir realflow2
- Validar online HTML/JS sem Google Port e com realflow2
- Usar apenas a URL cache-killed /pubpaid-v2.html?v=20260516-google-wallet-realflow2

## Files In Focus

- pubpaid-v2.html
- pubpaid-phaser/app.js
- pubpaid-phaser.css
- pubpaid-phaser/scenes/BootScene.js

## Related Orders

- 2026-05-16-remover-google-port-de-dentro-do-jogo-pubpaid-2-0-e-manter-google-apenas-como-ga
