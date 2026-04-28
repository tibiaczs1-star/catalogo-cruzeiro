# Current State

Updated: 2026-04-28T14:42:00-05:00

## Active Goal

- Ajustar somente no mobile o bloco de apoiadores/fundadores da home.

## Summary

Bloco `Fundadores` recebeu ajuste restrito ao mobile: desktop preservado no HTML, com apenas cache-bust. Em `max-width: 760px`, a faixa deixa de pedir arraste e vira destaque automatico rotativo; o texto mobile muda para linguagem de apoiadores, menos editorial. JS usa `matchMedia("(max-width: 760px)")` e restaura os textos/cards ao sair do mobile.

## Next

- Commitar e enviar `index.html`, `premium-clarity.css`, `script.js` e memorias.
- Verificar producao no mobile/cache-bust.
- PubPaid continua local-only e nao deve entrar em deploy sem ordem explicita do usuario.
