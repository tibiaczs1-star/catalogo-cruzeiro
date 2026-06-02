# PLANO DE MELHORIAS COMPLETO — Catálogo Cruzeiro do Sul
## 2026-06-02 | Design + Monetização + Chefe Call + Performance

---

## 1. FOOTER — PLANO DE MELHORIA

### 1.1 Estado Atual
- Footer rico com 5 seções (brand, sitemap, contact, newsletter, social)
- Fundo com imagem `footer-cruzeiro-bg.jpg`
- Tech stack com mapa + transparência legal
- Chat box funcional para mensagens

### 1.2 Problemas Identificados
- Sitemap genérico, não organizado por região
- Sem hierarquia clara (Vale do Juruá → Purus → Acre → Brasil)
- Newsletter sem integração real
- Redes sociais limitadas a 4 ícones
- Sem Call-to-Action forte para apoiadores

### 1.3 Melhorias Propostas

```
ANTES:
┌──────────────────────────────────────┐
│  Brand | Sitemap | Contact | Newsletter│
└──────────────────────────────────────┘

DEPOIS — FOOTER MEGA COM REGIÕES:
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ ☀️ VALE DO JURUÁ │  │ 🌊 PURUS         │  │ 🏛️ ACRE    │  │
│  │ [+] Cruzeiro Sul │  │ [+] Sena Mad.    │  │ [+] Rio Br. │  │
│  │ [+] Mâncio Lima  │  │ [+] Manuel Urb.  │  │ [+] Acre     │  │
│  │ [+] Rodrigues A. │  │ [+] Santa Rosa   │  │ [+] Interior │  │
│  │ [+] Porto Walter │  │                  │  │              │  │
│  │ [+] Marechal T.  │  │                  │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│  ┌────────────────────────────────┐  ┌────────────────────────┐  │
│  │ 🌍 BRASIL & MUNDO              │  │ 📡 SERVIÇOS            │  │
│  │ [+] Política | [+] Economia    │  │ [+] Catálogo telefônico│  │
│  │ [+] Tecnologia | [+] Internacional│ │ [+] Serviços locais   │  │
│  └────────────────────────────────┘  └────────────────────────┘  │
│  ────────────────────────────────────────────────────────────   │
│  NEWSLETTER: [email    ] [Inscrever]                          │
│  REDES SOCIAIS: IG | TT | YT | TT | FB | WA | TG             │
│  ────────────────────────────────────────────────────────────   │
│  © 2026 Catálogo Cruzeiro do Sul | Transparência | Mapa        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 CSS do Footer Novo

```css
/* Footer mega com accordion por região */
.footer-mega-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-6);
  padding: var(--space-8) 0;
  border-bottom: 1px solid var(--line);
}

.footer-region-accordion {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--duration-base) var(--ease-out);
}

.footer-region-accordion:hover {
  box-shadow: var(--shadow-glow-amber);
  transform: translateY(-2px);
}

.footer-region-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  font-weight: 700;
  font-size: var(--text-sm);
  cursor: pointer;
  background: linear-gradient(135deg, var(--copper-soft), var(--copper));
  color: white;
}

.footer-region-content {
  padding: var(--space-3);
}

.footer-region-content a {
  display: block;
  padding: var(--space-2) var(--space-3);
  color: var(--ink);
  text-decoration: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  transition: background var(--duration-fast);
}

.footer-region-content a:hover {
  background: var(--surface-soft);
  color: var(--copper);
}
```

---

## 2. SEÇÃO FUNDADORES — PLANO DE MELHORIA

### 2.1 Estado Atual
- Banner strip com 4 fundadores (Cafe Cruzeiro, Grupo A.S, Dra. Geane, Recommencer)
- 4 cards vazios para novos apoiadores
- CTAs: "Entrar no mural", "Ver formatos", "Falar com comercial"

### 2.2 Melhorias Propostas

```
ANTES — founders-banner-strip horizontal:
[ Cafe | Grupo A.S | Dra. Geane | Recommencer ]

