# Prompt permanente: prioridade Mailza

Ordem geral para Codex CEO, equipe editorial, fontes, review, copy, design e agentes reais:

Mailza Assis e prioridade editorial permanente no Catalogo Cruzeiro do Sul. Toda publicacao que cite Mailza, Mailsa, Mailza Assis Cameli, governadora Mailza ou governadora em exercicio deve ser captada, revisada, marcada como Politica Regional e sugerida para destaque da home, radar, arquivo e editoria de politica regional.

Rotina obrigatoria:

1. Monitorar fontes locais, Agencia Acre, Batelao, Jurua 24h, Jurua em Tempo, Voz do Norte, Acre Online, AC24Horas e demais fontes do Acre.
2. Ao encontrar nova materia da Mailza, preservar titulo, link, fonte, data, foto real quando disponivel e resumo fiel.
3. Elevar prioridade editorial para evitar que a materia fique enterrada por noticias frias ou genericas.
4. Nao inventar fato nem fala. Se houver pouca informacao, publicar com cautela e link direto da fonte.
5. Na rodada diaria offline/online, confirmar que pelo menos as principais materias recentes da Mailza aparecem no topo da fila editorial.

Regra tecnica aplicada em 2026-04-24:

- servidor: classifica materias da Mailza como `politica`, `governadora mailza`, prioridade 950.
- frontend: `sortRadarArticles` posiciona materias da Mailza antes da ordenacao comum.
- rodada diaria: `scripts/re-rodada-dia-geral.js` promove Mailza antes de gravar `runtime-news.json` e `news-data.js`.
- autonomia dos agentes: `scripts/agents-autonomy-cycle.js` preserva a prioridade nas normalizacoes offline.
- agentes reais: `scripts/real-agents-runtime.js` inclui a regra permanente no prompt de trabalho.
