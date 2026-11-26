# Infinite Zone — OpenInfinite v6.2 & InfiniteClaude v6.2 (`/openinfinite/`)

## Overview

Subsistema web oficial da **Infinite Zone · Laboratórios de Tecnologia** para os dois softwares 100% nativos (zero HTML / zero WebView — **WinForms GDI+** no Windows, **SwiftUI Liquid Glass** no macOS Apple Silicon e **TUI ANSI + Daemon** `.NET 9 self-contained` no Ubuntu Linux VPS):
- **OpenInfinite v6.2** (`OI6-INF` `R$ 99,00` Windows / `OI6-PRO` `R$ 159,00` Pro Multi-OS): **Motor Headless OpenCode Swap** em segundo plano ("Só Clicar e Usar", sem abrir GUI do OpenCode e sem expor IPs, túneis ou upstreams), auto-teste contínuo nos 4 perfis white-label `infinite/*` (`infinite/auto`, `infinite/coder`, `infinite/fast`, `infinite/reasoning`, `owned_by: "infinite-zone"`), zero falso positivo (status Verde somente após resposta HTTP 200 real com latência medida) e integração oficial **Nous Research Hermes Agent** no Pro.
- **InfiniteClaude v6.2** (`IC6-PRO` `R$ 199,00` Multi-OS até 3 máquinas / `IC6-MAX` `R$ 249,00` Multi-CLI Total até 5 máquinas): mesmo Motor Headless OpenCode Swap somado a tradutor Anthropic (`POST /v1/messages` com `system`, `tools`, `tool_use`, `tool_result` e streaming SSE), injeção direta em 1 clique no **Claude Code** (`~/.claude/settings.json` preenchido diretamente com `infinite/coder`, `infinite/reasoning` e `infinite/fast` — com backup e restauração), **Hermes Agent** (`~/.hermes/config.yaml`, sem iniciar daemon) e, no nível `IC6-MAX` / BadClaude 3º nível+, **Escada Multi-CLI Total** auto-detectando e injetando em **OpenCode, Claude Code, Hermes Agent, Local Harness e Codex CLI**.

Servido em `/openinfinite/` por [`../server.js`](../server.js) e integrado ao motor de autenticação Google, checkout PIX em 4 passos supervisionado pelo proprietário, disparo de e-mail transacional e licenciamento Ed25519 em [`../badclaude-superbad-api.js`](../badclaude-superbad-api.js).

## Interface

### Linguagem Visual Infinite Zone (`./index.html`)

- **Identidade Oficial**: fundo Preto Carbono (`#070709`), cards Carbono Fosco (`#0d0e13`) com filete prismático espectral fino (`#00B4FF -> #5B2EFF -> #FF00B8 -> #FF7A00 -> #19FF00`), botões Branco Puro (`.btn.ivory`) e Prata Escovada (`.btn.silver`), símbolos vetoriais SVG inline `#izHoodMark` (capuz geométrico branco + `∞` neon prismático) e `#izClaudeMark` (anel espectral + capuz), assinatura **`INFINITE ZONE · LABORATÓRIOS DE TECNOLOGIA`** e conformidade WCAG 2.1 AA.
- **Seções e Símbolos DOM**:
  - **Acessibilidade, Navegação e Modais**: `.skip-link` (`#conteudo`), `#topbar`, `#topHelpBtn`, `#topo`, `#hoverHudBtn`, `#hoverBarHint`, `.help-q`, `#shiftIModal`, `#zoomModal`.
  - **Hero 3D & Simulador (`#painel-live`)**: `#livingStage`, `#particleCanvas`, `#cursorAura`, `#livingCore`, `#badge1`..`#badge3`, WAI-ARIA tabs `#cockpitTabs` (`#tab-shot-0`..`#tab-shot-3` + `#cockpitPanel`, `#featImg`, `#featTitle`, `#featDesc`), `#simEngineBtn`, `.lang-chip[data-lang="python"|"ts"|"go"|"rust"]`, `#langStatus`.
  - **Vitrine Nativa (`#softwares-nativos`) & Matriz de Instalação (`#instalacao-rapida`)**: cards comparativos `OpenInfinite v6.2` (`OI6-INF`/`OI6-PRO`) e `InfiniteClaude v6.2` (`IC6-PRO`/`IC6-MAX`), 6 botões de download direto e 4 blocos copiáveis de instalação em 1 comando (`#cmdWinPs1`, `#cmdMacSh`, `#cmdUbuntuOi`, `#cmdUbuntuIc` via `[data-copy-cmd]`).
  - **Economia (`#economia-tokens`), Telemetria Anônima (`#consumo-ao-vivo`) & Linux/Hermes (`#ubuntu-hermes`)**: calculadora 1M..3B tokens (`#tokenPresets`, `#calcMeteredBrl`, `#calcWinSaveBadge`, `#calcProSaveBadge`, `#calcClaudeSaveBadge`), painel `/api/openinfinite/public-stats` (`#liveProfilesGrid`), `#ubuntuInstallCmd`, `#copyUbuntuCmdBtn` e matriz da Escada Multi-CLI de 3 Degraus.
  - **Planos & Comparador (`#planos`, `#comparador`)**: abas `#comp-tab-demo`, `#comp-tab-win`, `#comp-tab-mac`, `#comp-tab-claude` (`data-comp="infinite_claude"`), `#comp-tab-max` (`data-comp="infinite_max"`) e 4 cartões mensais (`R$ 99,00`, `R$ 159,00`, `R$ 199,00`, `R$ 249,00`).
  - **Checkout PIX em 4 Passos (`#checkout`) & Validador (`#validador` / `#licenca`)**: `#step1Google` (`[data-google-auth-card]`, `#googleAuthBtnHost`, `#googleConnectedBox`, `#myOrdersRestoreNote`) -> `#step2Pix` (`#orderForm`, `#ordPlan` com `infinite_max`, `infinite_claude`, `infinite_pro`, `infinite`) -> `#step3Receipt` (`#receiptForm`, `#receiptFileInput`, `#receiptE2eInput`) -> `#step4Analysis` (`#analysisTargetEmail`, `#btnWhatsOrder`, `#slaOneHourNotice`) + `#deliveredKeyBox` -> `#validador` (`#verifyKeyInput` + `?test_key=...` aceitando `IC6-MAX-...`, `IC6-PRO-...`, `OI6-PRO-...`, `OI6-INF-...` e `BC5-...`).

