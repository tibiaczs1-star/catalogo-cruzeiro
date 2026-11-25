# OpenInfinite Subsite (`/openinfinite/`)

## Overview

Subsistema web oficial do aplicativo desktop **OpenInfinite v6.1** (Windows 10/11 x64 e macOS Apple Silicon), servido na rota pública `/openinfinite/` pelo servidor principal [`../server.js`](../server.js) e integrado ao motor comercial e criptográfico de pedidos PIX e licenças Ed25519 em [`../badclaude-superbad-api.js`](../badclaude-superbad-api.js).

O pacote combina vitrine interativa de baixa latência (estética Obsidian de alto contraste WCAG AA, símbolo vivo 3D `#livingCore`, simuladores de cascata `HY4 #1` / telemetria SQLite / temas / comparador de planos e FAQ em CSS Grid `0fr -> 1fr`) com distribuição da demonstração gratuita de 1 hora (`.exe` e `.dmg`), checkout PIX mensal (`R$ 99,00` Windows e `R$ 159,00` macOS & Multi) e validação online de chaves `OI6-INF`, `OI6-PRO` e `BC5` (BadClaude 3º nível+).

## Interface

### Rotas HTTP e Distribuição Estática (`../server.js`)

- `[../server.js:pathname === "/openinfinite"]` — Redireciona via HTTP `302` (`Cache-Control: no-store`) para `Location: "/openinfinite/"`.
- `[../server.js:pathname.startsWith("/openinfinite/")]` — Serve arquivos estáticos contidos em `openinfinite/` com proteção contra *path traversal* (`oiRoot`), resolução automática de diretório para [`./index.html`](./index.html) (`Cache-Control: no-store` para `.html`) e *allowlist* estrita de extensões (`"", ".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".json"`).
- `[../server.js:PUBLIC_STATIC_EXTENSIONS]` — Habilita entrega direta dos instaladores oficiais de demonstração gratuita (1h) referenciados em [`./index.html`](./index.html):
  - `/downloads/OpenInfinite-Client-Setup.exe` (Windows 10/11 x64)
  - `/downloads/OpenInfinite-Client-macOS.dmg` (macOS Apple Silicon)

### Símbolos de UI, DOM e Controladores (`./index.html`)

- **Acessibilidade, Navegação e Modais**:
  - `[./index.html:.skip-link]` (`href="#conteudo"`), `[./index.html:#topbar]`, `[./index.html:#topo]`, `[./index.html:#conteudo]`
  - Ajuda contextual `Shift + I`: `[./index.html:#topHelpBtn]`, `[./index.html:#hoverHudBtn]`, `[./index.html:#hoverBarHint]`, `[./index.html:.help-q]`, modal `[./index.html:#shiftIModal]` (`#shiftITitle`, `#shiftIWhat`, `#shiftIHow`, `#shiftICloseTop`, `#shiftICloseBtn`), funções `openHelpModal(rawEl)` e `closeHelpModal()`
  - Ampliação de capturas: `[./index.html:#stageZoomBtn]`, `[./index.html:#captionZoomBtn]`, modal `[./index.html:#zoomModal]` (`#zoomImg`, `#zoomCloseBtn`), funções `openZoomModal(src)` e `closeZoomModal()`
- **Hero 3D & Simulador do Painel (`#painel-live`)**:
  - Símbolo vivo 3D reativo ao ponteiro: `[./index.html:#livingStage]`, `[./index.html:#particleCanvas]`, `[./index.html:#cursorAura]`, `[./index.html:#livingCore]`, `[./index.html:#badge1]`, `[./index.html:#badge2]`, `[./index.html:#badge3]` (`tickSpring` + `drawParticles`)
  - WAI-ARIA Tabs + View Transitions (`oi-hero-shot`): `[./index.html:#cockpitTabs]` (`role="tablist"`, `#tab-shot-0`..`#tab-shot-3` com navegação `ArrowRight`, `ArrowLeft`, `Home`, `End`), `[./index.html:#cockpitPanel]` (`role="tabpanel"`, `#featImg`, `#featTitle`, `#featDesc`), funções `activateShot(idx, focusTab)` e `runTransition(fn)`
  - Controle do motor e foco por linguagem: `[./index.html:#simEngineBtn]`, `.lang-chip[data-lang="python"|"ts"|"go"|"rust"]`, `[./index.html:#langStatus]` (`LANG_PROFILES`)
