# FLUXO GERAL — Catálogo Cruzeiro do Sul
## Hierarquia de Prioridades e Chefe Call

---

## 1. FLUXO DE PRIORIDADES DO SITE

### 1.1 Hierarquia de Destaques (Topo → Rodapé)

```
┌─────────────────────────────────────────────────────────────┐
│  TOPO DO SITE — FLUXO DE DESTAQUES                        │
│  (O que o usuário vê primeiro, sempre)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CAMADA 1 — LOCAL (Cruzeiro do Sul + Vale do Jurua)       │
│  ═══════════════════════════════════════════════════════    │
│  Prioridade ABSOLUTA. Sempre em primeiro lugar.            │
│  • Cruzeiro do Sul                                         │
│  • Tavares                                               │
│  • Mâncio Lima                                            │
│  • Rodrigues Alves                                        │
│  • Porto Walter                                            │
│  • Marechal Thaumaturgo                                    │
│  • Região do Vale do Jurua                                 │
│                                                             │
│  CAMADA 2 — REGIONAL (Purus)                              │
│  ═══════════════════════════════════════════════════════    │
│  Segunda prioridade. Quando não há conteúdo local.          │
│  • Sena Madureira                                         │
│  • Manuel Urbano                                          │
│  • Assis Brasil                                            │
│  • Santa Rosa do Purus                                     │
│  • Região do Purus                                         │
│                                                             │
│  CAMADA 3 — ESTADUAL (Acre)                               │
│  ═══════════════════════════════════════════════════════    │
│  Terceira prioridade.                                       │
│  • Rio Branco                                             │
│  • Acre overall                                            │
│  • outras cidades                                          │
│                                                             │
│  CAMADA 4 — NACIONAL (Brasil)                            │
│  ═══════════════════════════════════════════════════════    │
│  Quarta prioridade. Governo, política, economia.          │
│  • Brasília                                               │
│  • Política                                               │
│  • Economia                                               │
│  • Sociedade                                              │
│                                                             │
│  CAMADA 5 — INTERNACIONAL (Mundo)                         │
│  ═══════════════════════════════════════════════════════    │
│  Quinta prioridade.                                        │
│  • Américas                                               │
│  • Mundo                                                  │
│  • Tecnologia/Global                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Feed Hierárquico — Implementação

```javascript
// FLUXO DE FEED — Prioridade de exibição
const FEED_PRIORITY = {
  LOCAL: {
    regions: ['cruzeiro-do-sul', 'vale-do-jurua', 'tavares', 'mancio-lima', 'rodrigues-alves', 'porto-walter', 'marechal-thaumaturgo'],
    weight: 100,
    label: 'Cruzeiro do Sul & Vale do Jurua'
  },
  PURUS: {
    regions: ['purus', 'sena-madureira', 'manuel-urbano', 'assis-brasil', 'santa-rosa-do-purus'],
    weight: 80,
    label: 'Purus'
  },
  ACRE: {
    regions: ['acre', 'rio-branco', 'acre-other'],
    weight: 60,
    label: 'Acre'
  },
  BRASIL: {
    topics: ['governo', 'politica', 'economia', 'sociedade', 'brasil'],
    weight: 40,
    label: 'Brasil'
  },
  MUNDO: {
    topics: ['internacional', 'mundo', 'tecnologia', 'america-latina'],
    weight: 20,
    label: 'Mundo'
  }
};

