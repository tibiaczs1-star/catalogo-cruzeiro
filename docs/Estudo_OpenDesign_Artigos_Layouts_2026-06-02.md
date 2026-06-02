# ESTUDO OPEN DESIGN - ARTIGOS, LAYOUTS E MELHORIAS
## Catálogo Cruzeiro do Sul - 2026-06-02

---

## PARTE 1: TIPOS DE ARTIGOS DO CATÁLOGO

### 1.1 Inventário de Artigos Existentes

```
ARTIGOS IDENTIFICADOS NO CATÁLOGO CZS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIPO                | CARACTERÍSTICAS                    | EXEMPLO
--------------------|-------------------------------------|------------------
Notícia Urgente     | Título forte, imagem grande,       | #radar, cobertura cheia
                    | badge "URGENTE", timestamp vivo   |
                    |                                     |
Notícia Padrão      | Título + resumo + corpo + fonte    | Cards do radar
                    | hierarchical news structure         |
                    |                                     |
Notícia Serviço     | Utilidade pública, telefones,      | #catalogo-telefonico
                    | horários, mapas                     |
                    |                                     |
Notícia Agitada     | Eventos, shows, cavalgadas         | Agenda social
                    | data + local + link                |
                    |                                     |
Guia de Serviços    | Catálogo comercial, mapas,         | catalogo-servicos.html
                    | botões de ação                     |
                    |                                     |
Notícia Opinion     | Editorial, comentário, coluna       | raramente usado
                    |                                     |
Cobertura Contínua  | Live blog, atualização constante   | não implementado
                    |                                     |
Matéria Vídeo       | Embed YouTube/TikTok/原生视频      | #tv-catalogo
                    | thumbnail + player                  |
                    |                                     |
Fotojornalismo      | Galeria de fotos, carrossel       | #midia-galeria
                    |                                     |
Infográfico         | Dados, mapas, visualização         | não implementado
                    |                                     |
Artigo Long-Form    | Entrevistas, especiais             | raramente usado
                    |                                     |
Aviso Público       | Alertas, cheias, decretos         | banners do topo
                    |                                     |
Publi-Artigo        | Conteúdo patrocinado               | não implementado
                    |                                     |
Fundo de Arena      | Podcast, áudio embed              | #midia-galeria
                    |                                     |
Apuração            | Matéria em construção, nota        | raramente usado
                    |                                     |
``` 

### 1.2 Hierarquia de Notícia - Modelo Editorial

```
┌─────────────────────────────────────────────────────────┐
│  ESTRUTURA DE NOTÍCIA PADRÃO                           │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │ BADGE   │  │ BADGE   │  │ BADGE   │  (região,tema) │
│  └────┬────┘  └────┬────┘  └────┬────┘                 │
│       │            │            │                       │
│  ══════════════ TÍTULO ════════════════               │
│       │            │            │                       │
│  ┌────┴────────────┴────────────┴────┐                 │
│  │           RESUMO / LEDE             │  (2-3 linhas) │
│  └─────────────────┬──────────────────┘                 │
│                    │                                   │
│  ┌─────────────────┴──────────────────┐               │
│  │           CORPO EDITORIAL           │  (parágrafos)  │
│  │  - Contexto                        │               │
│  │  - Dados/fatos                     │               │
│  │  - Vozes envolvidas                │               │
│  │  - Fechamento                      │               │
│  └─────────────────┬──────────────────┘               │
│                    │                                   │
│  ┌─────────────────┴──────────────────┐               │
│  │  FONTE: Nome | Link | Timestamp     │               │
│  └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## PARTE 2: LAYOUTS DE ARTIGOS

### 2.1 Layout Mobile-First (Padrão)

```
MOBILE (1 coluna, < 768px)
═══════════════════════════════

┌─────────────────────────┐
│ ◄ Voltar | Compartilhar │
├─────────────────────────┤
│ [BADGE] [BADGE]         │
│                         │
│ ════════════════════    │
│   TÍTULO GRANDE         │
│ ════════════════════    │
│                         │
│ Resumo em 2-3 linhas   │
│ com destaque no lead.   │
│                         │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │    IMAGEM HERO      │ │
│ │    16:9 ou 4:3     │ │
│ │                     │ │
│ └─────────────────────┘ │
│ Fonte da foto           │
│                         │
│ Corpo editorial em      │
│ parágrafos bem espaados │
│ com linha de 60-70ch    │
│ máximo por linha.       │
│                         │
│ ┌─────────────────────┐ │
│ │ ⚠️ ALERTA/SERVIO    │ │
│ │ info importante     │ │
│ └─────────────────────┘ │
│                         │
│ [TAMBÉM IMPORTANTE]    │
│ ┌─────────────────────┐ │
│ │ Card relacionado 1  │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Card relacionado 2  │ │
│ └─────────────────────┘ │
│                         │
│ Tags: #tag1 #tag2      │
│                         │
│ ┌─────────────────────┐ │
│ │ 💬 Comentários (3)  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 2.2 Layout Desktop (2-3 colunas)

