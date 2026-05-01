# Handoff

Updated: 2026-05-01T02:20:00.000Z

Rodada de performance da home: usuario reclamou que todo o site seguia lento. Caminho inicial foi aliviado: `api/news` e `api/social-trends` pre-carregam no head, `news-data.js` e scripts laterais carregam depois do `load`, CSS/imagens secundarias sairam da primeira fila. Fofocas & Polemicas agora mostra manchetes curtas de repercussao real das redes, sem opiniao e com aviso de que e termometro, nao noticia confirmada. PubPaid segue fora do pacote.

## Next

- Commitar/publicar `index.html`, `script.js`, `styles.css` e memorias relacionadas
- conferir producao com `home-fast-social1`.