// Exemplo de query hierárquica
async function fetchNewsByPriority(limit = 20) {
  const local = await fetch(`./api/news?regions=${FEED_PRIORITY.LOCAL.regions.join(',')}&limit=5`);
  const purus = await fetch(`./api/news?regions=${FEED_PRIORITY.PURUS.regions.join(',')}&limit=3`);
  const acre = await fetch(`./api/news?regions=${FEED_PRIORITY.ACRE.regions.join(',')}&limit=3`);
  const brasil = await fetch(`./api/news?topics=${FEED_PRIORITY.BRASIL.topics.join(',')}&limit=4`);
  const mundo = await fetch(`./api/news?topics=${FEED_PRIORITY.MUNDO.topics.join(',')}&limit=5`);
  
  return [
    ...local,
    ...purus,
    ...acre,
    ...brasil,
    ...mundo
  ];
}
```

### 1.3 Seções do Site — Hierarquia Visual

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
│  Logo | Busca | Menu                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  DESTAQUE PRINCIPAL — CAMADA 1 (LOCAL)              │    │
│  │  Notícia mais importante de Cruzeiro do Sul/Vale     │    │
│  │  do Jurua. Imagem grande + título + resumo.         │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  CAMADAS DO FEED:                                           │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ CAMADA 2 (PURUS)   │  │ CAMADA 3 (ACRE)    │            │
│  │ Cards menores       │  │ Cards menores       │            │
│  └────────────────────┘  └────────────────────┘            │
│  ┌──────────────────────────────────────────────┐           │
│  │ CAMADA 4 (BRASIL)                           │           │
│  │ Cards horizontais                            │           │
│  └──────────────────────────────────────────────┘           │
│  ┌──────────────────────────────────────────────┐           │
│  │ CAMADA 5 (MUNDO)                            │           │
│  │ Cards compactos                              │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  SEÇÃO TV — Vídeos do YouTube                               │
│  ┌──────────────────────────────────────────────┐           │
│  │ TV CATÁLOGO — YouTube embeds                 │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  SEÇÃO INSTAGRAM — Wife                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │ @esposa — Instagram feed da esposa           │           │
│  │ (canal separado, não misturado com news)     │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  FOOTER — Serviços | Mapa do Site | Contato                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. CHEFE CALL — Sistema de Agentes Autônomos

### 2.1 O que é o Chefe Call

```
┌─────────────────────────────────────────────────────────────┐
│  CHEFE CALL                                                 │
│  Sistema de agentes trabalhando 24/7 para melhorar          │
│  o site automaticamente todo dia.                          │
│                                                             │
│  NÍVEL 1 — CHEFE (Superintendência)                        │
│  └── Analisa métricas, delega tarefas                      │
│  └── Identifica oportunidades de melhoria                   │
│  └── Aprende com resultados                                 │
│                                                             │
│  NÍVEL 2 — GERENTES (Orquestradores)                       │
│  ├── Agente de Conteúdo                                     │
│  │   └── Busca, filtra, sugere notícias                    │
│  ├── Agente de Design                                       │
│  │   └── Sugere melhorias visuais                          │
│  ├── Agente de Performance                                  │
│  │   └── Monitora velocidade, sugere otimizações            │
│  └── Agente de SEO                                          │
│      └── Monitora索引, sugere melhorias                     │
│                                                             │
│  NÍVEL 3 — TRABALHADORES (Execução)                        │
│  ├── Scraper — busca conteúdo                               │
│  ├── Editor — formata e limpa conteúdo                      │
│  ├── QA — verifica qualidade                                │
│  └── Deployer — publica alterações                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Ciclo Diário do Chefe Call