DEPOIS — KARBAN VISUAL COM TIERS:
┌─────────────────────────────────────────────────────────┐
│  🏆 PATROCINADORES OURO          💎 PATROCINADORES PRATA │
│  ┌─────────┐ ┌─────────┐           ┌────────┐ ┌────────┐│
│  │ Cafe    │ │ Grupo   │           │ Dra    │ │ Recom. ││
│  │ Cruzeiro│ │ A.S     │           │ Geane  │ │        ││
│  └─────────┘ └─────────┘           └────────┘ └────────┘│
│                                                         │
│  🤝 FUNDADORES BRONZE                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Vaga 1│ │Vaga 2│ │Vaga 3│ │Vaga 4│ │Vaga 5│ ...   │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Badge Visual para Cada Tier

```css
/* Tier badges com glow */
.founder-banner-card[data-tier="ouro"] {
  border: 2px solid var(--gold);
  box-shadow: var(--shadow-glow-amber);
}

.founder-banner-card[data-tier="prata"] {
  border: 2px solid #c0c0c0;
  box-shadow: 0 0 12px rgba(192, 192, 192, 0.3);
}

.founder-banner-card[data-tier="bronze"] {
  border: 2px solid var(--copper);
  opacity: 0.85;
}

/* Animação de entrada */
@keyframes founderCardEntrance {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.founder-banner-card {
  animation: founderCardEntrance 0.5s var(--ease-out) backwards;
}
.founder-banner-card:nth-child(1) { animation-delay: 0ms; }
.founder-banner-card:nth-child(2) { animation-delay: 100ms; }
.founder-banner-card:nth-child(3) { animation-delay: 200ms; }
.founder-banner-card:nth-child(4) { animation-delay: 300ms; }
```

---

## 3. ESPAÇOS PARA ADS — PLANO DE MONETIZAÇÃO

### 3.1 Slots de Anúncio Atuais

```
Slot 1: ad-unit wide (970x250) — topo do feed
Slot 2: ad-unit (300x250) — entre radar e comunidade
Slot 3: sponsor-entry-card — entrada de patrocinadores
```

### 3.2 Novos Slots Propostos

```
SLOTS DE ANÚNCIO — HIERARQUIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POSIÇÃO         │ TAMANHO          │ TIPO          │ PREÇO EST.
────────────────┼──────────────────┼───────────────┼───────────
Topo (entre     │ 970x250 ou       │ Leaderboard   │ R$ 2.500/mês
header e hero)   │ 728x90           │               │
────────────────┼──────────────────┼───────────────┼───────────
Entre notícias  │ 300x250           │ Medium Rect   │ R$ 1.500/mês
(lateral)       │                  │               │
────────────────┼──────────────────┼───────────────┼───────────
Mid-content     │ 970x250 ou       │ Intersticial  │ R$ 3.000/mês
(entre seções)  │ 300x600          │               │
────────────────┼──────────────────┼───────────────┼───────────
Sidebar fixo     │ 160x600          │ Skyscraper    │ R$ 1.800/mês
────────────────┼──────────────────┼───────────────┼───────────
Footer          │ 970x250           │ Footer banner │ R$ 1.200/mês
────────────────┼──────────────────┼───────────────┼───────────
Native ads      │ In-feed          │ Sponsored     │ R$ 800/mês
(similar ao     │ 300x250          │ content       │
conteúdo)       │                  │               │
────────────────┼──────────────────┼───────────────┼───────────
WhatsApp/TikTok │ Story ad         │ Vertical 9:16 │ R$ 600/mês
(vídeo)         │ (formato reel)   │               │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3.3 Card de Anúncio Atraente

```css
/* Card de anúncio premium */
.ad-unit {
  position: relative;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(197, 109, 63, 0.08), rgba(44, 75, 108, 0.08));
  border: 1.5px solid var(--line);
  padding: var(--space-6);
  text-align: center;
  transition: all var(--duration-base) var(--ease-out);
  overflow: hidden;
}

