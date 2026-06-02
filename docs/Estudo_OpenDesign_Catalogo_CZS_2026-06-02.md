# Estudo Open Design - Melhorias Visuais Catalogo CZS
## Baseado no Google DESIGN.md / Open Design Principles

---

## 1. O QUE E OPEN DESIGN

O Open Design (Google DESIGN.md) define sistemas visuais como contratos
entre equipes humanas e agentes de IA. Sao arquivos .md com:
- Paleta de cores com tokens nomeados
- Sistema tipografico
- Espacamento em escala
- Padroes de componentes
- Do's and Don'ts

O objetivo: garantir que qualquer ferramenta de IA entenda a identidade
visual e produza conteudos consistentes.

---

## 2. ESTADO ATUAL DO CATALOGO CZS

### Sistema de Cores
O catalogo usa cores terrosas do Vale do Jurua, com verdeamazonico
e dourado commeio. Ha tokens definidos em DESIGN.md proprio.

### Tipografia
- Fraunces (titulos)
- Source Sans Pro (corpo)
- Libre Baskerville (noticias)
- BUT - nao ha escala definida, cada pagina usa fonte diferente

### Espacamento
- Nao ha escala de espacamento definida
- Cada CSS define seus proprios valores

### Componentes
- Cards de noticia
- Menu hamburger
- Popup de servicos
- Galeria de fotos
- Cheffe Call
- BUT - sem sistema de componentes centralizado

---

## 3. PROBLEMAS IDENTIFICADOS

### 3.1 Cores
- [P1] Paleta de cores nao esta unificada
- [P1] Nao ha modo escuro/claro definido
- [P2] Contraste em alguns textos pode nao atender WCAG AA
- [P2] Cores de status (erro, sucesso, aviso) nao definidas

### 3.2 Tipografia
- [P1] 6+ familias de fontes diferentes em uso
- [P1] Tamanhos de fonte nao seguem escala modular
- [P2] Line-height inconsistente entre sessoes
- [P2] Peso tipografico nao padronizado

### 3.3 Layout
- [P1] Breakpoints de responsive nao sao consistentes
- [P1] Grid system parece ad-hoc por secao
- [P2] Espacamento vertical inconsistente (algunslugares 8px, outros 32px)
- [P2] Navbar e footer nao tem spec centralizada

### 3.4 Performance Visual
- [P1] Splash screen com animacoes pesadas para mobile
- [P1] Boot script com fetch desnecessarios no carregamento
- [P2] Imagens nao tem lazy loading otimizado
- [P2] Icones como sprites inline (SVG inlined) pesam o HTML

### 3.5 Acessibilidade
- [P2] Nao ha atributo aria definido nos componentes principais
- [P2] Navegacao por teclado nao foi testada
- [P3] Foco visual em elementos interativos pode nao ser visivel
- [P3] Imagens de noticias sem alt text otimizado

### 3.6 Mobile
- [P1] Menu hamburger tem animacao complexa desnecessaria
- [P1] Cards de noticia em mobile usam mesmo tamanho que desktop
- [P2] Touch targets menores que 44x44px
- [P2] Scroll horizontal em algumas sessoes mobile

---

## 4. RECOMENDACOES DE MELHORIA

### 4.1 Cores - IMPLEMENTAR TOKEN SYSTEM

Criar secao no DESIGN.md:

```
## Color Tokens

--color-primary:       #8B4513  /* terra deCruzeiro */
--color-primary-dark:  #5D2E0C  /* terra escura */
--color-primary-light: #C0682A  /* terra clara */
--color-secondary:     #2D5016  /* verde amazonico */
--color-secondary-light: #4A7C2E /* verde claro */
--color-accent:        #D4AF37  /* dourado */[truncated]
```

Impacto: Baixo esfuerzo, alto impacto em consistencia.

### 4.2 Tipografia - UNIFICAR EM 3 FONTES

FONTE_ATUAL:
```
- Fraunces: titulos de secao
- Source Sans Pro: UI e navegacao
- Libre Baskerville: corpo de noticia
- Lora: citacoes e destaque
- Inter: dashboard e admin
```

RECOMENDADO:
```
- Fraunces: titulos H1-H3
- Source Sans Pro: corpo, UI, navegacao
- Inter: codigo, dados, admin
```

Impacto: Medio esfuerzo, alto impacto em performance (menos fontes).

### 4.3 Espacamento - ESCALA MODULAR 8px

Adicionar ao DESIGN.md:

```
## Spacing Scale (8px base)

--space-1:  4px   /* 0.5x base */
--space-2:  8px   /* 1x base */
--space-3:  12px  /* 1.5x base */
--space-4:  16px  /* 2x base */
--space-6:  24px  /* 3x base */
--space-8:  32px  /* 4x base */
--space-12: 48px  /* 6x base */
--space-16: 64px  /* 8x base */
```

