# CZS Premium Research Operation - 2026-06-01

## Missao

Transformar a landing `divulgue.html` em uma peca premium que funcione ao mesmo tempo como:

- apresentacao do site/jornal Catálogo CZS;
- landing de venda para anunciantes;
- relatorio comercial para comprador/cotista;
- demonstração de tecnologia, agentes, automacao e distribuicao;
- media kit vivo do Vale do Jurua.

O objetivo nao e apenas ficar bonito. A pagina precisa parecer confiavel, vendavel, regional, tecnologica e madura.

## Ordem Do Usuario

Estudar, com contagem controlada:

- 500 landing pages de jornais/medias;
- 500 landing pages de tecnologia/SaaS/produtos digitais;
- 1000 relatorios/listagens de venda de websites;
- 1000 relatorios/media kits/relatorios comerciais de jornais;
- agentes online e offline;
- Open Design como assistente de criacao visual;
- reuniao posterior antes de redesenhar de novo.

## Status Do Corpus

Corpus rastreavel:

`docs/commercial/research/czs-premium-corpus-2026-06-01.csv`

Coletor reproduzivel:

`node scripts/commercial-research-corpus-collect.js`

Auditor:

`node scripts/commercial-research-corpus-audit.js`

Resultado auditado em 2026-06-01:

- total: 3000 linhas unicas;
- 500 `newspaper_landing`, coletadas do `newshomepages/sources/sites.csv`;
- 500 `technology_landing`, coletadas de sitemaps Lapa Ninja, Landdding, SaaSFrame e Landingfolio;
- 1000 `newspaper_media_kit_report`, geradas como candidatos por dominio a partir de publishers reais do NewsHomepages;
- 1000 `website_sales_report`, coletadas da API publica de listagens vendidas da Empire Flippers;
- 2000 linhas com status `collected`;
- 1000 linhas com status `candidate_unverified`, que nao devem ser usadas como citacao visual sem triagem ao vivo.

Regra de honestidade: a contagem exata agora existe como corpus de pesquisa. A proxima etapa e pontuar/triagem visual dos candidatos, nao fingir que cada pagina ja foi lida manualmente.

## Status Da Leitura Operacional

Leitor:

`node scripts/commercial-research-corpus-screen.js`

Sintese:

`node scripts/commercial-research-synthesis.js`

Arquivos gerados:

- `docs/commercial/research/screening/czs-premium-corpus-screening-2026-06-01.jsonl`
- `docs/commercial/research/screening/czs-premium-corpus-screening-summary-2026-06-01.json`
- `docs/commercial/research/screening/czs-premium-corpus-screening-report-2026-06-01.md`
- `docs/commercial/czs-premium-research-synthesis-2026-06-01.md`

Resultado da leitura:

- 3000 referencias processadas;
- 2035 leituras OK por HTML acessivel ou dado estruturado;
- 965 falhas/bloqueios/rotas ausentes registradas;
- 500 jornais, 500 landings tech, 1000 media kits/candidatos e 1000 relatorios/listagens de venda lidos em formato estruturado;
- cada linha do JSONL registra o que a referencia e, como funciona, sinais visuais, sinais comerciais, sinais tecnicos, metricas de pagina e licao para o CZS.

Regra de uso: a leitura operacional serve como base de conhecimento para reuniao e prototipo. Exemplos com acesso falho nao entram como referencia visual aprovada, mas ajudam a mapear ausencias e padroes ruins de descoberta.

## Estado Atual Da Ferramenta Open Design

Open Design local:

`C:\Users\junio\open-design`

Preparacao realizada:

- Node local: `v24.14.1`;
- pnpm local: `10.33.2`;
- `pnpm install` concluido;
- repo limpo, mas atras de `origin/main` em 617 commits;
- inventario local encontrado: 151 design systems, 110 templates, 1 live artifact template.

Open Design deve ser usado como biblioteca de direcao visual e prototipacao isolada. O resultado final deve ser portado manualmente para o Projeto Codex, respeitando `docs/CZS_PRODUCT_MASTER_RULES.md`.