.ad-unit::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(197, 109, 63, 0.05));
  opacity: 0;
  transition: opacity var(--duration-base);
}

.ad-unit:hover::before {
  opacity: 1;
}

.ad-unit:hover {
  border-color: var(--copper);
  box-shadow: var(--shadow-glow-amber);
  transform: translateY(-2px);
}

.ad-unit__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  background: var(--copper);
  color: white;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-3);
}

.ad-unit__price {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--copper);
  margin: var(--space-2) 0;
}

.ad-unit__features {
  list-style: none;
  padding: 0;
  margin: var(--space-4) 0;
  text-align: left;
}

.ad-unit__features li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  font-size: var(--text-sm);
  color: var(--muted);
}

.ad-unit__features li::before {
  content: "✓";
  color: var(--copper);
  font-weight: 700;
}
```

### 3.4 Página de Tarifação

```html
<!-- Nova seção: #monetizacao -->
<section id="monetizacao" class="ad-pricing-section">
  <div class="section-heading">
    <p class="eyebrow">para anunciantes</p>
    <h2>Espaços publicitários no Catálogo Cruzeiro do Sul</h2>
    <p>Visibilidade para sua marca junto ao público do Vale do Juruá e Acre.</p>
  </div>
  
  <div class="ad-pricing-grid">
    <!-- Planos -->
    <article class="ad-pricing-card" data-tier="bronze">
      <span class="ad-pricing-tier">Bronze</span>
      <span class="ad-pricing-price">R$ 800<span>/mês</span></span>
      <ul class="ad-pricing-features">
        <li>1 slot in-feed (300x250)</li>
        <li>Até 30 dias de exibição</li>
        <li>Relatório mensal de visualizações</li>
      </ul>
      <a href="#contact" class="outline-button">Quero anunciar</a>
    </article>
    
    <article class="ad-pricing-card featured" data-tier="prata">
      <span class="ad-pricing-tier">Prata</span>
      <span class="ad-pricing-price">R$ 1.500<span>/mês</span></span>
      <ul class="ad-pricing-features">
        <li>Slot lateral (300x250)</li>
        <li>Badge de "Patrocinador"</li>
        <li>Relatório quinzenal</li>
      </ul>
      <a href="#contact" class="solid-button">Quero anunciar</a>
    </article>
    
    <article class="ad-pricing-card featured" data-tier="ouro">
      <span class="ad-pricing-tier">Ouro</span>
      <span class="ad-pricing-price">R$ 2.500<span>/mês</span></span>
      <ul class="ad-pricing-features">
        <li>Leaderboard (970x250)</li>
        <li>Badge premium + logo no footer</li>
        <li>Relatório semanal + suporte</li>
      </ul>
      <a href="#contact" class="solid-button">Quero anunciar</a>
    </article>
    
    <article class="ad-pricing-card" data-tier="diamante">
      <span class="ad-pricing-tier">Diamante</span>
      <span class="ad-pricing-price">Sob consulta</span>
      <ul class="ad-pricing-features">
        <li>Todos os formatos</li>
        <li>Presença em todas as páginas</li>
        <li>Relatório em tempo real</li>
      </ul>
      <a href="#contact" class="outline-button">Falar com comercial</a>
    </article>
  </div>
</section>
```

---

## 4. CHEFE CALL — PLANO COMPLETO

### 4.1 Arquitetura de Agentes

```
┌─────────────────────────────────────────────────────────────┐
│                    CHEFE CALL v2                           │
│                 Orquestrador Central                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ANALISTA DE │  │ DESIGNER DE  │  │ ENGENHEIRO  │      │
│  │ CONTEÚDO    │  │ INTERFACE    │  │ DE PERFORMANCE│      │
│  │              │  │              │  │              │      │
│  │ • RSS feeds  │  │ • UX/UI      │  │ • Core Web  │      │
│  │ • YouTube    │  │ • A/B tests  │  │   Vitals    │      │
│  │ • Instagram  │  │ • Animações  │  │ • Lazy load │      │
│  │ • Fontes BR  │  │ • Glow FX    │  │ • CDN       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              EXECUTOR DE TAREFA                      │   │
│  │  • Cron jobs todos os dias às 6h, 12h, 18h         │   │
│  │  • GitHub Actions para deploy                       │   │
│  │  • Telegram para alertas e relatórios               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Cron Jobs do Chefe Call

