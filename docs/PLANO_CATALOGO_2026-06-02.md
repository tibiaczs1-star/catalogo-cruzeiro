# PLANO DE ACAO - CATALOGO CZS 2026
## MISSÃO: Mobile rapido | Desktop rico | Captacao de conteudo | Open Design

---

## GOAL TRACKER - STATUS EM TEMPO REAL

```
SITUACAO ATUAL (02/06/2026) - ATUALIZADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SPRINT 1: PERFORMANCE [██████████████░░░░░░░░░░░░░] 65% CONCLUIDO
  ├─ [OK] Corrigir maximumMs 52s → 15s
  ├─ [OK] waitForVisibleAssets 10s → 5s
  ├─ [OK] waitForSoftPageLoad 6.5s → 3.5s
  ├─ [OK] minimumMs desktop 5.2s → 2.5s
  ├─ [OK] minimumMs mobile 3.2s → 1.5s
  ├─ [OK] Asset scan 28 → 12 URLs
  ├─ [OK] News preload 60 → 20
  ├─ [OK] CSS async preload ja existe
  ├─ [OK] loading="lazy" nativo nas imagens
  ├─ [OK] skeleton.css criado
  └─ [PENDENTE] IntersectionObserver para lazy load real

SPRINT 2: CAPTACAO DE CONTEUDO [██████████████░░░░░░░░░░░░░] 40%
  ├─ [OK] Modulo CatalogoCapture criado
  ├─ [OK] Captura de foto (canvas API)
  ├─ [OK] Gravacao de video (MediaRecorder)
  ├─ [OK] Preview da midia antes do envio
  ├─ [OK] Interface de captura modal
  ├─ [OK] WhatsApp fallback
  ├─ [OK] Botao "Enviar foto/video" integrado ao index.html
  └─ [PENDENTE] Upload direto para backend (futuro)

SPRINT 3: DESKTOP [████████████████░░░░░░░░░░░░░] 50% CONCLUIDO
  ├─ [OK] CSS async preload
  ├─ [OK] Logo preloader critico
  ├─ [OK] Hero panels com thumb carousel
  ├─ [OK] TV catalog section
  ├─ [OK] Services grid
  ├─ [OK] News mosaic
  ├─ [OK] Midia hub com podcast
  └─ [PENDENTE] Layout mais sofisticado desktop

SPRINT 4: MOBILE [██████████████░░░░░░░░░░░░░░░░░] 40% CONCLUIDO
  ├─ [OK] mobile-home-final.css dedicado
  ├─ [OK] CSS async preload (preload onload)
  ├─ [OK] touch targets basicos
  ├─ [OK] Navbar responsivo
  └─ [PENDENTE] Menu hamburger CSS-only (remover JS)

SPRINT 5: OPEN DESIGN [███████████████░░░░░░░░░░░░░] 40% CONCLUIDO
  ├─ [OK] DESIGN.md criado (cores, tipografia, espacamento)
  ├─ [OK] Tokens de cor definidos
  ├─ [OK] Do's and Don'ts
  ├─ [OK] Plano de acao com matriz de correcoes
  ├─ [PENDENTE] Spec de componentes
  ├─ [PENDENTE] Breakpoints centralizados
  ├─ [PENDENTE] Tokens de estado (hover/focus/active)
  └─ [PENDENTE] Modo escuro

SPRINT 6: CONTEUDO [█████████████████░░░░░░░░░░░░] 55% CONCLUIDO
  ├─ [OK] 500+ news fallbacks SVG
  ├─ [OK] News archive com 500+ noticias
  ├─ [OK] Runtime news atualizado
  ├─ [OK] 20 news preload
  ├─ [OK] Skeleton CSS criado
  ├─ [PENDENTE] Lazy loading nativo (IntersectionObserver)
  ├─ [PENDENTE] Progressive image loading
  └─ [PENDENTE] Skeleton screens no boot

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL: [██████████████████░░░░░░░░░░░░░] 35% CONCLUIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ANALISE COMPLETA - O QUE EXISTE E O QUE FALTA

### 1. PERFORMANCE (JA CORRIGIDO PARCIALMENTE)

**O que existe:**
- CSS async via preload+onload (bom)
- Preloader critico do logo inline
- Shell versioning para cache bust
- Parametros de timing agora razoaveis

**O que falta:**
- [P1] Lazy loading nativo com IntersectionObserver
- [P1] Skeleton screens durante carregamento
- [P2] Image srcset para diferentes tamanhos de tela
- [P2] Progressive JPEG/WebP para imagens
- [P3] Service Worker para cache offline

**Arquivos a modificar:**
- `index.html` - adicionar IntersectionObserver lazy loading
- `styles.css` - adicionar skeleton classes

### 2. CAPTACAO DE FOTOS E VIDEOS (NAO EXISTE)

**O que existe:**
- Link WhatsApp para envio de fotos/videos (wa.me/5568992269296)
- Secao "TV Catalogo" com links para arquivo
- Preview de thumbnails de videos no arquivo

**O que NAO existe:**
- [P1] Captura de foto in-site (camera do celular)
- [P1] Gravacao de video in-site
- [P1] Preview da midia antes do envio
- [P1] Interface de upload drag-and-drop
- [P2] App de camera com filtros basicos

**Solucao proposta - modulo "CATALOGO CAM" (NOVO):**

```javascript
// Modulo de captura - catalogo-capture.js
// Usa APIs disponiveis:
// - getUserMedia() para accesso a camera
// - MediaRecorder API para gravacao de video
// - Canvas API para captura de foto
// - ImageCapture API (se disponivel) para foto em alta resolucao