```
DESKTOP (> 1024px)
══════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────┐
│ ◄ Voltar ao Juruá          Data        Compartilhar ▶   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [BADGE] [BADGE] [BADGE]    [AUTOR]    [TIMESTAMP]       │
│                                                          │
│ ══════════════════════════════════════════════════════    │
│              TÍTULO GRANDE EM FRAUNCES                    │
│ ══════════════════════════════════════════════════════    │
│                                                          │
│ ┌──────────────────────┐  ┌──────────────────────────┐   │
│ │                      │  │                          │   │
│ │   IMAGEM HERO        │  │   SIDEBAR:               │   │
│ │   16:9               │  │   - Newsletter signup    │   │
│ │                      │  │   - Mais lidas           │   │
│ │                      │  │   - Serviços relacionados│   │
│ └──────────────────────┘  │   - Tags em alta        │   │
│ Fonte: Nome do crédito    │                          │   │
│                           └──────────────────────────┘   │
│ Resumo/lede em destaque       30ch                      │
│ com fonte maior e cor         por linha                 │
│ de contraste.                                          │
│                                                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │  Corpo editorial em colunas ou texto corrido        │  │
│ │  max-width de 720px centrado com sidebar.           │  │
│ │                                                        │  │
│ │  Parágrafos bem espaçados. Heading H2 para          │  │
│ │  seções. Citações em destaque com borda lateral.     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │  TAMBÉM IMPORTANTE                                 │  │
│ │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │  │
│ │  │ Card 1 │ │ Card 2 │ │ Card 3 │ │Card 4 │ │  │
│ │  └─────────┘ └─────────┘ └─────────┘ └────────┘ │  │
│ └────────────────────────────────────────────────────┘  │
│                                                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │  💬 Comentários (X)                               │  │
│ │  [Input de comentário]                             │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 2.3 Layout de Cover/Home (Bento Grid)

```
LAYOUT BENTO GRID - HOME
═══════════════════════════════

┌────────────────────────────────────────┐
│  HEADER + NAV                          │
├─────────────┬──────────────────────────┤
│             │                          │
│   HERO      │    NEWS FEED             │
│   (destaque │    (notícias normais)    │
│    principal)│    em cards verticais     │
│             │                          │
│   2x2      │    1xN                  │
│             │                          │
├─────────────┼──────────────────────────┤
│             │                          │
│  TELEVISION │    SERVICES              │
│  (video ou  │    (grid de atalhos     │
│   thumbnail)│     para serviços)       │
│             │                          │
├─────────────┴──────────────────────────┤
│                                        │
│   SOCIAL / TRENDS                      │
│   (carrossel horizontal)              │
│                                        │
├────────────────────────────────────────┤
│   FOOTER                              │
└────────────────────────────────────────┘
```

---

## PARTE 3: SISTEMA DE DESIGN - TOKENS

### 3.1 Paleta de Cores (Tokens CSS)

```css
/* ========================
   DESIGN TOKENS - CORES
   ======================== */

/* Cor principal de fundo */
--color-bg: #f8fafc;

/* Superfícies */
--color-surface: rgba(247, 249, 252, 0.98);
--color-surface-elevated: rgba(255, 255, 255, 0.995);

/* Texto */
--color-text-primary: #172233;
--color-text-secondary: #58677a;
--color-text-muted: #8696a8;
--color-text-inverse: #f8fbff;

/* Destaque */
--color-accent: #c56d3f;       /* cobre/laranja terra */
--color-accent-hover: #a9542d;
--color-accent-amber: #dfb06b; /* dourado */
--color-accent-cyan: #7ef4ff;  /* cyan neon */
--color-accent-green: #4caf7d; /* verde amazonico */

/* Status */
--color-urgent: #e53935;
--color-success: #43a047;
--color-warning: #f9a825;
--color-info: #1e88e5;