Substituir todos os valores hardcoded de padding/margin pelos tokens.

Impacto: Alto esfuerzo, alto impacto em manutenibilidade.

### 4.4 Layout - GRID SYSTEM CONSISTENTE

Adotar CSS Grid com template areas definido:

```
## Layout Grid

--grid-columns: repeat(12, 1fr)
--grid-gap: var(--space-4)

.section-hero     { grid-area: hero }
.section-news     { grid-area: news }
.section-services { grid-area: services }
.section-gallery  { grid-area: gallery }
```

Desktop: 12 colunas
Tablet: 8 colunas
Mobile: 4 colunas

Impacto: Alto esfuerzo, alto impacto em manutenibilidade.

### 4.5 Performance - OTIMIZAR SPLASH SCREEN

Problema atual: Boot script faz fetch de ate 60 noticias
mesmo antes do usuario ver qualquer coisa.

MELHORIA 1: Fetch progressivo
- Na abertura: apenas noticias "featured" (3-5)
- Ate 5s depois: carregar mais 10
- Ate 15s: restante (ate 20)

MELHORIA 2: Skeleton screens
- Substituir loader por skeleton do card de noticia
- Usuario ve conteudo antes, carrega depois

MELHORIA 3: Adaptive loading
- Mobile: nunca carregar mais de 10 noticias no boot
- 3G: nunca carregar imagens > 200KB no boot

Impacto: Medio esfuerzo, alto impacto em percepcacao de performance.

### 4.6 Mobile - MENU HAMBURGER SIMPLIFICADO

Problema atual: Menu com animacao SVG complexa no boot.

MELHORIA: CSS-only hamburger
- Usar checkbox hack + transform para animacao
- Zero JavaScript necessario
- Remover sprite SVG do menu

Impacto: Baixo esfuerzo, alto impacto em performance mobile.

### 4.7 Acessibilidade - WCAG AA BASICO

Melhorias rapidas:
- [ ] Adicionar `lang="pt-BR"` no html
- [ ] Definir `alt=""` em todas imagens decorativas
- [ ] Adicionar `aria-label` em botoes sem texto
- [ ] Definir `:focus-visible` com outline de 2px
- [ ] Adicionar `role="navigation"` no navbar

Impacto: Baixo esfuerzo, impacto legal (accessibility).

### 4.8 Componentes - SPECS CENTRALIZADAS

Criar secao no DESIGN.md para cada componente:

```
## Card de Noticia

TAMANHO:
- Desktop: 300px width, aspect-ratio 16/9
- Mobile: 100% width, aspect-ratio 4/3

ESTADO DEFAULT:
- bg: var(--color-surface)
- border: 1px solid var(--color-border)
- border-radius: var(--radius-md)

ESTADO HOVER:
- transform: translateY(-2px)
- box-shadow: var(--shadow-md)

ESTADO FOCUS:
- outline: 2px solid var(--color-primary)
- outline-offset: 2px
```

Impacto: Alto esfuerzo, alto impacto em consistencia.

---

## 5. PRIORIZACAO SUGERIDA

### FASE 1 - RAPIDO (1-2 dias)
- [ ] Token system de cores
- [ ] Hamburger CSS-only
- [ ] lang="pt-BR" + a11y basico
- [ ] Focus styles

### FASE 2 - MEDIO (3-5 dias)
- [ ] Escala de espacamento
- [ ] Skeleton screens no boot
- [ ] Lazy loading otimizado
- [ ] Reduzir fetch de noticias no boot

### FASE 3 - LONGO (1-2 semanas)
- [ ] Unificar familias de fontes
- [ ] Grid system completo
- [ ] Specs de componentes
- [ ] Modo escuro

---

## 6. FERRAMENTAS RECOMENDADAS

- **Design Tokens**: https://designtokens.io (gerador de tokens)
- **Stark**: plugin Figma para contraste WCAG
- **axe DevTools**: auditoria automatica de acessibilidade
- **Lighthouse**: metricas de performance
- **CSS Container Queries**: para componentes mais reutilizaveis

---

## 7. CONTRATO COM AGENTES (DESIGN.MD)

O arquivo DESIGN.md existente ja define:
- Paleta de cores com valores hex
- Sistema tipografico (Fraunces + Source Sans)
- Espacamento em escala 8px
- Do's and Don'ts

Proximos passos para transforma-lo em SPEC COMPLETA:
1. Adicionar tokens de espacamento ausentes
2. Adicionar spec de componentes
3. Adicionar breakpoints de responsive
4. Adicionar tokens de estado (hover, focus, active, disabled)
5. Validar contraste WCAG de todas as cores

---

Gerado em: 2026-06-02
Baseado em: Google DESIGN.md Open Design Principles