- **Simuladores Bento (`#recursos`), Fluxo (`#como-funciona`), Comparador (`#comparador`) e FAQ (`#faq`)**:
  - Cascata `HY4 #1`: `[./index.html:#cascadeSimBtn]`, `[./index.html:#cascadeStatusTxt]`, `[./index.html:#cascadeList]`
  - Scrubber SQLite: `[./index.html:#scrubBars]`, `[./index.html:#scrubVal]`, `[./index.html:#scrubMeta]`, `selectScrubCol(col)`
  - Seletor dos 3 temas nativos: `[data-theme-opt="dark"|"liquid"|"light"]`, `[./index.html:#miniThemePreview]`, `[./index.html:#miniThemeTitle]`, `[./index.html:#miniThemeDesc]` (`THEME_COPY`)
  - Limpeza de RAM: `[./index.html:#ramOptimizeBtn]`, `[./index.html:#ramDemoVal]`
  - Comparador de modalidades (`COMP_DATA`): `[./index.html:#comparador]`, abas `#comp-tab-demo` (`data-comp="demo"`), `#comp-tab-win` (`data-comp="infinite"`) e `#comp-tab-mac` (`data-comp="infinite_pro"`), painel `[./index.html:#compPanel]` (`#compPrice`, `#compDevices`, `#compEngine`, `#compKey`, `#compSummary`, `#compActionBtn`), função `activateComp(key, focusTab)`
  - Acordeão FAQ (`grid-template-rows: 0fr -> 1fr`): `[./index.html:#faq]`, botões `.faq-trigger` (`#faq-btn-1`..`#faq-btn-4`, `aria-expanded`) e regiões `#faq-panel-1`..`#faq-panel-4`
- **Checkout PIX Mensal (`#planos` / `#checkout`)**:
  - Seleção de plano: `[data-select-plan="infinite"|"infinite_pro"]`, função `selectPlan(p)`
  - Cópia inline sem popup nativo: `[./index.html:#copyPixBtn]`, `[./index.html:#pixCopyFeedback]`, `[./index.html:#copyBrcodeBtn]`, `[./index.html:#brcodeCopyFeedback]`, funções `copyTextSafely(text)` e `showInlineCopyState(...)`
  - Formulário e estados: `[./index.html:#orderForm]`, `[./index.html:#ordPlan]`, `[./index.html:#ordName]`, `[./index.html:#ordContact]`, `[./index.html:#orderSubmitBtn]`, erro/offline inline `[./index.html:#orderErrorBox]` (`#orderErrorHead`, `#orderErrorMsg`, `#retryOrderBtn`), sucesso `[./index.html:#orderResultBox]` (`#orderResultHead`, `#orderResultCode`, `#orderPixQrWrap`, `#btnWhatsOrder`), função `submitOrder()`
  - Nota discreta de inclusão BadClaude: `[./index.html:.bc-footnote]` com link para `/badclaude/`
- **Validador Online de Licença (`#licenca`)**:
  - Formulário e estados: `[./index.html:#verifyForm]`, `[./index.html:#licKeyInput]`, `[./index.html:#verifySubmitBtn]`, container `[./index.html:#licResultBox]` (botão dinâmico `#retryVerifyBtn` em falhas de rede/offline), funções `submitVerify()` e `renderLicenseMessage(variant, titleText, detailText, withRetry)`

### Fronteiras de API (`../badclaude-superbad-api.js`)

