# Codex Health Protocol

Protocolo curto para retomada segura neste workspace.

## Inicio

1. Ler `CODEX_MEMORY.md`.
2. Ler `.codex-memory/current-state.md` e `.codex-memory/handoff.md`.
3. Rodar `npm run codex:health`.
4. Registrar ordem nova em `.codex-memory/orders.json` antes de editar arquivos.

## Durante

- Manter foco em PubPaid 1, PubPaid 2, Jornal e Cheffe Call / agentes reais.
- Trabalhar com uma ordem ativa por vez.
- Se `codex:health` mostrar nenhuma ordem ativa, nao continuar tarefas antigas por inercia.
- Em worktree suja, declarar escopo antes de editar e usar `git add` com pathspec explicito.
- Nao usar `git reset --hard` nem `git clean -fd` amplo.
- Nao apagar dados vivos, assets vivos ou provas atuais.
- Limpar temporarios claros ao final da rodada.

## Encerramento

Atualizar memoria curta somente com estado atual, validacao feita e proxima acao concreta.
