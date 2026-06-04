# Handoff

Updated: 2026-06-04T20:26:40.000Z

IA local CZS/Render: backend agora e local-first com Ollama e fallback OpenAI desligado por padrao. Render publicou commit `f6d85d2a` e os endpoints publicos de Rayl, escritorios e Cheffe Call responderam via Ollama local (`qwen2.5:3b`) atraves de Cloudflare quick tunnel protegido por bearer token.

## Next

- Processo atual ativo: `node scripts/ollama-render-tunnel.js --deploy`, proxy em `127.0.0.1:11435` e cloudflared apontando para o proxy.
- Estado/logs: `.codex-temp/ollama-render-tunnel/latest.json`, `live.stdout.log`, `live.stderr.log`.
- Se o PC reiniciar, o inicializador em `C:\Users\junio\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\czs-ollama-render-tunnel.vbs` relanca o fluxo e atualiza o Render com a nova URL do tunnel.
