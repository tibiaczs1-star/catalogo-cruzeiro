# Reuniao De Decisao - Redesign Premium CZS

Data base: 2026-06-01

## Objetivo

Decidir a direcao final da nova `divulgue.html` antes de mexer novamente na pagina publica.

A pagina final deve vender o CZS como jornal, catalogo, tecnologia e motor de propagacao local. Ela precisa ser premium, cinematografica, funcional, com dados reais, demonstracao tecnica e prova comercial.

## Material Obrigatorio Antes Da Reuniao

- `docs/commercial/czs-premium-research-operation-2026-06-01.md`
- `docs/commercial/czs-premium-research-synthesis-2026-06-01.md`
- `docs/commercial/research/czs-premium-corpus-2026-06-01.csv`
- `docs/commercial/research/screening/czs-premium-corpus-screening-2026-06-01.jsonl`
- `docs/commercial/research/screening/czs-premium-corpus-screening-summary-2026-06-01.json`
- `node scripts/commercial-research-corpus-audit.js`
- Open Design em `C:\Users\junio\open-design`
- `docs/CZS_PRODUCT_MASTER_RULES.md`

## Evidencia De Pesquisa

Corpus auditado:

- 3000 URLs unicas;
- 500 landings de jornais;
- 500 landings de tecnologia;
- 1000 referencias/candidatos de media kit jornalistico;
- 1000 relatorios/listagens de venda de websites;
- 2000 entradas coletadas;
- 1000 candidatos de media kit ainda pendentes de triagem visual.

Leitura operacional:

- 3000 referencias processadas linha a linha;
- 2035 leituras OK por HTML acessivel ou dado estruturado;
- 965 falhas/bloqueios/rotas ausentes registradas;
- sintese principal em `docs/commercial/czs-premium-research-synthesis-2026-06-01.md`.

## Decisoes A Tomar

1. Tom visual principal:
   - painel regional premium;
   - sala de maquinas tecnologica;
   - media kit jornalistico;
   - relatorio de comprador/cota.

2. Hierarquia da primeira dobra:
   - vender anuncio imediato;
   - vender tecnologia;
   - vender jornal confiavel;
   - vender cota/participacao.

3. Provas que entram na pagina:
   - noticias dos ultimos 3 dias;
   - fontes e cobertura;
   - 200 agentes;
   - 108 rotas API;
   - catalogo de servicos;
   - PubPaid;
   - SEO e indexacao;
   - Instagram/WhatsApp sem prometer metricas nao verificadas.

4. Estilo Open Design:
   - base `wired` para energia jornal/tech;
   - base `openai` para maturidade e respiro;
   - base `dashboard` para graficos e operacao;
   - base `warm-editorial` para narrativa regional.

5. Demonstracoes obrigatorias:
   - graficos reais;
   - rede de agentes;
   - fluxo noticia -> catalogo -> anuncio -> WhatsApp -> Google;
   - painel de 3 dias;
   - cards de produtos comerciais;
   - CTA de venda simples.

## Criterios De Aprovacao

- A pagina nao pode parecer flyer.
- A tecnologia precisa aparecer como sistema operando, nao como frase solta.
- A narrativa precisa ser hiperlocal: Vale do Jurua, Cruzeiro do Sul, Acre.
- Dados fracos ou locais/teste devem ser rotulados corretamente.
- O visual deve sobreviver em mobile sem texto esmagado.
- SEO precisa incluir titulo, descricao, canonical, OG/Twitter, JSON-LD, sitemap e linguagem comercial coerente.

## Saida Esperada

- Um prototipo isolado via Open Design;
- uma matriz de secoes aprovadas;
- depois port para `divulgue.html`, `divulgue.css` e ajustes de SEO;
- validacao local com screenshot desktop/mobile;
- revisao `npm run review:team`;
- publicacao e verificacao online no Render.