/* Bordas */
--color-border: rgba(23, 49, 79, 0.1);
--color-border-strong: rgba(23, 49, 79, 0.18);

/* Sombras */
--shadow-sm: 0 2px 8px rgba(13, 28, 47, 0.06);
--shadow-md: 0 8px 24px rgba(13, 28, 47, 0.1);
--shadow-lg: 0 22px 52px rgba(13, 28, 47, 0.12);
--shadow-glow-amber: 0 0 20px rgba(216, 169, 67, 0.3);
--shadow-glow-cyan: 0 0 20px rgba(126, 247, 255, 0.3);

/* ========================
   TIPOGRAFIA
   ======================== */
--font-display: 'Fraunces', Georgia, serif;
--font-heading: 'Fraunces', 'Outfit', Georgia, serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Escala tipográfica */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */

/* Line heights */
--leading-tight: 1.15;
--leading-snug: 1.35;
--leading-normal: 1.55;
--leading-relaxed: 1.75;

/* ========================
   ESPAÇAMENTO (8px base)
   ======================== */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */

/* ========================
   BORDAS
   ======================== */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;

/* ========================
   BREAKPOINTS
   ======================== */
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;

/* ========================
   MOTION
   ======================== */
--duration-fast: 150ms;
--duration-base: 250ms;
--duration-slow: 400ms;
--duration-slower: 600ms;

--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## PARTE 4: COMPONENTES - SPECS

### 4.1 News Card

```css
/* NEWS CARD - estados */
.news-card {
  /* Default */
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform var(--duration-base) var(--ease-out),
              box-shadow var(--duration-base) var(--ease-out);

  /* Hover */
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  /* Active/pressed */
  &:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }

  /* Disabled */
  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

/* News card image */
.news-card__image {
  aspect-ratio: 16 / 9;
  object-fit: cover;
  width: 100%;
  loading: lazy;

  /* Skeleton state */
  &.is-loading {
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s infinite;
  }
}

/* News card content */
.news-card__body {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.news-card__badge {
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent);
}

.news-card__title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: var(--leading-tight);
  color: var(--color-text-primary);
  margin: 0;

  /* Clamp lines */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card__summary {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card__meta {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: auto;
}
```

### 4.2 Badge / Tag

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1;

  /* Variants */
  &--urgent {
    background: var(--color-urgent);
    color: white;
  }
  &--service {
    background: var(--color-accent);
    color: white;
  }
  &--region {
    background: rgba(76, 175, 125, 0.15);
    color: var(--color-accent-green);
  }
  &--default {
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
}
```

### 4.3 Button

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: all var(--duration-fast) var(--ease-out);

  /* Variants */
  &--primary {
    background: var(--color-accent);
    color: white;
    &:hover { background: var(--color-accent-hover); }
    &:active { transform: scale(0.98); }
  }

  &--secondary {
    background: transparent;
    color: var(--color-accent);
    border: 1.5px solid var(--color-accent);
    &:hover { 
      background: var(--color-accent);
      color: white;
    }
  }

  &--ghost {
    background: transparent;
    color: var(--color-text-secondary);
    &:hover { 
      background: var(--color-surface);
      color: var(--color-text-primary);
    }
  }

  &--icon {
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: var(--radius-full);
  }

  /* Sizes */
  &--sm { padding: var(--space-2) var(--space-4); font-size: var(--text-xs); }
  &--lg { padding: var(--space-4) var(--space-8); font-size: var(--text-base); }
}
```

---

## PARTE 5: IDEIAS DE MELHORIA (50+)

### 5.1 URGENTE (Fazem o site parar de travar)

```
PRIORIDADE CRÍTICA:
─────────────────────

[1] LAZY LOADING DE VERDADE
    - Adicionar loading="lazy" em TODAS as imagens
    - Usar IntersectionObserver para elementos pesados
    - Placeholder blur-up (LQIP) para imagens hero
    - CUSTO: 2h | IMPACTO: ████████░░

[2] REMOVER DEFERRED BOOT BLOQUEANTE
    - O boot com 10+ scripts em fila é bloqueante
    - Separar em: crítico (inline) / deferred (async)
    - CUSTO: 4h | IMPACTO: ██████████

[3] OPTIMIZAR FONTES WEB
    - Font-display: swap para todas as fontes
    - Preconnect para Google Fonts
    - Subset de fontes para chars PT-BR
    - CUSTO: 1h | IMPACTO: ██████░░░░

[4] CSS CRÍTICO INLINE
    - Extrair CSS acima da dobra para tag <style>
    - Resto pode ser async
    - CUSTO: 2h | IMPACTO: ███████░░░

[5] SERVIÇO WORKER
    - Cache de assets estáticos
    - Cache de respostas de API
    - Offline fallback
    - CUSTO: 4h | IMPACTO: ████████░░
```

