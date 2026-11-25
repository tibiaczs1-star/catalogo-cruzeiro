# OpenInfinite Subsite (`/openinfinite/`)

## Overview

Subsistema web oficial do **OpenInfinite v6.1** (Windows 10/11 x64, macOS Apple Silicon e Ubuntu Linux VPS x64), servido em `/openinfinite/` por [`../server.js`](../server.js) e integrado ao motor de autenticação Google, checkout PIX supervisionado pelo proprietário, disparo de e-mail de ativação e licenciamento criptográfico Ed25519 em [`../badclaude-superbad-api.js`](../badclaude-superbad-api.js).

O pacote reúne vitrine interativa Obsidian WCAG AA, calculadora de economia por milhão/bilhão de tokens (`#economia-tokens`), painel público de telemetria agregada 100% anônima (`#consumo-ao-vivo`), 3 instaladores oficiais com demo gratuita de 1 hora (`.exe`, `.dmg`, `.tar.gz`), integração oficial **Nous Research Hermes Agent** (`#ubuntu-hermes`), jornada de assinatura em 4 passos (`#step1Google` -> `#step2Pix` -> `#step3Receipt` -> `#step4Analysis` -> `#deliveredKeyBox`) e validador online com suporte a link de teste por e-mail (`#validador` + `?test_key=...`).

## Interface

### Rotas HTTP, Sessão Google e Distribuição Estática (`../server.js`)

- `[../server.js:pathname === "/openinfinite"]` e `[../server.js:pathname.startsWith("/openinfinite/")]` — Redirecionamento `302` para `/openinfinite/` e entrega estática segura com guarda `oiRoot` e resolução para [`./index.html`](./index.html) (`Cache-Control: no-store`).
- **Sessão Google & Auth Config (`../server.js`)**:
  - `GET /api/auth/config`, `GET /api/auth/session`, `POST /api/auth/google` e `POST /api/auth/logout` — Autenticação OAuth/GIS compartilhada com [`../site-google-auth.js`](../site-google-auth.js), usando `SITE_AUTH_SESSION_SECRET` com fallback automático para `SUPERBAD_SESSION_SECRET` e resolução de Client ID via `getEffectiveGoogleClientId()` (`GOOGLE_AUTH_CLIENT_ID || PUBPAID_GOOGLE_CLIENT_ID || superbadSalesApi.getGoogleClientId()`).
  - `readCatalogoAuthSession`, `isCatalogoGoogleAuthEnabled` e `notifyOwnerWhatsApp` são injetados diretamente em `createSuperbadSalesApi(...)`.
- `[../server.js:pathname.startsWith("/api/openinfinite/")]` — Encaminha `/api/openinfinite/public-stats` para `superbadSalesApi.handleApi`.
- `[../server.js:PUBLIC_STATIC_EXTENSIONS]` — Serve em `/downloads/` `.exe`, `.dmg` e `.gz`/`.tgz` (`Content-Type: application/gzip`, pacotes `> 2 MB` via stream fora de `staticFileResponseCache`):
  - `/downloads/OpenInfinite-Client-Setup.exe` (`37,02 MB` — Windows 10/11 x64)
  - `/downloads/OpenInfinite-Client-macOS.dmg` (`1,90 MB` — macOS Apple Silicon)
  - `/downloads/OpenInfinite-Client-Ubuntu-VPS.tar.gz` (`30,79 MB` — Ubuntu 22.04/24.04 `linux-x64`)

### Símbolos de UI, DOM e Fluxo de 4 Passos (`./index.html`)

- **Acessibilidade, Navegação e Modais**: `.skip-link` (`#conteudo`), `#topbar`, `#topHelpBtn`, `#topo`, `#hoverHudBtn`, `#hoverBarHint`, `.help-q`, `#shiftIModal` (`#shiftITitle`, `#shiftIWhat`, `#shiftIHow`, `#shiftICloseTop`, `#shiftICloseBtn`), `#zoomModal` (`#zoomImg`, `#zoomCloseBtn`).
- **Hero 3D & Simulador (`#painel-live`)**: `#livingStage`, `#particleCanvas`, `#cursorAura`, `#livingCore`, `#badge1`..`#badge3`, WAI-ARIA tabs `#cockpitTabs` (`#tab-shot-0`..`#tab-shot-3` + `#cockpitPanel`, `#stageZoomBtn`, `#featImg`, `#featTitle`, `#featDesc`, `#captionZoomBtn`), `#simEngineBtn`, `.lang-chip[data-lang="python"|"ts"|"go"|"rust"]`, `#langStatus`.
- **Economia (`#economia-tokens`), Telemetria Anônima (`#consumo-ao-vivo`) & Ubuntu/Hermes (`#ubuntu-hermes`)**:
  - Calculadora 1M..3B tokens (`R$ 52,20 / 1M` blended): `#tokenPresets`, `#calcRefRateLabel`, `#calcVolTitle`, `#calcMeteredBrl`, `#calcWinSaveBadge`, `#calcProSaveBadge`, `renderTokenCalc(...)`.
  - Painel anônimo: `#liveStatsUpdated`, `#refreshStatsBtn`, `#liveTotalTokens`, `#liveCacheTokens`, `#liveSavedBrl`, `#liveClientsReq`, `#liveProfilesGrid`, `fetchPublicStats()`.
  - Linux VPS & Hermes: `#ubuntuInstallCmd`, `#copyUbuntuCmdBtn`, `#ubuntuCmdFeedback`.