### Rotas HTTP, Scripts 1-Prompt e Downloads (`../server.js`)

- `[../server.js:pathname === "/openinfinite"]` e `[../server.js:pathname.startsWith("/openinfinite/")]` — Redirecionamento `302` e entrega estática segura com guarda `oiRoot` para [`./index.html`](./index.html).
- **4 Rotas Instaladoras 1-Comando (`text/plain; charset=utf-8`, `X-Content-Type-Options: nosniff`, com bootstrap silencioso do runtime `opencode` quando ausente, zero GUI aberta)**:
  - `GET /install-openinfinite.sh` -> `curl -fsSL https://catalogo-cruzeiro-web.onrender.com/install-openinfinite.sh | bash` (garante `opencode` headless, baixa e instala `/downloads/OpenInfinite-Client-Ubuntu-VPS.tar.gz`).
  - `GET /install-infiniteclaude.sh` -> `curl -fsSL https://catalogo-cruzeiro-web.onrender.com/install-infiniteclaude.sh | bash` (garante `opencode` headless, baixa e instala `/downloads/InfiniteClaude-Client-Ubuntu-VPS.tar.gz`).
  - `GET /install-mac.sh` -> `curl -fsSL https://catalogo-cruzeiro-web.onrender.com/install-mac.sh | bash` (garante `opencode` headless, monta via `hdiutil` `/downloads/OpenInfinite-Client-macOS.dmg` e `/downloads/InfiniteClaude-Client-macOS.dmg` em `/Applications`).
  - `GET /install-win.ps1` -> `irm https://catalogo-cruzeiro-web.onrender.com/install-win.ps1 | iex` (garante `opencode` headless silenciosamente se faltar, baixa e executa `/downloads/OpenInfinite-Client-Setup.exe` e `/downloads/InfiniteClaude-Client-Setup.exe`).
- **6 Pacotes Nativos em `/downloads/`**:
  - Windows: `/downloads/OpenInfinite-Client-Setup.exe`, `/downloads/InfiniteClaude-Client-Setup.exe`
  - macOS: `/downloads/OpenInfinite-Client-macOS.dmg`, `/downloads/InfiniteClaude-Client-macOS.dmg`
  - Ubuntu VPS (`Content-Type: application/gzip`): `/downloads/OpenInfinite-Client-Ubuntu-VPS.tar.gz`, `/downloads/InfiniteClaude-Client-Ubuntu-VPS.tar.gz`
- **Sessão Google (`../site-google-auth.js`)**: `GET /api/auth/config`, `GET /api/auth/session`, `POST /api/auth/google`, `POST /api/auth/logout`.

### Fronteiras de API (`../badclaude-superbad-api.js`)