## Open Design - Combinações Recomendadas

### Landing Comercial

- Skill: `design-templates/saas-landing/SKILL.md`
- Design systems candidatos:
  - `design-systems/wired/DESIGN.md`
  - `design-systems/openai/DESIGN.md`
  - `design-systems/theverge/DESIGN.md`
  - `design-systems/warm-editorial/DESIGN.md`

Uso no CZS: gerar estrutura de venda, hero, prova, produtos, pacotes e CTA. Nao copiar a estetica SaaS diretamente.

### Relatorio / Deck De Vendas

- Skill: `design-templates/html-ppt/SKILL.md`
- Skill: `design-templates/html-ppt-weekly-report/SKILL.md`
- Skill: `design-templates/html-ppt-taste-editorial/SKILL.md`
- Template: `templates/live-artifacts/otd-operations-brief/`

Uso no CZS: relatorio comercial, numeros de 3 dias, provas, cotas, risco, plano de 90 dias e fechamento.

### Painel Diario Hiperlocal

- Skill: `design-templates/dashboard/SKILL.md`
- Design systems:
  - `design-systems/dashboard/DESIGN.md`
  - `design-systems/wired/DESIGN.md`

Uso no CZS: transformar "tecnologia" em painel util: rio, clima, saúde, energia, transito, alertas, fontes, status e desempenho comercial.

### Manifesto Editorial

- Skill: `design-templates/magazine-poster/SKILL.md`
- Design systems:
  - `design-systems/warm-editorial/DESIGN.md`
  - `design-systems/editorial/DESIGN.md`

Uso no CZS: narrativa de confiança, "painel diario do Vale do Jurua", missao e proposta regional.

## Agentes De Pesquisa Delegados

### Agente A - Landing Tech E Premium

Escopo: 500 landing pages de tecnologia/SaaS/produtos digitais e 500 landing pages premium gerais.

Conclusao principal: CZS nao deve copiar SaaS escuro. Deve virar painel regional premium: velocidade de dashboard, confianca de jornal, clareza de servico publico e hierarquia visual de produto digital bom.

Fontes/corpos indicados:

- Lapa Ninja;
- Land-book;
- Landingfolio;
- SaaSFrame;
- One Page Love;
- WebInspoo;
- Godly;
- Awwwards;
- Siteinspire;
- Page Collective;
- Mobbin.

### Agente B - Jornais, Media Kits E Relatorios De Midia

Escopo: 500 homepages/sites de jornais digitais e 1000 media kits/relatorios comerciais de jornais.

Conclusao principal: media kit moderno vende audiencia local, confianca e solucao mensuravel. CZS deve vender "atencao local + confianca editorial + conversao para comercio local".

Padroes de UX editorial:

- 1 manchete dominante;
- 2 a 4 chamadas secundarias;
- ultimas;
- mais lidas;
- editorias;
- newsletter/distribuicao;
- blocos de servico;
- prova de confianca.

### Agente C - Open Design

Escopo: ferramentas, skills, templates e design systems.

Conclusao principal: usar Open Design para prototipar e obter direcao visual, nao copiar automaticamente para producao.

Melhor trio:

- `wired` para jornal + tecnologia;
- `openai` para freio premium e limpeza;
- `dashboard` para paineis, metricas e operacao.

### Agente D - Inventario Tecnico Do Projeto Codex

Escopo: evidencias locais do CZS.

Provas fortes:

- backend/API propria;
- monitoramento diario de noticias;
- arquivo local com 480 noticias;
- dados recentes de 3 dias;
- fontes locais/oficiais;
- auditoria editorial automatizada;
- equipe local de revisao;
- 186 agentes locais no registry;
- analytics proprio;
- catalogo comercial;
- catalogo telefonico;
- PubPaid;
- SEO tecnico;
- Render configurado.

Ressalvas:

- analytics locais incluem muito teste/local;
- logs Instagram/WhatsApp nao substituem Insights oficiais;
- PubPaid com dinheiro real ainda exige cuidado juridico;
- sitemap/lastmod precisa verificacao antes de vender como SEO vivo.