```bash
# ANÁLISE DE CONTEÚDO — 6h todo dia
0 6 * * * curl -X POST "https://api.github.com/repos/tibiaczs1-star/catalogo-cruzeiro/dispatches" \
  -H "Authorization: token $GH_TOKEN" \
  -d '{"event_type":"chefe-content-analysis"}'

# AUDIT DE PERFORMANCE — 8h todo dia
0 8 * * * lighthouse https://catalogo-cruzeiro.github.io/catalogo-cruzeiro/ \
  --output=json --output-path=./performance-report.json

# GERAÇÃO DE RELATÓRIO — 9h todo dia
0 9 * * * node scripts/chefe-daily-report.js

# DEPLOY SE HOUVER MUDANÇAS — 10h todo dia
0 10 * * * bash scripts/chefe-deploy.sh

# VERIFICAÇÃO DE UPTIME — a cada 15 min
*/15 * * * * curl -f https://catalogo-cruzeiro.github.io/catalogo-cruzeiro/ \
  || curl -X POST "https://api.telegram.org/..." -d "chat_id=XXX" -d "text=⚠️ Site fora do ar!"
```

### 4.3 Métricas Monitoradas

```javascript
CHEFE_CALL_METRICS = {
  // Performance (Google PageSpeed Insights API)
  performance: {
    lighthouse_score: 'Performance 0-100',
    lcp: 'Largest Contentful Paint (s)',
    fid: 'First Input Delay (ms)',
    cls: 'Cumulative Layout Shift',
    fcp: 'First Contentful Paint (s)',
    ttfb: 'Time to First Byte (s)'
  },
  
  // Negócio
  negocio: {
    pageviews: 'via GitHub Pages analytics ou Cloudflare',
    bounce_rate: 'via analytics',
    avg_session: 'duração média',
    top_pages: 'páginas mais visitadas'
  },
  
  // Conteúdo
  conteudo: {
    novas_noticias: 'count de notícias no feed',
    fontes_ativas: 'RSS/YouTube/IG ativos vs inativos',
    coverage_by_region: {
      'vale-do-jurua': '% de notícias',
      'purus': '% de notícias',
      'acre': '% de notícias',
      'brasil': '% de notícias',
      'mundo': '% de notícias'
    }
  },
  
  // Sistema
  sistema: {
    uptime: 'disponibilidade %',
    errors: 'erros JS no console',
    api_response_time: 'ms médio das APIs'
  },
  
  // SEO
  seo: {
    indexed_pages: 'via Google Search Console',
    mobile_friendly: 'sim/não',
    keywords_top_10: 'ranking de palavras-chave'
  }
};
```

### 4.4 Fluxo de Melhoria Contínua

```
CHEFE CALL — LOOP DE MELHORIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DIA N:
  6h → Analisa métricas do dia anterior
  8h → Audit de performance (Lighthouse)
  9h → Gera relatório
  10h → Deploy de otimizações (se houver)
  
  Ciclo: ANALISAR → HIPOTESIZAR → EXPERIMENTAR → VALIDAR → PADRONIZAR

SE LIGHTHOUSE < 80:
  → Prioridade máxima: performance
  → Agente de performance entra em ação
  → Deploy imediato

SE PAGEVIEWS CAIU > 20%:
  → Analisar motivo (conteúdo? performance? SEO?)
  → Ajustar estratégia

SE NOVAS FONTES DISPONÍVEIS:
  → Designer de conteúdo valida fonte
  → Adiciona à lista
  → Notifica no Telegram
```