```
CADA DIA (loop contínuo):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DIA → CHECKLIST DE TAREFAS AUTOMÁTICAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☐ 06:00 — Chefe acorda
   ├── Lê métricas do dia anterior (analytics, speed, errors)
   ├── Identifica 3 prioridades para hoje
   └── Acorda Gerentes com briefing

☐ 06:30 — Gerente de Conteúdo
   ├── Verifica feeds de fontes (RSS, YouTube, Instagram)
   ├── Seleciona TOP 20 notícias do dia
   ├── Verifica regionalização (Cruzeiro/Purus/Acre/Brasil/Mundo)
   └── Sugere novo conteúdo para o feed

☐ 07:00 — Gerente de Design
   ├── Verifica CTR dos cards
   ├── Testa 1 nova ideia de layout (A/B)
   ├── Atualiza design tokens se preciso
   └── Sugere melhorias visuais

☐ 07:30 — Gerente de Performance
   ├── Verifica Core Web Vitals
   ├── Identifica bottlenecks
   ├── Otimiza imagens, CSS, JS
   └── Faz deploy de melhorias de speed

☐ 08:00 — Gerente de SEO
   ├── Verifica indexing do Google
   ├── Atualiza sitemap
   ├── Verifica backlinks
   └── Sugere melhorias de schema/metadata

☐ 08:30 — Trabalhadores
   ├── Executam tarefas delegadas
   ├── Publicam alterações
   └── Reportam para Gerentes

☐ 09:00 — Review do Chefe
   ├── Avalia resultados
   ├── Aprende com erros
   ├── Planeja amanhã
   └── Relatório para o Dono (Junior)

CADA SEMANA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☐ Segunda — Análise semanal
   ├── Ranking de notícias mais vistas
   ├── Mapa de calor de cliques
   ├── Nova lista de fontes
   └── Prioridades da semana

☐ Sexta — Sprint review
   ├── O que funcionou
   ├── O que não funcionou
   └── Ajustes para próxima semana

CADA MÊS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☐ Relatório mensal
   ├── Crescimento de usuários
   ├── Receita (se houver ads)
   ├── Novos recursos
   └── Roadmap para próximo mês
```

### 2.3 Stack Técnico do Chefe Call

```yaml
CHEFE_CALL_STACK:
  Cerebro:
    - GPT-5 (decisões estratégicas)
    - Claude (análise profunda)
    - Ollama local (tarefas baratas)

  Agentes:
    - Hermes Cron Jobs (orquestrador)
    - Rayxpx Loops (executor)
    - Scripts Python (trabalhadores)

  Monitoramento:
    - SpeedVitals (Core Web Vitals)
    - Google Analytics (tráfego)
    - Sentry (erros)
    - UptimeRobot (uptime)

  Conteúdo:
    - RSS Aggregator (fontes RSS)
    - YouTube Data API (vídeos)
    - Instagram Graph API (feed esposa)
    - Scrapers custom (fontes específicas)

  Deploy:
    - GitHub Actions (CI/CD)
    - GitHub Pages / Vercel (hosting)
    - Cloudflare (CDN)

  Comunicação:
    - Telegram (alertas para Junior)
    - WhatsApp (relatórios)
    - Discord (logs dos agentes)
```

### 2.4 Métricas que o Chefe Call Monitora

```javascript
CHEFE_CALL_METRICS = {
  performance: {
    LCP: 'Largest Contentful Paint (meta: < 2.5s)',
    FID: 'First Input Delay (meta: < 100ms)',
    CLS: 'Cumulative Layout Shift (meta: < 0.1)',
    TTFB: 'Time to First Byte (meta: < 800ms)',
    INP: 'Interaction to Next Paint (meta: < 200ms)'
  },
  negocio: {
    usuarios_unicos: 'Usuários por dia/semana/mês',
    pageviews: 'Visualizações de página',
    tempo_na_pagina: 'Duração média da sessão',
    bounce_rate: 'Taxa de rejeição',
    ctr: 'Click-through rate dos cards'
  },
  conteudo: {
    novas_noticias: 'Notícias adicionadas por dia',
    fontes_ativas: 'Fontes que estão funcionando',
    cobertura_regional: ' % de notícias por região'
  },
  seo: {
    indexing: 'Páginas indexadas no Google',
    keywords_ranking: 'Posição em palavras-chave',
    backlinks: 'Links de volta',
    core_keywords: 'Palavras-chave principais'
  },
  financeiro: {
    receita_ads: 'Ganhos com anúncios',
    custo_server: 'Custo de hospedagem',
    roi: 'Retorno sobre investimento'
  }
};
```

### 2.5 Fluxo de Aprendizado do Chefe Call