| Método & Rota | Consumidor Local | Contrato de Entrada | Contrato de Saída / Comportamento |
| :--- | :--- | :--- | :--- |
| `POST /api/superbad/orders` | `[./index.html:submitOrder]` | `{ buyer_name: string, buyer_contact: string, requested_edition: "infinite" \| "infinite_pro" }` | Valida `VALID_EDITIONS` / `EDITION_PLANS` em `[../badclaude-superbad-api.js:createSuperbadSalesApi]`, gera BR Code EMV (`buildPixBrCode`) + QR Code Data URL e retorna HTTP `201` `{ ok: true, order: { order_id, order_secret, status: "pending_pix", amount_centavos, amount_display, requested_edition, pix: { key, recipient, brcode, qr_data_url }, whatsapp_url, payment_provider: "pix_manual", created_at } }`. |
| `POST /api/v1/licenses/verify` | `[./index.html:submitVerify]` | `{ key: string, hwid: string, email?: string, hostname?: string, version?: string }` | Verifica assinatura Ed25519 (`[../badclaude-superbad-api.js:verifyEd25519LicenseKey]`, prefixos `OI6-INF`, `OI6-PRO`, `BC5-FND`, `BC5-MID`, `BC5-BSC`) ou chave persistida (`findLicenseByKey`), checa revogação, expiração e limite `max_hwids`, calcula `includesOpenInfinite` e retorna HTTP `200` `{ ok: true, valid: true, revoked: false, licenseId, edition, includesOpenInfinite, tier, planLabel, hwid, boundHwidsCount, maxHwids, daysLeft, expiresAt, unlockedModes, sessionToken, serverTime }` (ou `400`/`401`/`403` com `{ ok: false, code, error }`). |

### Ativos Estáticos Locais (`assets/`)

Diretório de mídia estática (sem código-fonte executável):
- [`./assets/openinfinite_silver.png`](./assets/openinfinite_silver.png) — Símbolo metálico da marca (`#topbar` e `#livingCore`).
- [`./assets/openinfinite_tema_escuro.png`](./assets/openinfinite_tema_escuro.png) — Captura oficial do Painel Principal Escuro (`SHOTS[0]`).
- [`./assets/openinfinite_liquid_glass.png`](./assets/openinfinite_liquid_glass.png) — Captura oficial do tema Liquid Glass (`SHOTS[1]`).
- [`./assets/openinfinite_estatisticas.png`](./assets/openinfinite_estatisticas.png) — Captura oficial das Estatísticas Reais SQLite (`SHOTS[2]`).
- [`./assets/openinfinite_tema_claro.png`](./assets/openinfinite_tema_claro.png) — Captura oficial do Tema Claro Apple Daylight (`SHOTS[3]`).

## Invariants

- **Planos Comerciais e Limites de Dispositivos (`[../badclaude-superbad-api.js:EDITION_PLANS]`)**:
  - `infinite` (*OpenInfinite Windows*): `amountCentavos: 9900` (`R$ 99,00`), `tier: "infinite-basic"`, `tierCode: "INF"` (chave `OI6-INF-...`), `defaultDays: 30`, `defaultMaxHwids: 1` (1 PC Windows).
  - `infinite_pro` (*OpenInfinite macOS & Multi*): `amountCentavos: 15900` (`R$ 159,00`), `tier: "infinite-pro"`, `tierCode: "PRO"` (chave `OI6-PRO-...`), `defaultDays: 30`, `defaultMaxHwids: 2` (macOS Apple Silicon + Windows em até 2 máquinas simultâneas).
  - **Demonstração Gratuita de 1 Hora**: Ambos os instaladores (`/downloads/OpenInfinite-Client-Setup.exe` e `/downloads/OpenInfinite-Client-macOS.dmg`) devem permanecer acessíveis no Hero e no comparador para 60 minutos de uso sem chave prévia.
