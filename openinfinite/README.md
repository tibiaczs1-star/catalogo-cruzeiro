# OpenInfinite Subsite (`/openinfinite/`)

## Overview

Subsistema web oficial do **OpenInfinite v6.1** (Windows 10/11 x64, macOS Apple Silicon e Ubuntu Linux VPS x64), servido em `/openinfinite/` por [`../server.js`](../server.js) e integrado ao motor comercial, de automação PIX e de licenciamento criptográfico Ed25519 em [`../badclaude-superbad-api.js`](../badclaude-superbad-api.js).

O pacote reúne vitrine interativa Obsidian WCAG AA, calculadora de economia por milhão/bilhão de tokens (`#economia-tokens`), painel público de telemetria agregada 100% anônima (`#consumo-ao-vivo`), distribuição dos 3 instaladores oficiais com demo gratuita de 1 hora (`.exe`, `.dmg`, `.tar.gz`), integração oficial com **Nous Research Hermes Agent** (`#ubuntu-hermes`), checkout PIX automatizado com upload de comprovante/E2E e entrega automática de chave na tela (`#checkout`) e validador online (`#licenca`).

## Interface

### Rotas HTTP e Distribuição Estática (`../server.js`)

- `[../server.js:pathname === "/openinfinite"]` — Redireciona via HTTP `302` (`Cache-Control: no-store`) para `Location: "/openinfinite/"`.
- `[../server.js:pathname.startsWith("/openinfinite/")]` — Serve arquivos estáticos em `openinfinite/` com proteção contra *path traversal* (`oiRoot`), resolução de diretório para [`./index.html`](./index.html) (`Cache-Control: no-store` em `.html`) e *allowlist* estrita de extensões.
- `[../server.js:pathname.startsWith("/api/openinfinite/")]` — Encaminha rotas públicas de telemetria agregada para `superbadSalesApi.handleApi`.
- `[../server.js:PUBLIC_STATIC_EXTENSIONS]` — Habilita entrega direta em `/downloads/` para `.exe`, `.dmg` e `.gz`/`.tgz` (`Content-Type: application/gzip`, pacotes `> 2 MB` servidos via stream fora do `staticFileResponseCache`):
  - `/downloads/OpenInfinite-Client-Setup.exe` (`37,02 MB` — Windows 10/11 x64)
  - `/downloads/OpenInfinite-Client-macOS.dmg` (`1,90 MB` — macOS Apple Silicon)
  - `/downloads/OpenInfinite-Client-Ubuntu-VPS.tar.gz` (`30,79 MB` — Ubuntu 22.04/24.04 `linux-x64`)

### Símbolos de UI, DOM e Controladores (`./index.html`)

- **Acessibilidade, Navegação e Modais**: `.skip-link` (`#conteudo`), `#topbar`, `#topHelpBtn`, `#topo`, `#hoverHudBtn`, `#hoverBarHint`, `.help-q`, `#shiftIModal` (`#shiftITitle`, `#shiftIWhat`, `#shiftIHow`, `#shiftICloseTop`, `#shiftICloseBtn`), `#zoomModal` (`#zoomImg`, `#zoomCloseBtn`).
- **Hero 3D & Simulador (`#painel-live`)**: `#livingStage`, `#particleCanvas`, `#cursorAura`, `#livingCore`, `#badge1`..`#badge3`, WAI-ARIA tabs `#cockpitTabs` (`#tab-shot-0`..`#tab-shot-3` + `#cockpitPanel`, `#stageZoomBtn`, `#featImg`, `#featTitle`, `#featDesc`, `#captionZoomBtn`), `#simEngineBtn`, `.lang-chip[data-lang="python"|"ts"|"go"|"rust"]`, `#langStatus`.
- **Economia por Escala (`#economia-tokens`) & Consumo Anônimo ao Vivo (`#consumo-ao-vivo`)**:
  - Calculadora 1M a 3B tokens (`R$ 52,20 / 1M` blended vs planos fixos): `#tokenPresets`, `#calcRefRateLabel`, `#calcVolTitle`, `#calcMeteredBrl`, `#calcWinSaveBadge`, `#calcProSaveBadge`, `renderTokenCalc(tokens, label, focusBtn)`.
  - Telemetria pública: `#liveStatsUpdated`, `#refreshStatsBtn`, `#liveTotalTokens`, `#liveCacheTokens`, `#liveSavedBrl`, `#liveClientsReq`, `#liveProfilesGrid`, `fetchPublicStats()`.