- **Bento (`#recursos`), Fluxo (`#como-funciona`), Comparador (`#comparador`) e FAQ (`#faq`)**: `#cascadeSimBtn`, `#cascadeList`, `#cascadeStatusTxt`, `#scrubBars`, `#scrubVal`, `#scrubMeta`, `#miniThemePreview`, `#ramOptimizeBtn`, `#ramDemoVal`, `#comp-tab-demo` / `#comp-tab-win` / `#comp-tab-mac` (`#compPanel`), acordeão CSS Grid `0fr -> 1fr` (`#faq-btn-1`..`#faq-btn-4`, `#faq-panel-1`..`#faq-panel-4`).
- **Checkout PIX em 4 Passos (`#checkout`) & Validador (`#validador`)**:
  - **Passo 1 — Login Google (`#step1Google`)**: `[data-google-auth-card]`, `#step1StateTag`, `#googleAuthLead`, `#googleAuthBtnHost`, `#googleConnectedBox` (`#googleUserAvatar`, `#googleUserInitial`, `#googleUserName`, `#googleUserEmail`, `#googleLogoutBtn`), `#googleFallbackNotice`, `#myOrdersRestoreNote`, funções `initAuthCheck()`, `updateGoogleAuthUI(detail)` e `syncMyGoogleOrders()`.
  - **Passo 2 — Geração do PIX (`#step2Pix`)**: `#copyPixBtn`, `#pixCopyFeedback`, `#orderForm` (`#ordPlan`, `#ordName`, `#ordContact`, `#orderSubmitBtn`), `#orderErrorBox` (`#retryOrderBtn`), `#orderResultBox` (`#orderLiveStatusBadge`, `#orderResultCode`, `#copyBrcodeBtn`, `#brcodeCopyFeedback`, `#orderPixQrWrap`), `submitOrder()`.
  - **Passo 3 — Envio do Comprovante (`#step3Receipt`)**: `#receiptForm` (`#receiptFileInput`, `#receiptE2eInput`, `#receiptNoteInput`, `#receiptSubmitBtn`), `#receiptFeedbackBox`, funções `readFileAsBase64(file)` e `submitReceipt()`.
  - **Passo 4 — Análise & Ativação pelo Proprietário (`#step4Analysis` + `#deliveredKeyBox`)**: `#step4SlaBadge`, `#step4Headline`, `#receiptAnalysisSummary`, `#analysisTargetEmail`, `#btnWhatsOrder` (ativação imediata via WhatsApp), `#slaOneHourNotice` (SLA de até 1h para ativação no `Dashboard Control` e envio por e-mail), `#checkOrderNowBtn`, `#pollHintTxt`, e `#deliveredKeyBox` (`#deliveredKeyValue`, `#copyDeliveredKeyBtn`, `#testDeliveredKeyBtn`, `#deliveredKeyFeedback`, controlado por `isKeyUnlockedStatus` e `syncAnalysisAndDeliveryUI`).
  - **Validador Online (`#validador` / âncora `#licenca`)**: `#verifyForm` (`#verifyKeyInput`, `#verifySubmitBtn`), `#licResultBox` (botão dinâmico JS `retryVerifyBtn` em erro de rede), auto-preenchimento e validação ao abrir `?test_key=<CHAVE>#validador`, função `submitVerify()`.

### Fronteiras de API (`../badclaude-superbad-api.js`)

