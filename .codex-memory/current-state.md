# Current State

Updated: 2026-06-05T12:25:27-05:00

## Active Goal

- CZS V8 final: otimizar hidratacao/velocidade, preservar intro aprovada, commitar, subir e checar online.

## Summary

- Intro V8 aprovada foi preservada: site carrega ate 100%, mostra janela do video com botao "Clique para iniciar", toca o MP4 com audio embutido apos clique e libera a home depois do fim.
- Versao publica atual: `20260605-v8-public-corrective-pass-v32`.
- Hidratação otimizada sem redesenhar: cache refresh versionado, preload inicial reduzido, abaixo-da-dobra em fila ociosa e imagens V8 com decode async/fetchpriority.
- Cards de licitacao deixam de ficar como pano branco: quando aparecem, exibem processo, orgao, data e objeto extraido da materia/narracao.
- Popup comercial direto validado com RAIane inteira sobre a janela em `http://127.0.0.1:3001/?skipIntro=1&forcePopup=1`.
- Auditoria local Chromium validou intro em `http://127.0.0.1:3001/?forceIntro=1` com `audibleProof=true`, video 480x480, audio decodificado, `volume=1`, loader escondido e logo visivel no final.

## Validation

- `node --check assets/v8-final/v8-merge-ready.js`
- `node --check script.js`
- `git diff --check -- index.html assets/v8-final/v8-merge-ready.js assets/v8-final/v8-merge-ready.css script.js`
- `npm run review:team` OK; 0 issues nos arquivos tocados, issues gerais antigas em vendor/ferramentas.
- `npm run perf:budget` OK nao estrito; `index.html` segue acima do teto antigo e deve virar refator futura.
- `npm run codex:health` OK.
- Evidencias: `output/v31-final-audit/home-skip-intro.png`, `popup-raiane.png`, `intro-ready.png`, `intro-playing.png`, `after-intro.png`.

## Next

- Commitar somente arquivos publicos/memoria desta rodada e nao incluir lixo temporario.
- Subir `main` para GitHub/Render.
- Checar online em `https://catalogo-cruzeiro-web.onrender.com/`.
- Proxima etapa: ligar IA online via PC local exige tunel/host seguro para o Ollama ou runner local; `127.0.0.1` no Render nao aponta para este PC.