### 5.2 LAYOUT & ESTRUTURA

```
LAYOUT - NOVAS IDEIAS:
───────────────────────

[6] LAYOUT BENTO GRID
    - Inspirado em Apple News / Notion
    - Cards de tamanhos variados em grid
    - Mais visual, menos texto corrido
    - CUSTO: 6h | IMPACTO: █████████░

[7] STICKY HEADER COMPROVADO
    - Header que encolhe ao scroll
    - Mostra logo + búsqueda ao二人
    - Não ocupa espaço quando não precisa
    - CUSTO: 3h | IMPACTO: ███████░░░

[8] SIDEBAR COLABORATIVA
    - "Mais lidas" em tempo real
    - "Notícias quente" (baseado em velocity)
    - Newsletter signup sticky
    - CUSTO: 4h | IMPACTO: ████████░░

[9] LAYOUT MAGAZINE
    - Capa estilo revista com destaque grande
    - 2-3 matérias menores ao lado
    - Funciona bem em desktop
    - CUSTO: 5h | IMPACTO: █████████░

[10] FOOTER EXPANDÍVEL
     - Footer com seções que expandem
     - Mapa do site interativo
     - Links organizados por categoria
     - CUSTO: 3h | IMPACTO: ██████░░░░

[11] NAVEGAÇÃO POR ABAS
     - Abas para: Notícias / Serviços / Agenda
     - Scroll horizontal no mobile
     - Transição suave entre tabs
     - CUSTO: 2h | IMPACTO: ███████░░░

[12] SEARCH MODAL
     - Busca com Cmd/Ctrl+K
     - Busca com typewriter effect
     - Resultados instantâneos
     - CUSTO: 4h | IMPACTO: █████████░
```

### 5.3 COMPONENTES

```
COMPONENTES - NOVAS IDEIAS:
────────────────────────────

[13] NEWS CARD COM TAIL
     - Card com "rabo" indicando categoria
     - Cor do tail = cor da categoria
     - Mais visual, mais fácil de escanear
     - CUSTO: 2h | IMPACTO: ███████░░░

[14] CAROUSEL INFINITO
     - Scroll horizontal infinito
     - Suporte a swipe no mobile
     - Auto-play com pause on hover
     - CUSTO: 3h | IMPACTO: ████████░░

[15] ACCORDION FAQ
     - FAQ em accordion animado
     - Expande/colapsa suave
     - Boa experiência mobile
     - CUSTO: 1h | IMPACTO: █████░░░░░

[16] TABS DE CONTEÚDO
     - Conteúdo em abas
     - Transição com slide
     - URL atualiza com tab ativa
     - CUSTO: 2h | IMPACTO: ███████░░░

[17] TOOLTIP RICO
     - Tooltips com imagem + texto
     - Para badges e abreviações
     - Aparece no hover/tap
     - CUSTO: 2h | IMPACTO: ████░░░░░░

[18] BADGE PULSANTE
     - Badge "URGENTE" com pulse
     - Badge "NOVO" com animação
     - Atrai atenção sem ser irritante
     - CUSTO: 1h | IMPACTO: ██████░░░░

[19] PROGRESS BAR DE LEITURA
     - Barra no topo da página
     - Mostra % de leitura do artigo
     - Funciona em mobile
     - CUSTO: 2h | IMPACTO: ███████░░░

[20] ESTRELAS DE CONFIANÇA
     - Sistema de rating por fonte
     - 1-5 estrelas + badge de confiança
     - Ajuda a avaliar procedência
     - CUSTO: 3h | IMPACTO: ████████░░

[21] AVATAR DO AUTOR
     - Foto do jornalista/editor
     - Nome + cargo ao lado
     - Link para perfil do autor
     - CUSTO: 1h | IMPACTO: ██████░░░░
```

### 5.4 CONTEÚDO & INTERATIVIDADE

