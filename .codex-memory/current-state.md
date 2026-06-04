# Current State

Updated: 2026-06-04T20:26:40.000Z

## Active Goal

- IA local Ollama ligada ao Render

## Summary

Render publicou `f6d85d2a` (`feat(ai): connect Render to local Ollama`) e os endpoints publicos de IA estao usando Ollama local via tunnel Cloudflare protegido por token. Validacao publica: `/api/rayl/chat`, `/api/office-ai/chat` e `/api/cheffe-call/ai` retornaram `ai.status=online`, `provider=ollama`, `model=qwen2.5:3b`.

## Next

- Manter o PC e o processo `scripts/ollama-render-tunnel.js --deploy` ligados enquanto o Render precisar da IA local.
- No proximo login do Windows, o inicializador em `Startup/czs-ollama-render-tunnel.vbs` deve relancar o tunnel, atualizar `OLLAMA_BASE_URL` no Render e disparar deploy.
