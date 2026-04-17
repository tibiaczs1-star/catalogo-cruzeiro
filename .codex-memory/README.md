# Codex Memory System

Memoria local persistente do projeto para ordens do usuario, referencias de fotos/textos,
estado atual e handoff entre sessoes.

## Objetivo

Evitar perder contexto quando:

- os creditos acabarem;
- a conversa reiniciar;
- a conta mudar;
- outra sessao do Codex assumir o mesmo workspace.

## Arquivos principais

- `current-state.md`: foco atual, contexto vivo e proximos passos.
- `handoff.md`: resumo curto para retomada rapida por outra sessao.
- `orders.json`: historico estruturado das ordens do usuario.
- `assets.json`: referencias locais para fotos, capturas, anexos e textos relevantes.

## Regras de uso

1. Ler este diretorio junto com `CODEX_MEMORY.md` antes de continuar um trabalho em andamento.
2. Registrar cada nova ordem relevante do usuario em `orders.json`.
3. Vincular imagens, capturas, pastas recuperadas e arquivos importantes em `assets.json`.
4. Atualizar `current-state.md` e `handoff.md` ao final de mudancas grandes, validacoes visuais ou pausas de sessao.
5. Preferir guardar caminhos locais e referencias concretas, nao lembrancas vagas.

## Comandos

```bash
node scripts/codex-memory.js ensure
node scripts/codex-memory.js status
node scripts/codex-memory.js add-order --raw "texto bruto" --summary "resumo curto"
node scripts/codex-memory.js add-asset --path ".codex-temp/alguma-captura.png" --kind image --note "captura de validacao"
node scripts/codex-memory.js set-state --title "objetivo atual" --summary "contexto curto" --next "proximo passo"
node scripts/codex-memory.js set-handoff --summary "o que foi feito" --next "o que falta"
```

## Fontes locais de memoria visual ja conhecidas

- `recovered-chat-assets/`
- `recovered-vscode-chat-assets/`
- `.codex-temp/session-recovery-review/`
- `.codex-temp/focus-review/`

## Limite real

Esta memoria e local ao workspace. Ela persiste neste projeto e nesta maquina, mas nao altera
a memoria interna da plataforma fora deste repositorio.
