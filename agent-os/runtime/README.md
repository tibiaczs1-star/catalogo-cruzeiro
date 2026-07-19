# Agent OS Runtime

## Arquivos

- `runtime/agent-os-runtime.js` — motor principal do Agent OS
- `runtime/llm-client.js` — cliente LLM para Fable 5.0
- `runtime/supervisor-renderer.js` — payload do supervisor
- `supervisor/agent-os-supervisor.html` — painel de comando
- `supervisor/agent-os-supervisor.js` — frontend do painel

## Como executar

```bash
# Ciclo completo (todos os agentes)
node agent-os/runtime/agent-os-runtime.js --cycle full

# Apenas uma equipe
node agent-os/runtime/agent-os-runtime.js --team editorial

# Apenas um agente
node agent-os/runtime/agent-os-runtime.js --agent esp-instagram

# Gerar relatório semanal
node agent-os/runtime/agent-os-runtime.js --report weekly

# Modo watch (ciclo contínuo a cada 5min)
node agent-os/runtime/agent-os-runtime.js --watch
```

## Variáveis de ambiente

```
LLM_API_URL=http://localhost:11434/v1/chat/completions
LLM_MODEL=:3b
LLM_TIMEOUT_MS=90000
CZS_BASE_URL=http://localhost:3000
AGENT_OS_CYCLE_INTERVAL_MS=300000
```
