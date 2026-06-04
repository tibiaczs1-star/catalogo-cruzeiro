# Handoff

Updated: 2026-06-04T21:27:28.632Z

V8 intro hard lock aplicado em index.html + assets/v8-final/v8-merge-ready.css/js. O problema reportado pelo usuario era o site aparecer 2x durante a intro; agora a intro usa body::before como cobertura escura e mantem #cinematicLoader acima ate html.czs-intro-release. CDP em http://127.0.0.1:3000/?forceIntro=1&hardlockTest=1 confirmou pass=true e leaks=[].

## Next

- Manter deploy/push aguardando aval do usuario
- evitar staging de arquivos paralelos sujos

## Files In Focus

- index.html
- assets/v8-final/v8-merge-ready.css
- assets/v8-final/v8-merge-ready.js
- .codex-temp/czs-v8-intro-hardlock-20260604/intro-hardlock-report.json

## Related Orders

- 2026-06-04-corrigir-vazamento-visual-do-site-durante-a-intro-v8