### 4.5 Scripts do Chefe Call

```javascript
// scripts/chefe-daily-report.js
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function gerarRelatorio() {
  const metrics = await coletarMetricas();
  const report = formatarRelatorio(metrics);
  
  if (TOKEN && CHAT_ID) {
    const bot = new TelegramBot(TOKEN);
    await bot.sendMessage(CHAT_ID, report, { parse_mode: 'Markdown' });
  }
  
  console.log(report);
}

async function coletarMetricas() {
  // 1. Performance (Lighthouse API ou cache local)
  const perf = await fetchPerformance();
  
  // 2. Uptime (últimas 24h)
  const uptime = await fetchUptime();
  
  // 3. Fontes ativas
  const fontes = await fetchFontesStatus();
  
  // 4. Cobertura por região
  const coverage = await fetchCoverage();
  
  return { perf, uptime, fontes, coverage };
}

function formatarRelatorio(m) {
  return `
*📊 Chefe Call — Relatório Diário*
*${new Date().toLocaleDateString('pt-BR')}*

⚡ Performance: ${m.perf.score}/100
  LCP: ${m.perf.lcp}s | CLS: ${m.perf.cls}

🌐 Uptime: ${m.uptime}%

📰 Fontes ativas: ${m.fontes.ativas}/${m.fontes.total}

🗺️ Cobertura:
  Vale do Juruá: ${m.coverage.jurua}%
  Purus: ${m.coverage.purus}%
  Acre: ${m.coverage.acre}%
  Brasil: ${m.coverage.brasil}%

${m.perf.score < 80 ? '⚠️ PERFORMANCE BAIXA — ação necessária!' : '✅ Tudo OK'}
`;
}

gerarRelatorio().catch(console.error);
```

---

## 5. VELOCIDADE & PERFORMANCE

### 5.1 Checklist de Otimização

```
✅ JÁ FEITO:
  • Removidos 15 CSS bloqueantes do deferred boot
  • CSS pesado (486KB) carregado via preload assíncrono
  • Scripts de boot em Promise.all (paralelo)

📋 A FAZER:
  • Inline CSS crítico (above-the-fold)
  • Service Worker para cache offline
  • Image CDN (WebP automático)
  • Preload de fontes
  • Critical font subset PT-BR
  • Lazy loading de iframes (YouTube)
```

### 5.2 CSS Crítico Inline

```html
<!-- Extrair e inline these rules in <head>: -->
<style>
  /* Critical CSS — above the fold */
  :root {
    --bg: #edf1f5;
    --copper: #c56d3f;
    --ink: #172233;
  }
  
  body {
    margin: 0;
    font-family: "Inter", sans-serif;
    background: var(--bg);
  }
  
  .site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(7, 20, 35, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  
  .hero-section {
    min-height: 80vh;
    display: flex;
    align-items: center;
  }
  
  /* Skeleton loading for news cards */
  .news-card-skeleton {
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s infinite;
    border-radius: var(--radius-lg);
  }
  
  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
```

---

## 6. EFEITOS VISUAIS — LIGHTING & GLOW

### 6.1 Sistema de Glow/Iluminação