| Método & Rota | Autenticação / Limite | Contrato de Entrada | Contrato de Saída / Comportamento |
| :--- | :--- | :--- | :--- |
| `POST /api/superbad/orders` | Sessão Google quando `isGoogleAuthEnabled()` ativo (`401 GOOGLE_AUTH_REQUIRED`) | `{ buyer_name, buyer_contact, requested_edition: "infinite" \| "infinite_pro" \| "infinite_claude" \| "infinite_max" }` | Cria pedido `pending_pix` (`R$ 99,00`, `R$ 159,00`, `R$ 199,00` ou `R$ 249,00`) com BR Code EMV e QR Code Data URL. |
| `POST /api/superbad/orders/:orderId/receipt` | `order_secret` / `x-order-secret` (`4 MB` JSON; anexo até `3 MB`) | `{ order_secret, receipt_note?, e2e_id?, receipt_file_b64?, receipt_file_mime? }` | Valida *magic bytes* (`PNG`, `JPEG`, `WEBP`, `PDF`), anti-duplicidade `SHA-256`, padrão BACEN E2E, alerta `notifyOwnerWhatsApp` e mantém `status: "receipt_submitted"` (`auto_approved: false`). |
| `GET /api/superbad/orders/:orderId` e `GET /api/superbad/my-orders` | `order_secret` ou Sessão Google | Query/Header `order_secret` ou cookie Google | Descriptografa `license_key` (`OI6-*`, `IC6-PRO-*` ou `IC6-MAX-*`) **somente** quando `status` é `"approved"` ou `"delivered"`. |
| `POST /api/superbad/admin/orders/:orderId/deliver-key` e `GET/POST /api/superbad/admin/key-pool(/stock)` | `requireAdminOrOwnerProof` | Lote/chave Ed25519 (`OI6-INF`, `OI6-PRO`, `IC6-PRO`, `IC6-MAX`, `BC5-*`) | Estoque e entrega cifrados com `AES-256-GCM` em repouso + disparo `sendActivationEmail` com link `?test_key=<CHAVE>#validador` (redigido em disco). |
| `POST /api/v1/licenses/verify` | Público (`256 KB`) | `{ key, hwid, email?, hostname?, version? }` | Valida assinatura Ed25519 (`IC6-MAX`, `IC6-PRO`, `OI6-PRO`, `OI6-INF`, `BC5-*`), `max_hwids`, `includesOpenInfinite` e `includesInfiniteClaude`. |
| `POST /api/v1/telemetry/heartbeat` e `GET /api/openinfinite/public-stats` | Público (CORS `*`, cache `10s`) | Heartbeat anônimo por perfil (`demo`, `infinito`, `pro`, `infinite_claude`, `infinite_max`, `superbad`, `founder`) | Agregados 100% anônimos e economia em R$ vs API tarifada (`R$ 52,20/1M`), zero PII/chaves/IPs. |

### Ativos Estáticos Locais (`assets/`)

- [`./assets/openinfinite_silver.png`](./assets/openinfinite_silver.png), [`./assets/openinfinite_tema_escuro.png`](./assets/openinfinite_tema_escuro.png), [`./assets/openinfinite_liquid_glass.png`](./assets/openinfinite_liquid_glass.png), [`./assets/openinfinite_estatisticas.png`](./assets/openinfinite_estatisticas.png), [`./assets/openinfinite_tema_claro.png`](./assets/openinfinite_tema_claro.png).

## Invariants

- **Regra de Ouro de Ativação Humana**: Nenhum envio de comprovante libera chave sozinho (`auto_approved: false`). A ativação ocorre exclusivamente via `Dashboard Control` (com suporte nativo a geração, estoque no pool e entrega de `IC6-PRO` / `IC6-MAX`), enviando e-mail com `?test_key=<CHAVE>#validador`.
- **Planos Comerciais (`EDITION_PLANS`) & Escada Multi-CLI**:
  - `infinite`: `R$ 99,00` (`OI6-INF`, `30d`, `max_hwids: 1`, Windows, OpenCode).
  - `infinite_pro`: `R$ 159,00` (`OI6-PRO`, `30d`, `max_hwids: 2`, Win + Mac + Ubuntu + OpenCode + Hermes).
  - `infinite_claude`: `R$ 199,00` (`IC6-PRO`, `30d`, `max_hwids: 3`, Win + Mac + Ubuntu + Claude Code `~/.claude/settings.json` em `infinite/coder`/`reasoning`/`fast` + OpenCode + Hermes Pro+, `includesInfiniteClaude: true`).
  - `infinite_max`: `R$ 249,00` (`IC6-MAX`, `30d`, `max_hwids: 5`, Win + Mac + Ubuntu + Escada Multi-CLI total auto-detectando OpenCode, Claude Code, Hermes Agent `~/.hermes/config.yaml` sem iniciar daemon, Local Harness e Codex CLI, `includesInfiniteClaude: true`).
  - `superbad` (3º nível) e `founder` (VIP): `includesOpenInfinite: true` e `includesInfiniteClaude: true`.
- **Segurança & Higiene**: zero chaves em texto puro no disco (`AES-256-GCM`), zero PII em `public-stats`, zero `alert()`, zero `\uF8FF`, zero modelo externo simulado e zero exposição da porta local no HTML público.

## Verification

```bash
node --test scripts/__tests__/openinfinite-subsite.test.js scripts/__tests__/openinfinite-automation.test.js scripts/__tests__/superbad-sales.test.js
```
