# Handoff

Updated: 2026-06-05T04:45:00.000Z

Rodada corretiva V8/CZS pronta para commit/deploy.

## O que foi feito

- `assets/v8-final/v8-merge-ready.js` e CSS: correções de hash, galeria premium, fontes de vídeo, área jovem, comunidade, serviços e prevenção de cards/fotos falsas.
- `index.html`: JSON embutido rebuildado com 480 itens, cache-bust `20260605-v8-public-corrective-pass-v5`, fallback antigo do panorama removido dos `onerror` renderizados.
- `backend/source-config.js`: adicionadas fontes testadas Portal Acre, O Alto Acre, Estado do Acre, Acre Noticias, Acre Agora e A Gazeta do Acre.
- `scripts/hydrate-source-screenshots.js`: novo hidratador de prints da fonte para matérias sem imagem.
- Dados atualizados: 371 capturas, 218 itens de hoje, 360 ativos, 480 no arquivo; 103 itens com print de fonte.

## Validação local

- URL local: `http://127.0.0.1:3001/?skipIntro=1`.
- `node --check` OK para bundle V8, scripts de captação/hidratação e `server.js`.
- CDP smoke OK para `#feed`, `#videos`, `#galeriaFotos`, `#areaJovem`, `#comunidade`, `#servicos`.
- Capturas internas em `.codex-temp/screenshots/cdp-*-v5.png`; galeria final em `.codex-temp/screenshots/cdp-galeriaFotos-v5b.png`.
- `npm run review:team` passou; PubPaid guard OK; 0 achados nos arquivos tocados.

## Pendente conhecido

- `git diff --check` global aponta whitespace em `data/editorial-health-report.md`, fora do escopo e já sujo. Não stagear isso nesta rodada.
- 7 fontes sem imagem continuam como pendência de Cheffe Call porque Chrome headless não capturou: e-SAJ/TJAC e URLs do Voz do Norte.

## Próximo passo

Stage seletivo, commit, push em `main`, deploy Render e verificação online em `https://catalogo-cruzeiro-web.onrender.com/?skipIntro=1`.
