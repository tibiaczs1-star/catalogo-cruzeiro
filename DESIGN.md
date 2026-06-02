---
version: alpha
name: Catalogo Cruzeiro do Sul
description: Portal editorial local com identidade visual jornalistica, tons terrosos do Vale do Juruá e interacao comunitaria.
colors:
  primary: "#1A3A4A"
  secondary: "#C4956A"
  tertiary: "#8B1A1A"
  accent: "#D4A843"
  neutral: "#F5F0E8"
  background: "#FAFAF7"
  text: "#1A1A1A"
  muted: "#6B7280"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
  jurnya-green: "#2D6A4F"
typography:
  h1:
    fontFamily: Fraunces, Georgia, serif
    fontSize: 2.8rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Fraunces, Georgia, serif
    fontSize: 1.8rem
    fontWeight: 600
    lineHeight: 1.2
  h3:
    fontFamily: Outfit, system-ui, sans-serif
    fontSize: 1.25rem
    fontWeight: 700
  body:
    fontFamily: Outfit, system-ui, sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: Outfit, system-ui, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
  label:
    fontFamily: Sora, system-ui, sans-serif
    fontSize: 0.75rem
    fontWeight: 600
    letterSpacing: "0.08em"
    textTransform: uppercase
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
elevation:
  low: "0 1px 3px rgba(0,0,0,0.12)"
  mid: "0 4px 12px rgba(0,0,0,0.15)"
  high: "0 8px 24px rgba(0,0,0,0.20)"
components:
  button-solid:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    border: "2px solid {colors.primary}"
    rounded: "{rounded.md}"
    padding: "10px 22px"
  card:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    shadow: "{elevation.low}"
  card-elevated:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    shadow: "{elevation.mid}"
  badge:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.label}"
  input:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.text}"
    border: "1px solid {colors.muted}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

## Spacing Scale (8px base)

```
--space-0:  0px
--space-1:  4px    /* 0.5× base */
--space-2:  8px    /* 1× base    */
--space-3:  12px   /* 1.5× base  */
--space-4:  16px   /* 2× base    */
--space-5:  20px   /* 2.5× base  */
--space-6:  24px   /* 3× base    */
--space-8:  32px   /* 4× base    */
--space-10: 40px   /* 5× base    */
--space-12: 48px   /* 6× base    */
--space-16: 64px   /* 8× base    */
--space-20: 80px   /* 10× base   */
--space-24: 96px   /* 12× base   */
```

Regra: todo padding/margin/gap deve usar tokens, nunca valores hardcoded.

## Breakpoints

```
--bp-mobile:  480px
--bp-tablet:  768px
--bp-desktop: 1024px
--bp-wide:    1280px
--bp-max:     1536px
```

```
/* Uso */
@media (max-width: var(--bp-mobile))  { ... }
@media (max-width: var(--bp-tablet))  { ... }
@media (min-width: var(--bp-desktop)) { ... }
```

## Component States

### Button Solid
- **Default:** bg `primary`, text white, rounded `md`, shadow `low`
- **Hover:** bg escurece 10%, translateY(-1px), shadow `mid`
- **Focus:** outline 2px solid `accent`, outline-offset 2px
- **Active:** translateY(0), shadow `low`
- **Disabled:** opacity 0.5, cursor not-allowed

### Button Outline
- **Default:** bg transparent, border 2px solid `primary`, text `primary`
- **Hover:** bg `primary` 10% opacity, border escurece
- **Focus:** outline 2px solid `accent`, outline-offset 2px
- **Active:** bg `primary` 20% opacity

### Card News
- **Default:** bg white, rounded `lg`, shadow `low`, border 1px solid `line`
- **Hover:** translateY(-2px), shadow `mid`, border-color `secondary`
- **Focus:** outline 2px solid `accent`
- **Active:** scale(0.99)

### Input Field
- **Default:** bg white, border 1px solid `muted`, rounded `md`
- **Hover:** border-color `primary` 60%
- **Focus:** border-color `primary`, box-shadow 0 0 0 3px `primary` 20% opacity
- **Error:** border-color `danger`, box-shadow 0 0 0 3px `danger` 15% opacity
- **Disabled:** bg `neutral`, opacity 0.6

### Badge
- **Default:** bg `accent`, text `primary`, rounded `full`
- **Variants:** `secondary` bg `secondary`, `danger` bg `danger`
- **Size:** sm padding 2px 8px / md padding 4px 12px

### Navigation Link
- **Default:** text `ink`, no underline
- **Hover:** text `primary`, underline
- **Active:** text `primary`, font-weight 700

## Accessibility
- `:focus-visible` em todo elemento interativo: outline 2px solid `accent`, outline-offset 2px
- Imagens decorativas: `alt=""` + `aria-hidden="true"`
- Botões sem texto: `aria-label`
- Áreas de navegação: `role="navigation"` + `aria-label`
- `lang="pt-BR"` já definido no HTML

## Overview

Portal editorial-local para Cruzeiro do Sul e Vale do Juruá, no Acre. O Catálogo agrega notícias, serviços, guia telefônico, anúncios pagos (PubPaid) e jogos comunitarios. A identidade visual transmite credibilidade jornalística com calor regional — tons terrosos, verdejante e aksenial.

## Colors

- **Primary (#1A3A4A):** Azul-escuro editorial — cabeçalhos, navegação e ações principais.
- **Secondary (#C4956A):** Terracota suave — elementos de destaque e bordas premium.
- **Tertiary (#8B1A1A):** Vermelho profundo — alertas, emergência e urgência.
- **Accent (#D4A843):** Dourado do Cruzeiro — badges, ícones e CTAs de conversão.
- **Neutral (#F5F0E8):** Areia clara — backgrounds de seções alternadas.
- **Jurnya Green (#2D6A4F):** Verde do Vale — identidade visual do banner e elementos naturais.

## Typography

Três famílias em harmonia:
- **Fraunces** (serif): títulos, manchetes e marca — autoridade jornalística.
- **Outfit** (sans): corpo, descrição e UI — legibilidade moderna.
- **Sora** (sans condensada): labels, badges e navegação — densidade informativa.

## Layout

Grade de 12 colunas com gutters de 24px. Espaçamento vertical em escala de 8px. Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px).

## Elevation

Sombras em três níveis: `low` para cards resting, `mid` para hover/elevação, `high` para modais e overlays.

## Do's and Don'ts
- USE: tokens de cor em todos os componentes visuais — mantém consistência com a identidade
- USE: espaçamento em escala de 8px para margens e paddings consistentes
- USE: fonte Fraunces apenas em títulos e logos — nunca em corpo de texto
- USE: Outfit para corpo e Sora para labels densas
- NAO USE: cores fora do palette sem justificativa editorial
- NAO USE: sombra elevation.high em elementos que nao sejam modais ou overlays
- NAO USE: border-radius full fora de avatares e badges
- NAO USE: mais de 3 fontes diferentes em uma mesma pagina