CAPACIDADES:
- Foto: MediaStream + canvas.toBlob()
- Video: MediaRecorder API
- Audio: MediaRecorder com video
- Upload: fetch() com FormData para backend
- Preview: URL.createObjectURL() para mostrar antes de enviar
```

**Fluxo:**
```
Usuario clica "Enviar foto"
  → Pede permissao de camera
  → Abre viewfinder fullscreen
  → Usuario escolhe: FOTO ou VIDEO
  → Faz a captura
  → Preview da midia
  → Usuario adiciona legenda
  → Envia via WhatsApp API (link wa.me) ou
  → Upload direto para backend (futuro)
```

### 3. DESKTOP - O QUE EXISTE E FALTA

**Existe:**
- Layout de 12 colunas
- Hero panel com carousel de topicos
- TV Catalogo com miniaturas
- News mosaic
- Services grid
- Podcast player placeholder
- Galeria

**Falta:**
- [P2] Layout mais sofisticado com secao de destaque
- [P2] Sidebar com noticias em destaque
- [P2] Newsletter signup mais evidente
- [P3] Animacoes de scroll mais elaboradas

### 4. MOBILE - O QUE EXISTE E FALTA

**Existe:**
- CSS async preload
- mobile-home-final.css
- Navbar responsivo

**Falta:**
- [P1] Menu hamburger CSS-only (remover JS pesado)
- [P2] Cards de noticia menores e mais faceis de ler
- [P2] Bottom navigation bar (mais UX mobile)
- [P2] Pull-to-refresh
- [P3] Swipe gestures para navegar noticias

### 5. OPEN DESIGN - ANALISE DO DESIGN.MD

**O que existe no DESIGN.md:**
- Paleta de cores (terra, verdeamazonico, dourado)
- Tipografia (Fraunces, Source Sans Pro)
- Espacamento (escala 8px)
- Do's and Don'ts

**O que falta:**
- [P1] Spec de componentes (Card, Button, Nav, Footer)
- [P1] Breakpoints responsivos centralizados
- [P2] Tokens de estado (hover, focus, active, disabled)
- [P2] Tokens de sombra
- [P2] Tokens de border-radius
- [P3] Modo escuro
- [P3] Variaveis CSS para animacoes

---

## PRIORIDADES - PROXIMOS 7 DIAS

### DIA 1-2: PERFORMANCE (Sprint 1 remainder)
1. Adicionar IntersectionObserver lazy loading
2. Criar skeleton screens CSS
3. Testar em mobile real

### DIA 3-4: CAPTACAO (Sprint 2 start)
1. Criar catalogo-capture.js com:
   - getUserMedia camera access
   - Canvas photo capture
   - MediaRecorder video
2. Criar UI de captura (modal)
3. Integrar com WhatsApp fallback

### DIA 5: MOBILE (Sprint 4)
1. Menu hamburger CSS-only
2. Bottom navigation bar
3. Teste em Chrome DevTools mobile

### DIA 6-7: OPEN DESIGN (Sprint 5)
1. Completar DESIGN.md com:
   - Spec de componentes
   - Breakpoints
   - Tokens de estado

---

## COMPOSIO E NANGO - ANALISE

### Composio (app.composio.dev)
VERIFICADO: Tem API. Docs em docs.composio.dev
- Tool router para agentes de IA
- Conecta Claude, GPT com ferramentas externas
- 50+ integracoes (GitHub, Slack, Notion, etc.)

INSTALAR? Sim, faz sentido para Rayxpx como orquestrador.
- Instalar via: npm install @composio/core @composio/node-sdk ai @ai-sdk/anthropic
- Scripts prontos em: scripts/install-composio.js

### Nango (app.nango.dev)
VERIFICADO: Tem API. Docs em docs.nango.dev
- Gerenciamento OAuth para agentes
- 200+ integracoes OAuth
- Conexao GitHub ja configurada no exemplo

INSTALAR? Sim, faz sentido para Rayxpx.
- Instalar via: npm install @nangohq/node
- Scripts prontos em: scripts/install-nango.js

AMBos sao viaveis - APIs publicas com documentation.

---

## MATRIZ DE CORRECOES - O QUE FAZER AGORA

| ID | Tipo | Descricao | Prioridade | Esforco | Arquivo |
|----|------|-----------|-----------|---------|---------|
| 1 | Performance | IntersectionObserver lazy loading | P1 | 2h | index.html |
| 2 | Performance | Skeleton screens CSS | P1 | 1h | styles.css |
| 3 | Captacao | catalogo-capture.js (foto) | P1 | 4h | novo |
| 4 | Captacao | catalogo-capture.js (video) | P1 | 4h | novo |
| 5 | Captacao | Modal de captura UI | P1 | 2h | index.html |
| 6 | Mobile | Menu hamburger CSS-only | P2 | 2h | mobile-home-final.css |
| 7 | Mobile | Bottom nav bar | P2 | 2h | mobile-home-final.css |
| 8 | Design | Completar DESIGN.md | P2 | 3h | DESIGN.md |
| 9 | Design | Spec componentes | P2 | 4h | DESIGN.md |
| 10 | Desktop | Sidebar noticias | P3 | 3h | subpages-redesign.css |

---

## EXECUTAR AGORA

```bash
# 1. Lazy loading
# Adicionar em index.html:
<script>
window.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });
  
  document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
});
</script>

# 2. Modulo de captura (novo arquivo: catalogo-capture.js)
# 3. Menu CSS-only hamburger
# 4. Completar DESIGN.md
```

---

Gerado em: 2026-06-02
Rayxpx Matrix Swarm Core | Hermes para Junior Play