- **Ubuntu Linux VPS & Hermes Agent (`#ubuntu-hermes`)**: `#ubuntuInstallCmd` (`tar -xzf OpenInfinite-Client-Ubuntu-VPS.tar.gz && ./install-ubuntu-vps.sh`), `#copyUbuntuCmdBtn`, `#ubuntuCmdFeedback`.
- **Bento (`#recursos`), Fluxo (`#como-funciona`), Comparador (`#comparador`) e FAQ (`#faq`)**: `#cascadeSimBtn`, `#cascadeList`, `#cascadeStatusTxt`, `#scrubBars`, `#scrubVal`, `#scrubMeta`, `#miniThemePreview`, `#ramOptimizeBtn`, `#ramDemoVal`, abas `#comp-tab-demo` / `#comp-tab-win` / `#comp-tab-mac` (`#compPanel`), acordeão CSS Grid `0fr -> 1fr` (`.faq-trigger`, `#faq-btn-1`..`#faq-btn-4`, `#faq-panel-1`..`#faq-panel-4`).
- **Checkout PIX Automatizado (`#checkout`) & Validador (`#licenca`)**:
  - Pedido inicial: `#copyPixBtn`, `#pixCopyFeedback`, `#orderForm` (`#ordPlan`, `#ordName`, `#ordContact`, `#orderSubmitBtn`), `#orderErrorBox` (`#retryOrderBtn`), `#orderResultBox` (`#orderLiveStatusBadge`, `#orderResultCode`, `#copyBrcodeBtn`, `#brcodeCopyFeedback`, `#orderPixQrWrap`), `submitOrder()`.
  - Envio de comprovante/E2E e entrega automática na tela (WhatsApp apenas opcional em `#btnWhatsOrder`): `#receiptForm` (`#receiptFileInput`, `#receiptE2eInput`, `#receiptNoteInput`, `#receiptSubmitBtn`), `#receiptFeedbackBox`, `#checkOrderNowBtn`, `#deliveredKeyBox` (`#deliveredKeyValue`, `#copyDeliveredKeyBtn`, `#testDeliveredKeyBtn`, `#deliveredKeyFeedback`), funções `readFileAsBase64(file)`, `submitReceipt()`, `pollOrderStatus()`, `startOrderPolling()` e `renderDeliveredKey(licenseKey)`.
  - Validação online: `#verifyForm` (`#licKeyInput`, `#verifySubmitBtn`), `#licResultBox` (`#retryVerifyBtn`), `submitVerify()`.

### Fronteiras de API (`../badclaude-superbad-api.js`)