| Método & Rota | Autenticação / Limite | Contrato de Entrada | Contrato de Saída / Comportamento |
| :--- | :--- | :--- | :--- |
| `GET/POST /api/superbad/admin/auth-config` | `requireAdminOrOwnerProof` | `POST`: `{ google_client_id: string }` | Lê ou persiste `store.auth_config.google_client_id` sincronizado pelo `Dashboard Control`. |
| `GET /api/superbad/my-orders` | Sessão Google (`readCatalogoAuthSession`) | Cookie de sessão Google | Restaura pedidos vinculados ao `google_sub`/`google_email` autenticado (`license_key` retornada **apenas** quando `approved`/`delivered`). |
| `POST /api/superbad/orders` | Sessão Google quando `isGoogleAuthEnabled()` ativo (`401 GOOGLE_AUTH_REQUIRED`) | `{ buyer_name, buyer_contact, requested_edition: "infinite" \| "infinite_pro" }` | Cria pedido `pending_pix` vinculado a `google_sub`/`google_email`/`google_name`/`buyer_email` e retorna `201` com BR Code EMV e QR Code Data URL. |
| `POST /api/superbad/orders/:orderId/receipt` | `order_secret` / `x-order-secret` (`MAX_RECEIPT_JSON_BYTES = 4 MB` exclusivo na rota) | `{ order_secret, receipt_note?, e2e_id?, receipt_file_b64?, receipt_file_mime?, receipt_file_name? }` (`PNG`, `JPEG`, `WEBP`, `PDF` até `3 MB`) | Valida *magic bytes* reais (`parseReceiptAttachment`), executa `analyzeReceiptSubmission` (`SHA-256`, anti-duplicidade `is_duplicate`, padrão BACEN E2E `E`+31 chars e pistas de valor/recebedora), grava privado em `data/superbad-receipts/`, aciona `notifyOwnerWhatsApp` e **jamais auto-aprova**: retorna `status: "receipt_submitted"`, `auto_approved: false`, `awaiting_owner_activation: true`, `sla_minutes: 60` e `whatsapp_immediate_url`. |
| `GET /api/superbad/orders/:orderId` | `?order_secret=...` ou `x-order-secret` | Query/Header `order_secret` | Retorna status público (`pending_pix`, `receipt_submitted`, `approved`, `delivered`), `receipt_analysis`, `has_receipt_file` e descriptografa `license_key` **somente** quando `status` é `"approved"` ou `"delivered"`. |
| `GET /api/superbad/admin/orders/:orderId/receipt` | `requireAdminOrOwnerProof` | `?disposition=inline` opcional | Serve o arquivo privado do comprovante para inspeção no `Dashboard Control` com `X-Content-Type-Options: nosniff` e `Content-Security-Policy: ... sandbox`. |
| `POST /api/superbad/admin/orders/:orderId/deliver-key` (e `/admin/licenses/register`) | `requireAdminOrOwnerProof` | `{ license_key \| raw_license_key, edition?, buyer_email?, email_delivery_override? }` | Cifra a chave Ed25519 assinada offline pelo `Dashboard Control` (`AES-256-GCM`), marca `status: "delivered"` e dispara `sendActivationEmail` (zero-dependência via `node:tls` SMTPS 465 Gmail / Resend / Brevo) com saudação Google, chave e link `?test_key=<CHAVE>#validador` (URLs com chave são redigidas antes de gravar no disco). |
| `GET/POST /api/superbad/admin/key-pool(/stock)` e `POST /api/superbad/webhooks/pix` | Admin/Owner Proof (`key-pool`) e `PIX_WEBHOOK_SECRET` via `timingSafeEqual` (`webhooks/pix`) | Lote `{ edition, keys[] }` ou payload PIX `{ e2e_id, amount_centavos? }` | Estoque opcional cifrado `AES-256-GCM` em repouso (`encryptLicenseKeyAtRest`) e conciliação de webhook PIX. |
| `POST /api/v1/licenses/verify` | Público (`256 KB`) | `{ key, hwid, email?, hostname?, version? }` | Verifica assinatura Ed25519 (`OI6-INF`, `OI6-PRO`, `BC5-*`) ou chave registrada, revogação, expiração, `max_hwids` e `includesOpenInfinite`. |
| `POST /api/v1/telemetry/heartbeat` e `GET /api/openinfinite/public-stats` | Público (CORS `*`, cache `10s` em `public-stats`) | Heartbeat: `{ tokens_total?, cache_tokens?, requests?, profile? }` | Contabiliza telemetria sanitizada por perfil e expõe agregados **100% anônimos** e economia em R$ (`R$ 52,20/1M`), com zero vazamento de chaves, prefixos, e-mails, HWIDs, hostnames ou IPs. |

### Clientes Nativos, Ubuntu Linux VPS e Hermes Agent

