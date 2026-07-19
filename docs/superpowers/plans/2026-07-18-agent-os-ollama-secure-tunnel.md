# Agent OS Ollama Secure Tunnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manter o Agent OS no Render conectado com segurança ao Ollama local `llama3.2:3b`, com recuperação automática de URLs temporárias.

**Architecture:** Um proxy Node autenticado traduz somente as rotas OpenAI/Ollama necessárias e permanece em loopback. Um supervisor inicia proxy e Cloudflare Quick Tunnel, sincroniza a URL e o token no Render, dispara deploy e reinicia o conjunto quando um filho cai; uma tarefa do Windows inicia o supervisor no logon.

**Tech Stack:** Node.js 18+, `node:test`, Ollama, cloudflared, Render REST API, PowerShell Scheduled Tasks.

---

### Task 1: Cliente LLM autenticado

**Files:**
- Create: `agent-os/runtime/__tests__/llm-client.test.js`
- Modify: `agent-os/runtime/llm-client.js`

- [ ] **Step 1: Write the failing test**

Criar servidor HTTP efêmero que exija `Authorization: Bearer test-token`, registre método e rota, responda `GET /api/tags` e `POST /v1/chat/completions`, e afirmar que `healthCheck()` e `chat()` usam essas rotas e o token.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test agent-os/runtime/__tests__/llm-client.test.js`
Expected: FAIL porque o cliente atual usa `/v1/api/tags` e não envia Bearer.

- [ ] **Step 3: Write minimal implementation**

Adicionar `AGENT_OS_LLM_URL` à precedência, modelo `AGENT_OS_LLM_MODEL`, token de `OLLAMA_AUTH_TOKEN`, método HTTP configurável e derivação de origem com `new URL("/api/tags", this.baseUrl)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test agent-os/runtime/__tests__/llm-client.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add agent-os/runtime && git commit -m "fix: authenticate Agent OS Ollama client"`

### Task 2: Proxy seguro compatível

**Files:**
- Create: `scripts/__tests__/ollama-secure-proxy.test.js`
- Modify: `scripts/ollama-secure-proxy.js`

- [ ] **Step 1: Write the failing test**

Iniciar upstream e proxy em portas efêmeras; afirmar `401` sem token, sucesso autenticado em `GET /api/tags` e `POST /v1/chat/completions`, `404` para demais rotas e ausência do token na resposta.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/__tests__/ollama-secure-proxy.test.js`
Expected: FAIL porque as novas rotas ainda retornam 404.

- [ ] **Step 3: Write minimal implementation**

Exportar `createProxyServer(options)`, proteger as duas rotas com comparação constante, encaminhar método/corpo para o Ollama, manter `/health` sem detalhes e limitar payload a 160000 bytes.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/__tests__/ollama-secure-proxy.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add scripts/ollama-secure-proxy.js scripts/__tests__/ollama-secure-proxy.test.js && git commit -m "feat: expose authenticated Ollama API bridge"`

### Task 3: Supervisor e persistência

**Files:**
- Modify: `scripts/ollama-render-tunnel.js`
- Modify: `scripts/start-ollama-render-tunnel.ps1`
- Modify: `scripts/install-ollama-render-tunnel-task.ps1`
- Modify: `package.json`

- [ ] **Step 1: Add deterministic validation helpers**

Validar Ollama e `llama3.2:3b` antes do túnel; sincronizar `AGENT_OS_LLM_URL`, `LLM_API_URL`, `OLLAMA_BASE_URL`, `OLLAMA_AUTH_TOKEN`, `AGENT_OS_LLM_MODEL`, `CZS_OLLAMA_MODEL` e timeouts.

- [ ] **Step 2: Implement restart loop**

Executar um ciclo por vez; quando proxy ou tunnel sair, limpar ambos, esperar 5 segundos e recriar URL/sincronização/deploy sem registrar segredos.

- [ ] **Step 3: Update Windows launchers**

Executar supervisor oculto e sem limite semanal; registrar tarefa `CZS Ollama Render Tunnel` no logon e manter fallback Startup somente se o registro falhar.

- [ ] **Step 4: Verify syntax and local behavior**

Run: `node --check scripts/ollama-render-tunnel.js && node --check scripts/ollama-secure-proxy.js`
Expected: exit 0.

- [ ] **Step 5: Commit**

Run: `git add scripts package.json && git commit -m "feat: keep Render Ollama tunnel synchronized"`

### Task 4: Integração real e deploy

**Files:**
- Runtime state only: `.env.local`, `.codex-temp/ollama-render-tunnel/latest.json`, Windows scheduled task.

- [ ] **Step 1: Run automated verification**

Run: `node --test agent-os/runtime/__tests__/llm-client.test.js scripts/__tests__/ollama-secure-proxy.test.js && npm test`
Expected: all tests pass, including the existing 130-test baseline.

- [ ] **Step 2: Install and start persistence**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-ollama-render-tunnel-task.ps1`, then start the task and verify its state/log without printing secrets.

- [ ] **Step 3: Verify tunnel authentication**

From `latest.json`, request `/api/tags` without token and expect 401; request with the local token and expect 200 with `llama3.2:3b` present.

- [ ] **Step 4: Push and confirm Render deployment**

Push the branch commit to `origin/main`, wait for the matching Render deploy to become live, then verify `/ashotelaria/app`, `/cheffe-call.html` and the Agent OS health/status endpoint.

- [ ] **Step 5: Prove no-fallback execution**

Trigger one permitted Agent OS cycle and verify its public result reports at least one `ok` LLM execution and no new `LLM indisponível` fallback for the sampled call.