- **Elegibilidade Cruzada BadClaude (`BC5` Nível 3+)**:
  - Em `[../badclaude-superbad-api.js:includesOpenInfinite]`, `includesOpenInfinite` é `true` exclusivamente quando `edition === "founder" || edition === "superbad" || tier === "founder" || String(tier).startsWith("infinite")`.
  - Chaves `BC5-...` a partir do 3º nível (**Cockpit Pro** / `superbad` e **Fundador VIP** / `founder`) liberam o OpenInfinite v6.1 Windows + macOS sem custo extra (referenciado de forma discreta em `.bc-footnote` com `href="/badclaude/"`).
  - Chaves BadClaude de 1º/2º nível (`basic`, `mid`, `beta`, ex.: `BC5-BSC`) retornam `includesOpenInfinite: false`, exibindo aviso inline `is-warn` em `#licResultBox` (restritas à demo de 1h no OpenInfinite salvo assinatura própria).
- **Recebedor PIX Oficial (`[../badclaude-superbad-api.js:PIX_DISPLAY_KEY]`)**:
  - Chave exibida `68 99226-9296` (`DEFAULT_PIX_EMV_KEY = "+5568992269296"`), titular `Raiane Lenoncio`, cidade `CRUZEIRO DO SUL`, WhatsApp `5568992269296`.
- **Acessibilidade WCAG AA, UX Inline e Higiene de Conteúdo (`[../scripts/__tests__/openinfinite-subsite.test.js]`)**:
  - **Zero `alert()`**: É proibido usar `alert()` em [`./index.html`](./index.html). Cópia de PIX, validação de campos (`aria-invalid`), detecção offline (`navigator.onLine === false`) e botões de nova tentativa (`#retryOrderBtn`, `#retryVerifyBtn`) devem ocorrer inline, construindo nós DOM com `textContent` / `createElement` (prevenção de XSS).
  - **Símbolo Vivo 3D Sempre Responsivo**: `#livingStage` e `#livingCore` devem manter o rastreamento 3D ao ponteiro (`rotateX` / `rotateY`) mesmo quando `prefers-reduced-motion: reduce` estiver ativo (que pausa apenas animações CSS decorativas `.css-anim`/`.reveal` e deriva autônoma de partículas).
  - **Termos e Arquivos Proibidos**: [`./index.html`](./index.html) nunca deve conter `4114`, `demo_lock`, `shift_i.png`, `"NÃO é vendido separado"` ou `"não é vendido avulso"`, e os arquivos legados `assets/openinfinite_demo_lock.png` e `assets/openinfinite_shift_i.png` não podem existir em `./assets/`.

## Side Effects

- **Cliente Navegador (`./index.html`)**:
  - Dispara requisições HTTP `POST /api/superbad/orders` (criação de pedido PIX) e `POST /api/v1/licenses/verify` (enviando `hwid: "web-" + (navigator.platform || "browser")`).
  - Grava a chave PIX ou código EMV na área de transferência do sistema via `navigator.clipboard.writeText` (com *fallback* temporário `document.execCommand('copy')` em `copyTextSafely`).
  - Inicia download direto de binários `/downloads/OpenInfinite-Client-Setup.exe` e `/downloads/OpenInfinite-Client-macOS.dmg` e abre link externo de comprovante/suporte em `https://wa.me/5568992269296`.
- **Persistência e Telemetria no Servidor (`../badclaude-superbad-api.js`)**:
  - `POST /api/superbad/orders` adquire lock serializado em memória (`withStoreLock`) e grava atomicamente (`writeStore` via arquivo `.tmp` + `rename`) o novo pedido `pending_pix` (com `order_secret_hash` SHA-256) em `data/superbad-orders.json`.
  - `POST /api/v1/licenses/verify` auto-registra licenças Ed25519 inéditas válidas (`buildAutoEnrolledEd25519License`, `issued_origin: "ed25519-auto-enrolled"`), vincula novos `hwid` em `license.bound_hwids` até `max_hwids`, atualiza `last_seen_at`, registra/atualiza o nó em `store.network_nodes` (`upsertNetworkNode`, limitado aos 500 registros mais recentes com IP mascarado por `maskIp`), persiste em `data/superbad-orders.json` e emite `sessionToken` HMAC-SHA256 com validade de 24h (`signToken`).

## Verification

- Run (a partir de `C:\Users\junio\catalogo-cruzeiro`):
  ```bash
  node --test scripts/__tests__/openinfinite-subsite.test.js
  ```