```
CONTEÚDO - NOVAS IDEIAS:
─────────────────────────

[22] MATÉRIA LONGA COM TOC
     - Table of Contents para artigos longos
     - Navegação por âncoras
     - Destaque da seção atual
     - CUSTO: 3h | IMPACTO: ████████░░

[23] TEXTO SELETIVO (TAN)
     - Selecionar texto mostra tooltip
     - "Pesquisar isso", "Compartilhar"
     - Melhora UX mobile
     - CUSTO: 4h | IMPACTO: ███████░░░

[24] VOZ DO LEITOR
     - Formulário de áudio
     - Enviar áudio de denúncia/pauta
     - Usa MediaRecorder API
     - CUSTO: 5h | IMPACTO: ████████░░

[25] INFOGRÁFICO INTERATIVO
     - Mapas clicáveis do Acre
     - Dados de cheias em timeline
     - Comparativos visuais
     - CUSTO: 6h | IMPACTO: █████████░

[26] GALERIA LIGHTBOX
     - Fotos em lightbox estilo Pinterest
     - Swipe para navegar
     - Zoom no tap
     - CUSTO: 3h | IMPACTO: ███████░░░

[27] QUIZ INFORMATIVO
     - Quiz sobre eleição/serviços
     - Resultado personalizado
     - Share do resultado
     - CUSTO: 4h | IMPACTO: ███████░░░

[28] SISTEMA DE CITAÇÃO
     - Destacar trechos selecionados
     - "Citar isso" com um clique
     - Copia com formatação
     - CUSTO: 2h | IMPACTO: █████░░░░░

[29] CRONOLOGIA DE EVENTO
     - Timeline visual de notícias
     - Navegação temporal
     - Mapa com pins por data
     - CUSTO: 5h | IMPACTO: ████████░░

[30] RELACIONADOS POR IA
     - "Leia também" inteligente
     - Baseado em similaridade semântica
     - Usa embeddings se disponíveis
     - CUSTO: 6h | IMPACTO: █████████░
```

### 5.5 PERFORMANCE & MOBILE

```
PERFORMANCE & MOBILE:
──────────────────────

[31] LISTA BRANCA DE ADS
     - Ads só de parceiros verificados
     - Lazy load de ads
     - Slot de ad responsivo
     - CUSTO: 3h | IMPACTO: ███████░░░

[32] IMAGE CDN
     - Usar serviço como Cloudinary/Imgix
     - Redimensionamento automático
     - WebP/AVIF automático
     - CUSTO: 4h | IMPACTO: █████████░

[33] PRELOAD DE PÁGINA
     - instant.page para links
     - Pré-carrega ao二人
     - Transparente para usuário
     - CUSTO: 1h | IMPACTO: ████████░░

[34] PRERENDER DE PÁGINA
     - Prerender próximas páginas prováveis
     - Usa Speculation Rules API
     - Só em desktop
     - CUSTO: 3h | IMPACTO: ████████░░

[35] MODO LEITURA
     - Toggle de modo leitura
     - Font-size ajustável
     - Tema sepia/dark/light
     - CUSTO: 3h | IMPACTO: ███████░░░

[36] GESTOS MOBILE
     - Swipe para voltar/passar
     - Pull to refresh
     - Shake para compartilhar
     - CUSTO: 4h | IMPACTO: ███████░░░

[37] MODO OFFLINE
     - PWA com service worker
     - Lista de leitura offline
     - Sincroniza quando online
     - CUSTO: 5h | IMPACTO: ████████░░

[38] ANALYTICS PRIVACY-FIRST
     - Sem cookies de terceiros
     - Analytics open-source (Plausible)
     - GDPR compliant
     - CUSTO: 2h | IMPACTO: ██████░░░░
```

### 5.6 SEO & DESCOBERTA

```
SEO & DESCOBERTA:
──────────────────

[39] SCHEMA.ORG NEWSARTICLE
     - Marcação estruturada completa
     - BreadcrumbList
     - Article + Author
     - CUSTO: 2h | IMPACTO: █████████░

[40] SITEMAP.XML DINÂMICO
     - Gera sitemap automaticamente
     - Atualiza a cada publicação
     -分段 (分段) páginas prioritárias
     - CUSTO: 3h | IMPACTO: █████████░

[41] RSS FEED COMPLETO
     - Feed RSS de todas as notícias
     - Feed RSS por categoria
     - Feed RSS por tag
     - CUSTO: 2h | IMPACTO: ████████░░

[42] OPENGRAPH RICO
     - OG image gerado automaticamente
     - OG video se aplicável
     - Twitter cards completos
     - CUSTO: 3h | IMPACTO: █████████░

[43] NEWSLETTER EMBEDDABLE
     - Widget de newsletter para sites
     - Popup de exit-intent
     - Form integrado ao CRM
     - CUSTO: 4h | IMPACTO: ███████░░░

[44] SHARE BUTTONS
     - Botões de compartilhar nativos
     - WhatsApp, Telegram, X, Facebook
     - Copy link com feedback
     - CUSTO: 1h | IMPACTO: ███████░░░
```

