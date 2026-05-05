# Codex Health Protocol

Este protocolo existe para reduzir perda de contexto, erro de retomada e trabalho feito no alvo errado.
Ele nao altera o modelo interno do Codex nem garante que a plataforma nunca trave. O que ele faz e deixar
uma rotina local, verificavel e reutilizavel para qualquer sessao que assumir este workspace.

## Rotina de inicio

1. Rodar `npm run codex:health`.
2. Ler `AGENTS.md`, `CODEX_MEMORY.md`, `.codex-memory/README.md`, `current-state.md`, `handoff.md`,
   `orders.json`, `assets.json` e `credit-end-protocol.md`.
3. Conferir a ordem aberta mais recente antes de interpretar imagens, referencias visuais ou pedidos vagos.
4. Registrar a nova ordem do usuario em `orders.json` antes de editar arquivos.
5. Se o trabalho for sobre `PubPaid 2.0`, ler `PUBPAID_2_GLOBAL_HANDOFF.md` antes de qualquer mudanca.

## Rotina durante trabalho longo

1. Fazer atualizacoes curtas para o usuario quando a investigacao ou validacao passar de alguns minutos.
2. Manter o escopo pequeno e nao reverter arquivos que ja estavam alterados.
3. Antes de rodadas grandes de revisao visual, editorial ou funcional, usar `npm run review:team`.
4. Se aparecer erro de retomada, mismatch de caminho ou perda de fio, parar e reler `handoff.md`, `current-state.md`
   e as ultimas ordens em `orders.json`.
5. Se houver suspeita de problema com `\\?\C:\...`, conferir o registro de reparo em `CODEX_MEMORY.md` e o script
   `.codex-temp/codex-session-path-repair/repair-codex-session-paths.mjs`; nao repetir reparo global sem backup novo.

## Rotina de encerramento

1. Atualizar `CODEX_MEMORY.md` com um resumo curto quando houver mudanca grande, deploy, validacao importante ou pendencia.
2. Atualizar `.codex-memory/current-state.md` com objetivo ativo, resumo, proximos passos e arquivos em foco.
3. Atualizar `.codex-memory/handoff.md` com a retomada curta para a proxima sessao.
4. Marcar a ordem correspondente em `orders.json` como `completed-local`, `completed-online` ou deixar `open` com proximo passo claro.

## Limite real

Quando o Codex travar por problema da plataforma, servidor local do app ou cache vivo, este protocolo nao consegue
consertar a infraestrutura sozinho. Nesses casos, a rotina correta e preservar contexto nos arquivos locais,
validar o estado com `npm run codex:health` e retomar a partir da memoria local em vez de depender do chat antigo.