| Método & Rota | Autenticação / Limite | Contrato de Entrada | Contrato de Saída / Comportamento |
| :--- | :--- | :--- | :--- |
| `POST /api/superbad/orders` | Público (`256 KB`) | `{ buyer_name, buyer_contact, requested_edition: "infinite" \| "infinite_pro" }` | Cria pedido `pending_pix`, gera BR Code EMV + QR Code PNG Data URL e retorna `201` `{ ok: true, order: { order_id, order_secret, status, amount_centavos, amount_display, requested_edition, pix, whatsapp_url, created_at } }`. |
| `POST /api/superbad/orders/:orderId/receipt` | `order_secret` / `x-order-secret` (`MAX_RECEIPT_JSON_BYTES = 4 MB` exclusivo nesta rota) | `{ order_secret, receipt_note?, e2e_id?, receipt_file_b64?, receipt_file_mime?, receipt_file_name? }` (`image/png`, `image/jpeg`, `image/webp`, `application/pdf` até `3 MB`) | Valida segredo e MIME (`parseReceiptAttachment`), salva anexo privado em `data/superbad-receipts/`, faz *auto-match* com `store.pix_webhooks` (`reserveKeyFromPoolAndApproveOrder`) e retorna `200` `{ ok: true, order_id, status, auto_approved, edition, license_key?, order }`. |
| `GET /api/superbad/orders/:orderId` | `?order_secret=...` ou `x-order-secret` | Query/Header `order_secret` | Preserva `"pending_pix"` antes do recibo (`normalizePublicOrderStatus`) e retorna `{ ok: true, order: { ..., status, has_receipt_file, e2e_id, license_key } }`; descriptografa `license_key` **somente** quando `status` é `"approved"` ou `"delivered"`. |
| `POST /api/superbad/webhooks/pix` | `PIX_WEBHOOK_SECRET` via `crypto.timingSafeEqual` (`x-pix-webhook-secret` ou `Bearer`) | `{ e2e_id, amount_centavos?, amount_brl?, txid?, order_id? }` | Idempotente por `e2e_id`; concilia valor em centavos com pedido pendente/`receipt_submitted` (ou retém em `store.pix_webhooks` para conciliação reversa) e reserva chave Ed25519 do `key_pool`. |
| `GET /api/superbad/admin/key-pool` e `POST /api/superbad/admin/key-pool/stock` | `requireAdminOrOwnerProof` | `POST`: `{ edition, keys: string[] }` (1..500 chaves Ed25519 pré-assinadas) | Valida assinatura/tier (`verifyEd25519LicenseKey`), deduplica por SHA-256, cifra em repouso com `AES-256-GCM` (`encryptLicenseKeyAtRest`) e auto-atende pedidos `pix_verified` em espera. |
| `POST /api/superbad/admin/orders/:orderId/deliver-key` (e `/admin/licenses/register`) | `requireAdminOrOwnerProof` | `{ license_key \| raw_license_key, edition?, max_hwids? }` | Cifra a chave Ed25519 assinada offline pelo `DashboardControl` e anexa `encrypted_license_key` ao pedido (`status: "delivered"`), liberando-a na tela do cliente. |
| `POST /api/v1/licenses/verify` | Público (`256 KB`) | `{ key, hwid, email?, hostname?, version? }` | Valida Ed25519 (`OI6-INF`, `OI6-PRO`, `BC5-*`) ou chave persistida, revogação, expiração, `max_hwids` e `includesOpenInfinite`. |
| `POST /api/v1/telemetry/heartbeat` | Público (`256 KB`) | `{ key?, hwid?, tokens_total?, cache_tokens?, requests?, profile? }` (`clampSafeInt` + `normalizeTelemetryProfile`) | Atualiza contadores sanitizados em `store.network_nodes` por perfil (`demo`, `infinito`, `pro`, `superbad`, `founder`, `editor`) e invalida o cache de estatísticas. |
| `GET /api/openinfinite/public-stats` | Público (CORS `*`, cache `10s`) | Nenhum | Retorna agregados **100% anônimos** (`totals`, `pricing_reference` `R$ 52,20/1M`, `profiles[]` com média de tokens e economia em R$) sem jamais expor chaves, prefixos, e-mails, HWIDs, hostnames ou IPs. |

### Clientes Nativos, Ubuntu Linux VPS e Hermes Agent

- **Cliente Ubuntu Linux VPS (`OpenInfiniteLinux/`, `.NET 9` `linux-x64`)**:
  - Distribuído em `/downloads/OpenInfinite-Client-Ubuntu-VPS.tar.gz` (`30,79 MB`, binário single-file comprimido com `Microsoft.Data.Sqlite 9.0.0` + `install-ubuntu-vps.sh` para Ubuntu 22.04/24.04 sem exigir `root` + unit `systemd --user` opcional desativada por padrão).
  - Cofre Ed25519 + `ui.bin` `AES-256-CBC`, HWID derivado de `/etc/machine-id` (`OI-LNX-...`), Painel Web Local `127.0.0.1:4115` e Motor Infinite `127.0.0.1:4114/v1`, rejeitando chaves `OI6-INF` (exclusivas para Windows).
- **Integração Oficial Nous Research Hermes Agent (CLI + Harness)**:
  - Governada por `HasProOrHigher()` nos clientes Windows, macOS e Linux: liberada apenas em **Pro Multi-OS** (`OI6-PRO`, `R$ 159,00`), **SuperBad / Cockpit Pro Nível 3** (`BC5-MID`), **Fundador VIP** (`BC5-FND`) e `editor`; **bloqueada** na Demo 1h e no plano `OI6-INF` (`R$ 99,00` Windows-only).
  - Quando elegível, gera o wrapper CLI `infinite-hermes` / `infinite-hermes.cmd` apontando para `http://127.0.0.1:4114/v1` e grava `~/.hermes/openinfinite-endpoint.json` (`supportedHarnesses: ["opencode", "hermes"]`, `autoStartDaemon: false`), **sem jamais iniciar processos ou daemons do Hermes automaticamente**.