```css
/* Glow effects — sistema unificado */
:root {
  /* Glow colors */
  --glow-amber: 0 0 20px rgba(216, 169, 67, 0.4);
  --glow-amber-strong: 0 0 40px rgba(216, 169, 67, 0.6), 0 0 80px rgba(216, 169, 67, 0.2);
  --glow-copper: 0 0 20px rgba(197, 109, 63, 0.4);
  --glow-copper-strong: 0 0 40px rgba(197, 109, 63, 0.6), 0 0 80px rgba(197, 109, 63, 0.2);
  --glow-cyan: 0 0 20px rgba(126, 247, 255, 0.4);
  --glow-cyan-strong: 0 0 40px rgba(126, 247, 255, 0.6), 0 0 80px rgba(126, 247, 255, 0.2);
  --glow-green: 0 0 20px rgba(76, 175, 125, 0.4);
  
  /* Shadows */
  --shadow-glow-amber: var(--glow-amber), var(--shadow);
  --shadow-glow-copper: var(--glow-copper), var(--shadow);
  --shadow-glow-cyan: var(--glow-cyan), var(--shadow);
}

/* Aplicação em cards */
.news-card:hover {
  box-shadow: var(--shadow-glow-amber);
  border-color: rgba(216, 169, 67, 0.3);
}

/* Badge de Urgence com pulse */
.badge--urgent {
  animation: urgentPulse 2s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(229, 57, 53, 0.5);
}

@keyframes urgentPulse {
  0%, 100% { box-shadow: 0 0 12px rgba(229, 57, 53, 0.5); }
  50% { box-shadow: 0 0 24px rgba(229, 57, 53, 0.8), 0 0 48px rgba(229, 57, 53, 0.3); }
}

/* Ambient light no background */
body::before {
  content: "";
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: 
    radial-gradient(circle at 20% 20%, rgba(216, 169, 67, 0.03) 0%, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(126, 247, 255, 0.02) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(197, 109, 63, 0.02) 0%, transparent 60%);
  pointer-events: none;
  z-index: -1;
  animation: ambientLightShift 30s ease-in-out infinite alternate;
}

@keyframes ambientLightShift {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-5%, -5%) rotate(3deg); }
}
```

### 6.2 Parallax Stars/Lighting no Header

```css
/* Estrelas de fundo no header */
.site-header {
  position: relative;
  overflow: hidden;
}

.site-header::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.8) 0 1px, transparent 1px),
    radial-gradient(circle at 30% 60%, rgba(255, 255, 255, 0.6) 0 1px, transparent 1px),
    radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.7) 0 1px, transparent 1px),
    radial-gradient(circle at 90% 70%, rgba(255, 255, 255, 0.5) 0 1px, transparent 1px);
  animation: starTwinkle 8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes starTwinkle {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Header glassmorphism */
.site-header {
  background: rgba(7, 20, 35, 0.85);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
```

### 6.3 Efeito de Scan/Loading

```css
/* Scan line effect para seções de loading */
.loading-scan {
  position: relative;
  overflow: hidden;
}

.loading-scan::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--copper), transparent);
  animation: scanLine 2s linear infinite;
}

@keyframes scanLine {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(200px); opacity: 0; }
}

/* Progress bar de carregamento */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--copper), var(--gold), var(--cyan));
  z-index: 9999;
  transition: width 50ms linear;
  box-shadow: 0 0 10px var(--copper);
}
```

---

## 7. PRIORIDADES DE IMPLEMENTAÇÃO

```
ORDEM DE IMPLEMENTAÇÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEMANA 1 — MONETIZAÇÃO (grana urgente)
  1. Nova página de planos de anúncios (#monetizacao)
  2. Cards de preço com glow effects
  3. Integração com WhatsApp comercial
  4. Ad slots mais visíveis no site

SEMANA 2 — FOOTER + FUNDADORES
  1. Footer com accordion por região
  2. Karban visual para fundadores
  3. Badges de tier (ouro/prata/bronze)
  4. Newsletter integrado

SEMANA 3 — CHEFE CALL
  1. Scripts de análise diária
  2. Cron jobs de performance
  3. Relatório Telegram
  4. Monitoramento de uptime

SEMANA 4 — EFEITOS VISUAIS
  1. Sistema de glow unificado
  2. Ambient lighting
  3. Parallax stars no header
  4. Scroll progress bar
  5. Glassmorphism no header

SEMANA 5 — PERFORMANCE
  1. CSS crítico inline
  2. Service worker
  3. Image CDN
  4. Lazy loading de iframes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

Criado em: 2026-06-02
Rayxpx Matrix Swarm Core | Hermes para Junior Play