### 5.7 MONETIZAÇÃO

```
MONETIZAÇÃO:
─────────────

[45] NATIVE AD PLACEMENT
     - Anúncios que parecem conteúdo
     - Separados por "Patrocinado"
     - Não intrusivos
     - CUSTO: 3h | IMPACTO: ████████░░

[46] PRODUCT SHOWCASE
     - Cards de produto do catálogo
     - Preço + loja visível
     - Link de compra externo
     - CUSTO: 4h | IMPACTO: ████████░░

[47] MEMBERSHIP GATED
     - Conteúdo exclusivo para membros
     - Paywall suave (freemium)
     - Badges de "Membro"
     - CUSTO: 6h | IMPACTO: ████████░░

[48] SUPPORT BUTTON
     - Botão de "Apoiar o catálogo"
     - Pix/cartão/wallet
     - Contador de apoiadores
     - CUSTO: 2h | IMPACTO: ███████░░░

[49] VIRTUAL GOODS
     - Emojis/troféus compráveis
     - Badge de doador no perfil
     - Colecionável
     - CUSTO: 5h | IMPACTO: ███████░░░

[50] AFFILIATE LINKS
     - Links de afiliados para produtos
     - Comissionamento sobre vendas
     - Tags para rastrear
     - CUSTO: 3h | IMPACTO: ███████░░░
```

---

## PARTE 6: ROADMAP DE IMPLEMENTAÇÃO

```
FASE 1: ESTABILIDADE (Semanas 1-2)
├─ [1] Lazy loading de imagens
├─ [3] Fontes com font-display: swap
├─ [4] CSS crítico inline
├─ [14] Carousel infinito
└─ [44] Share buttons

FASE 2: PERFORMANCE (Semanas 3-4)
├─ [2] Deferred boot otimizado
├─ [5] Service worker
├─ [32] Image CDN
├─ [33] Preload de página
└─ [38] Analytics privacy-first

FASE 3: CONTEÚDO (Semanas 5-6)
├─ [22] Matéria longa com TOC
├─ [26] Galeria lightbox
├─ [29] Relacionados por IA
├─ [30] Cronologia de evento
└─ [12] Search modal

FASE 4: MOBILE (Semanas 7-8)
├─ [35] Modo leitura
├─ [36] Gestos mobile
├─ [37] Modo offline
├─ [7] Sticky header
└─ [17] Tooltip rico

FASE 5: CRESCIMENTO (Semanas 9-10)
├─ [39] Schema.org completo
├─ [41] RSS feeds
├─ [43] Newsletter
├─ [48] Support button
└─ [49] Membership gated
```

---

## PARTE 7: MATRIZ DE PRIORIDADE

```
            │ FACIL │ MÉDIO │ DIFÍCIL │
────────────┼───────┼───────┼─────────┤
IMPACTO ALTO│ [1]   │ [2]   │ [12]    │
            │ [3]   │ [6]   │ [29]    │
            │ [4]   │ [14]  │ [30]    │
            │ [44]  │ [22]  │         │
────────────┼───────┼───────┼─────────┤
IMPACTO MÉD.│ [15]  │ [7]   │ [25]    │
            │ [18]  │ [8]   │ [27]    │
            │ [19]  │ [13]  │ [45]    │
            │ [21]  │ [24]  │ [47]    │
────────────┼───────┼───────┼─────────┤
IMPACTO BAIX.│ [17] │ [9]   │ [31]    │
            │ [20]  │ [10]  │ [37]    │
            │ [23]  │ [11]  │         │
            │       │ [16]  │         │
            │       │ [28]  │         │
────────────┴───────┴───────┴─────────┘

LEGEND: Verde = Fazer agora | Amarelo = Fazer depois | Vermelho = Prioridade baixa
```

---

Gerado em: 2026-06-02
Rayxpx Matrix Swarm Core | Hermes para Junior Play