### Ativos Estáticos Locais (`assets/`)

- [`./assets/openinfinite_silver.png`](./assets/openinfinite_silver.png), [`./assets/openinfinite_tema_escuro.png`](./assets/openinfinite_tema_escuro.png), [`./assets/openinfinite_liquid_glass.png`](./assets/openinfinite_liquid_glass.png), [`./assets/openinfinite_estatisticas.png`](./assets/openinfinite_estatisticas.png), [`./assets/openinfinite_tema_claro.png`](./assets/openinfinite_tema_claro.png).

## Invariants

- **Planos Comerciais, Plataformas e Limites (`[../badclaude-superbad-api.js:EDITION_PLANS]`)**:
  - `infinite` (*OpenInfinite Windows*): `R$ 99,00` (`9900` centavos), `OI6-INF`, `30 dias`, `max_hwids: 1`, exclusivo Windows (rejeitado no Linux/macOS e sem Hermes Agent).
  - `infinite_pro` (*OpenInfinite Pro Multi-OS*): `R$ 159,00` (`15900` centavos), `OI6-PRO`, `30 dias`, `max_hwids: 2`, habilitado em Windows + macOS Apple Silicon + Ubuntu Linux VPS com Hermes Agent CLI + Harness liberado.
  - **Demo 1h Gratuita & Inclusão `BC5` Nível 3+**: Demo de 60 minutos liberada nos 3 instaladores (Hermes bloqueado na demo); chaves `BC5-...` 3º nível+ (`superbad` / **Cockpit Pro** e `founder` / **Fundador VIP**) retornam `includesOpenInfinite: true` e habilitam Multi-OS + Hermes (`BC5` Nível 1/2 retorna `includesOpenInfinite: false`).
- **Isolamento Criptográfico & Privacidade (`[../badclaude-superbad-api.js]`)**:
  - `master-license-private.pem` permanece **100% offline** no `DashboardControl` local; o servidor web recebe apenas chaves Ed25519 já assinadas e as armazena cifradas com `AES-256-GCM` (`deriveKeyPoolAesKey` via HKDF-SHA256 sobre `KEY_POOL_SECRET || downloadSecret`).
  - `data/superbad-receipts/` nunca é servido publicamente; `GET /api/superbad/orders/:orderId` jamais expõe `license_key` sem `order_secret` válido e status `approved`/`delivered`.
  - `GET /api/openinfinite/public-stats` é estritamente livre de PII (zero chaves, prefixos `OI6-`/`BC5-`, e-mails, HWIDs, hostnames ou IPs).
- **Higiene de UI & Acessibilidade WCAG AA (`[../scripts/__tests__/openinfinite-subsite.test.js]`)**:
  - Zero `alert()`, zero glifo privado Apple `\uF8FF` (`▯`), `#livingCore` 3D responsivo ao cursor mesmo com `prefers-reduced-motion`, zero menção a `4114`, `demo_lock` ou `shift_i.png` no HTML público, e zero auto-start de daemons externos nos clientes.

## Side Effects

- **Cliente Navegador (`./index.html`)**: `fetch` em `GET /api/openinfinite/public-stats`, `POST /api/superbad/orders`, `POST /api/superbad/orders/:orderId/receipt` (base64 até 3 MB), polling `GET /api/superbad/orders/:orderId?order_secret=...` e `POST /api/v1/licenses/verify`; persistência leve do pedido ativo no navegador (`saveActiveOrder`); escrita no clipboard (`copyTextSafely`) e download dos instaladores `.exe`, `.dmg` e `.tar.gz`.
- **Servidor (`../badclaude-superbad-api.js`)**: escrita atômica serializada (`withStoreLock` + `writeStore`) em `data/superbad-orders.json` (`orders`, `licenses`, `key_pool` cifrado `AES-256-GCM`, `pix_webhooks`, `network_nodes`) e gravação privada de comprovantes em `data/superbad-receipts/`.

## Verification

- Run (a partir de `C:\Users\junio\catalogo-cruzeiro`):
  ```bash
  node --test scripts/__tests__/openinfinite-subsite.test.js scripts/__tests__/openinfinite-automation.test.js scripts/__tests__/superbad-sales.test.js
  ```
