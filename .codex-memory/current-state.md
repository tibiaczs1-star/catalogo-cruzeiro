# Current State

Updated: 2026-05-01T02:20:00.000Z

## Active Goal

- Home mais leve e Fofocas & Polemicas como manchetes reais de redes

## Summary

Usuario disse que o site inteiro ainda estava lento e que a area de fofocas deveria captar novidades reais das redes, com manchetes do que esta rolando e sem leitura de opiniao. `index.html` agora pre-carrega `api/news` e `api/social-trends` no head, deixa `news-data.js` e scripts laterais para depois do load e tira CSS/imagens secundarias do caminho critico. `script.js` consome o preload social e monta Fofocas & Polemicas como manchetes curtas de repercussao, com aviso de termometro e nao noticia confirmada. Medicao local melhorou de DCL ~5,1s/load ~11,2s para mobile DCL ~1,3s/load ~2,9s.

## Next

- Commitar/publicar o pacote de performance sem PubPaid; conferir producao com cache-bust `home-fast-social1`.