- **Ubuntu Linux VPS (`OpenInfiniteLinux/`, `.NET 9` `linux-x64`)**: `/downloads/OpenInfinite-Client-Ubuntu-VPS.tar.gz` (`30,79 MB`, single-file comprimido + `Microsoft.Data.Sqlite 9.0.0`, `install-ubuntu-vps.sh` Ubuntu 22.04/24.04 sem `root`, unit `systemd --user` opcional desativada por padrão, HWID `/etc/machine-id`, Painel `127.0.0.1:4115`, Motor `127.0.0.1:4114/v1`, rejeição estrita de `OI6-INF`).
- **Nous Research Hermes Agent (CLI + Harness)**: governado por `HasProOrHigher()` — liberado apenas em **Pro Multi-OS** (`OI6-PRO`, `R$ 159,00`), **SuperBad / Cockpit Pro Nível 3** (`BC5-MID`), **Fundador VIP** (`BC5-FND`) e `editor` (bloqueado na Demo 1h e em `OI6-INF` `R$ 99,00`), gerando `infinite-hermes` / `infinite-hermes.cmd` (`127.0.0.1:4114/v1`) e `~/.hermes/openinfinite-endpoint.json` (`supportedHarnesses: ["opencode", "hermes"]`, `autoStartDaemon: false`), **sem jamais auto-iniciar processos/daemons do Hermes**.

### Ativos Estáticos Locais (`assets/`)

- [`./assets/openinfinite_silver.png`](./assets/openinfinite_silver.png), [`./assets/openinfinite_tema_escuro.png`](./assets/openinfinite_tema_escuro.png), [`./assets/openinfinite_liquid_glass.png`](./assets/openinfinite_liquid_glass.png), [`./assets/openinfinite_estatisticas.png`](./assets/openinfinite_estatisticas.png), [`./assets/openinfinite_tema_claro.png`](./assets/openinfinite_tema_claro.png).

## Invariants

- **Regra de Ouro de Ativação Humana**: Nenhum envio de comprovante em `POST /api/superbad/orders/:orderId/receipt` libera chave automaticamente (`auto_approved` é sempre `false` e `status` permanece `"receipt_submitted"`). A chave Ed25519 só é assinada e ativada pelo proprietário no `Dashboard Control` local (`master-license-private.pem` 100% offline), disparando o e-mail de ativação (`?test_key=<CHAVE>#validador`, SLA de até 1h ou imediato via WhatsApp) e liberando `#deliveredKeyBox` na página.
- **Planos Comerciais & Elegibilidade (`[../badclaude-superbad-api.js:EDITION_PLANS]`)**:
  - `infinite` (*Windows*): `R$ 99,00` (`OI6-INF`, `30 dias`, `max_hwids: 1`, Windows-only, sem Hermes).
  - `infinite_pro` (*Pro Multi-OS*): `R$ 159,00` (`OI6-PRO`, `30 dias`, `max_hwids: 2`, Windows + macOS + Ubuntu VPS + Hermes Agent CLI/Harness).
  - **Demo 1h & `BC5` Nível 3+**: Demo gratuita de 1h nos 3 instaladores; `BC5` 3º nível+ (`superbad` / **Cockpit Pro** e `founder` / **Fundador VIP**) tem `includesOpenInfinite: true` (`BC5` Nível 1/2 retorna `false`).
- **Privacidade, Criptografia em Repouso & Higiene WCAG AA**:
  - Zero chaves em texto puro em `data/superbad-orders.json` (`AES-256-GCM` via HKDF-SHA256 + redação de `?test_key=` nos metadados de e-mail); `data/superbad-receipts/` privado; zero PII em `GET /api/openinfinite/public-stats`.
  - Zero `alert()`, zero `\uF8FF`, `#livingCore` 3D ativo mesmo sob `prefers-reduced-motion`, zero menção a `4114`, `demo_lock` ou `shift_i.png` no HTML público.

## Side Effects

- **Cliente Navegador (`./index.html`)**: chamadas a `/api/auth/{config,session,google,logout}`, `/api/superbad/my-orders`, `/api/openinfinite/public-stats`, `/api/superbad/orders`, `/api/superbad/orders/:orderId/receipt` (base64 até 3 MB), polling `/api/superbad/orders/:orderId?order_secret=...` e `/api/v1/licenses/verify`; estado local do pedido (`saveActiveOrder`), clipboard (`copyTextSafely`) e downloads `.exe`/`.dmg`/`.tar.gz`.
- **Servidor (`../badclaude-superbad-api.js`)**: escrita atômica serializada em `data/superbad-orders.json`, armazenamento privado de comprovantes verificados por *magic bytes* em `data/superbad-receipts/`, notificação WhatsApp ao proprietário (`notifyOwnerWhatsApp`) e envio de e-mail transacional TLS (`sendActivationEmail`).

## Verification

- Run (a partir de `C:\Users\junio\catalogo-cruzeiro`):
  ```bash
  node --test scripts/__tests__/openinfinite-subsite.test.js scripts/__tests__/openinfinite-automation.test.js scripts/__tests__/superbad-sales.test.js
  ```
