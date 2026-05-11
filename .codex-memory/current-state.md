# Current State

Updated: 2026-05-11T19:21:50.616Z

## Active Goal

- Home sem travar nas intros

## Summary

A intro continua visual, mas deixou de esperar a cadeia inteira de hidratacao. A abertura agora libera a home com failsafe curto, carrega noticias em blocos, adia scripts auxiliares, nao puxa news-data.js gigante na abertura HTTP quando a API demora, e empurra warm cache para depois. QA local desktop/mobile passou sem overlay preso, sem scroll lock, console limpo, maxLongTask abaixo de 1s; review:team e perf:budget ok.

## Next

- Commit complementar
- push para origin/main
- validar producao online com cache-bust intro-speed1 sem news-data.js cedo e sem Pagina sem resposta

## Files In Focus

- index.html
- script.js
- startup-experience.js
- startup-experience.css
- deferred-home-boot.js

## Assets In Focus

- C:\Users\junio\AppData\Local\Temp\catalogo-intro-hotfix-qa-20260511-v2\desktop.png
- C:\Users\junio\AppData\Local\Temp\catalogo-intro-hotfix-qa-20260511-v2\mobile.png
