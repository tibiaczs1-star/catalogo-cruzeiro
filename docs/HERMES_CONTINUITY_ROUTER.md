# Hermes Continuity Router

Updated: 2026-06-02

## Goal

Keep Hermes working across model/language switches by testing the live providers,
promoting MiniMax as the primary substitute when ChatGPT/Codex stops, using
MiniMax/Gemma/Nemotron to save Codex tokens, and warning when ChatGPT/Codex
needs reauthentication.

## Command

```powershell
npm run hermes:continuity
```

Fast local-only check:

```powershell
npm run hermes:continuity:fast
```

Continuous continuity check every 5 minutes:

```powershell
npm run hermes:continuity:watch
```

## Rule

- `openai-codex/gpt-5.5` remains the authority when healthy.
- If ChatGPT/Codex fails with auth symptoms, the router prints:
  `ALERTA: ChatGPT/Codex parou por autenticacao. Rode: hermes auth add openai-codex`
- If ChatGPT/Codex stops, MiniMax replaces it in this order:
  `minimax-m3:cloud` first, then `minimax-m2.7` fast.
- When ChatGPT/Codex is healthy, MiniMax can run delegated multitasks to save
  Codex tokens, but Codex still reviews and synthesizes final answers.
- Gemma and Nemotron are special support workers. Other healthy models are
  fallback lanes.
- The warm support set defaults to 4 slots: MiniMax M3, MiniMax 2.7, Gemma and
  Nemotron when all are healthy. Missing slots are filled by fallbacks.
- `qwen2.5-coder:3b` stays code-only and must not become normal chat authority.

## Outputs

- `.codex-temp/hermes-continuity/latest.json`
- `.codex-temp/hermes-continuity/latest.md`
- `C:\Users\junio\AppData\Local\hermes\state\hermes_continuity_router_latest.json`

## Current Candidate Lanes

- Primary authority: `openai-codex/gpt-5.5`
- Substitute and token-saving worker 1: `minimax-m3:cloud`
- Substitute and token-saving worker 2: `minimax-m2.7`
- PT-BR/review worker: `gemma3:4b`
- Rescue cloud support worker: `nvidia/llama-3.3-nemotron-super-49b-v1.5`
- Operational fallback worker: `llama3.2:3b`
- Code-only worker: `qwen2.5-coder:3b`
- Optional fallback cloud support when enabled: Gemini Flash Lite