```
CHEFE CALL — APRENDIZADO CONTÍNUO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    ┌─────────────────┐
                    │   DADOS COLETADOS│
                    │  (métricas, logs,│
                    │   feedback)      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  ANÁLISE (GPT) │
                    │  Identifica     │
                    │  padrões        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  HIPÓTESES      │
                    │  Gera teorias   │
                    │  sobre o que    │
                    │  funciona       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  EXPERIMENTOS    │
                    │  Testa em A/B   │
                    │ 小心翼翼         │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ SUCESSO?        │
                    └────────┬────────┘
              ┌───────────────┼───────────────┐
              │ SIM           │ NÃO           │
              ▼               ▼               │
     ┌─────────────┐ ┌─────────────┐        │
     │  PADRONIZA   │ │  DESCARTAR  │        │
     │  Adota como  │ │  Volta ao   │        │
     │  padrão      │ │  anterior   │        │
     └─────────────┘ └─────────────┘        │
              │               │               │
              └───────────────┴───────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  MEMÓRIA        │
                    │  Salva como     │
                    │  skill/regras   │
                    │  para o futuro  │
                    └─────────────────┘
```

### 2.6 Como Ativar o Chefe Call

```bash
# 1. Criar cron jobs para cada agente
hermes cron create \
  --name "chefe-conteudo-manha" \
  --schedule "0 6 * * *" \
  --prompt "Agente de Conteúdo: Verificar feeds, selecionar TOP 20, sugerir conteúdo" \
  --skills "rayxpx-matrix-swarm-core,content-curation"

hermes cron create \
  --name "chefe-design-manha" \
  --schedule "30 6 * * *" \
  --prompt "Agente de Design: Verificar CTR, testar layout, atualizar tokens" \
  --skills "rayxpx-matrix-swarm-core,design-review"

hermes cron create \
  --name "chefe-performance-manha" \
  --schedule "0 7 * * *" \
  --prompt "Agente de Performance: Verificar Core Web Vitals, otimizar assets" \
  --skills "rayxpx-matrix-swarm-core,performance-audit"

hermes cron create \
  --name "chefe-seo-manha" \
  --schedule "30 7 * * *" \
  --prompt "Agente de SEO: Verificar indexing, atualizar sitemap, analisar keywords" \
  --skills "rayxpx-matrix-swarm-core,seo-audit"

# 2. Relatório diário para Junior (Telegram)
hermes cron create \
  --name "relatorio-diario-chefe" \
  --schedule "0 9 * * *" \
  --prompt "Compilar métricas do Chefe Call, enviar resumo para Junior via Telegram" \
  --deliver "telegram:Silca Jr"
```

---

## 3. RESUMO EXECUTIVO

```
┌─────────────────────────────────────────────────────────────┐
│  RESUMO — O QUE PRECISAMOS FAZER                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. FLUXO DE PRIORIDADES DO SITE                           │
│     ✓ Cruzeiro do Sul/Vale do Jurua = PRIORIDADE 1        │
│     ✓ Purus = PRIORIDADE 2                                  │
│     ✓ Acre = PRIORIDADE 3                                   │
│     ✓ Brasil/Mundo = PRIORIDADE 4-5                        │
│     → Implementar no front-end com peso de região          │
│                                                              │
│  2. CHEFE CALL (Agentes Autônomos)                         │
│     → Sistema de agentes melhorando o site todo dia        │
│     → Loop: coletar → analisar → experimentar → aprender   │
│     → Cron jobs rodando 24/7                               │
│     → Relatórios diários para Junior no Telegram           │
│                                                              │
│  3. PERFORMANCE DO SITE (URGENTE)                          │
│     → Lazy loading de imagens                               │
│     → CSS crítico inline                                    │
│     → Fonts com font-display: swap                         │
│     → Remover scripts bloqueantes                           │
│     → Service worker para cache                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘

PRÓXIMOS PASSOS:
1. Corrigir performance do site (URGENTE)
2. Implementar hierarquia de regiões no feed
3. Ativar Chefe Call com cron jobs
4. Conectar relatório ao Telegram de Junior
```

---

Criado em: 2026-06-02
Rayxpx Matrix Swarm Core | Hermes para Junior Play