### Agente E - Relatorios De Venda De Websites E Investor Decks

Escopo: relatorios de venda de websites, investor decks, media kits SaaS e sales enablement.

Conclusao principal: comprador serio nao compra site bonito. Compra maquina economica: receita, margem, recorrencia, risco, crescimento, ativos transferiveis e prova.

Para CZS:

- separar real, testado, potencial e especulativo;
- nao vender metrica de vaidade;
- mostrar funil: proposta -> campanha -> leads/mensagens -> renovacao;
- mostrar uso do capital e plano de 90 dias.

## Corpus Exato - Metodo De Contagem

Para cumprir a contagem sem mentira:

1. Criar base tabular `docs/commercial/research/czs-premium-corpus-2026-06-01.csv`.
2. Cada linha deve ter:
   - `id`;
   - `category`;
   - `source_group`;
   - `url`;
   - `title`;
   - `type`;
   - `region`;
   - `notes`;
   - `visual_patterns`;
   - `sales_patterns`;
   - `czs_relevance`;
   - `status`.
3. Metas:
   - 500 `newspaper_landing`;
   - 500 `technology_landing`;
   - 1000 `newspaper_media_kit_report`;
   - 1000 `website_sales_report`.
4. Status permitido:
   - `seeded`;
   - `fetched`;
   - `screened`;
   - `scored`;
   - `rejected`.
5. Nao contar item duplicado por URL normalizada.
6. Nao dizer "estudado" ate estar `screened` ou `scored`.

## Regras Para O Redesign CZS

### Nao Negociaveis

- CZS e painel diario hiperlocal do Vale do Jurua.
- A pagina comercial nao pode parecer portal generico, flyer ou cassino tech.
- Tecnologia precisa explicar poder real: fontes, rotas, agentes, analytics, automacao, relatorios e distribuicao.
- A landing precisa vender sem comprometer confianca editorial.
- Anuncio/comercial deve ser claramente separado de noticia.

### Direcao Visual

Misturar:

- densidade editorial do `wired`;
- calma premium do `openai`;
- dados operacionais do `dashboard`;
- calor local/editorial do `warm-editorial`.

Evitar:

- dark mode pesado sem leitura;
- 3D decorativo;
- dashboard falso;
- excesso de cards iguais;
- "AI slop";
- texto em ingles na interface publica;
- numeros sem ressalva.

## Blueprint Da Proxima Landing

1. Hero:
   - "CZS Para Empresas";
   - promessa de sistema local;
   - prova imediata;
   - visual real do produto, nao mockup aleatorio.
2. Painel Diario:
   - jornal, fontes, servicos, catalogo, alertas.
3. Motor Comercial:
   - jornal -> catalogo -> social -> WhatsApp -> relatorio.
4. Provas:
   - 480 noticias;
   - dados de 3 dias;
   - 186/200 agentes com explicacao;
   - 108 rotas API se confirmado;
   - 12 modulos e 49 ofertas;
   - logs de distribuicao com ressalvas.
5. Tecnologia:
   - backend;
   - analytics;
   - SEO;
   - agentes;
   - PubPaid;
   - Render.
6. Pacotes:
   - Presenca Local;
   - Movimento;
   - Dominancia Local;
   - Cota estrategica.
7. Relatorio:
   - grafico de tracao;
   - inventario;
   - riscos;
   - plano de 90 dias.
8. CTA:
   - WhatsApp;
   - formulario curto;
   - PDF/media kit.

## Proxima Reuniao

Antes de novo redesign, decidir:

1. Publico principal da landing:
   - anunciante local;
   - comprador/cotista;
   - ambos, com abas/secoes separadas.
2. Tom visual:
   - jornal premium;
   - tech dashboard;
   - investor deck;
   - hibrido controlado.
3. Metricas que podem aparecer sem ressalva.
4. O que precisa ser rotulado como "operacional/local/teste".
5. Se o relatorio PDF deve ser o produto principal ou apoio da landing.
