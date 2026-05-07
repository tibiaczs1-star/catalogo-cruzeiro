# CODEX_MEMORY - memoria viva curta

Atualizado: 2026-05-07

## Foco vivo

Trabalhar somente em quatro frentes:

- PubPaid 1: fonte legada somente para pagamento, carteira, admin e dashboard (`pubpaid.html`, `pubpaid.css`, `pubpaid.js`, `pubpaid-admin.html`, `pubpaid-runtime.js`, `PUBPAID_1_SOURCE_ONLY.md`).
- PubPaid 2: `pubpaid-v2.html`, `pubpaid-phaser.css`, `pubpaid-phaser/`, `assets/pubpaid/`, `PUBPAID_2_GLOBAL_HANDOFF.md`, `PUBPAID_2_VISUAL_DIRECTION.md`.
- Jornal: `index.html`, `script.js`, `styles.css`, `server.js`, `news-data.js`, `data/`, `assets/news-fallbacks/`, paginas de noticia/arquivo/editorias e scripts de sync/review.
- Cheffe Call / agentes reais: `cheffe-call.*`, `real-agents.*`, `escritorio*.*`, `.codex-agents/`, `scripts/real-agents-runtime.js`, `scripts/news-image-approval-queue.js`.

Todo o resto e arquivo morto ou lixo potencial ate o usuario pedir explicitamente.

## PubPaid 1

PubPaid 1 esta descontinuado como produto. Nao desenvolver jogo, arte, UI publica ou runtime visual nele.

Usar apenas como fonte para:

- metodos de pagamento;
- carteira/saldo;
- depositos e saques manuais;
- dashboard/admin;
- padroes de revisao/aprovacao em `pubpaid-runtime.js`.

Antes de extrair algo, ler `PUBPAID_1_SOURCE_ONLY.md`.

## Estado atual

Limpeza grande concluida localmente.

- Commit `0a372fbc`: memoria/protocolo e arquivo morto removido.
- Commit `529d4b6c`: travas de aterramento em `npm run codex:health`.
- Commit `53271593`: Jornal, Cheffe Call, agentes, dados e fallbacks vivos.
- Commit `b355aceb`: checkpoint PubPaid 2 separado, com assets/scripts vivos e divida visual registrada.
- Worktree ficou limpa depois do commit de memoria final, salvo proxima ordem nova.

## Render

Render publico respondeu 200 em `https://catalogo-cruzeiro-web.onrender.com/` e `/api/news`.

Rodada administrativa online concluida em 2026-05-07:

- Render API autenticada encontrou `catalogo-cruzeiro-web`, service id `srv-d7heure7r5hc73br2aqg`.
- Deploy live: `dep-d7trp41oagis73ff8sn0`, commit `cca9821f2bf54715de3b50c438f8297deebc30a6`.
- `/api/admin/storage-health`: 200, storage em `/opt/render/project/src/render-data`, persistente esperado, write probe OK.
- Cheffe online: ecosystem-study 201, start 201, action safe-cleanup 200, complete 200.
- Safe-cleanup removeu 0 arquivo(s), 0 bytes: nao havia logs/smoke removiveis.
- `/api/real-agents/run`: 201, 181 agentes OK.
- Seguranca local: removidos defaults hardcoded que coincidiam com o token simples em `server.js`, `backend/server.js`, `.env.example`, `backend/.env.example` e `backend/README.md`.
- Varredura local por valores dos tokens: 0 arquivos com ADMIN_TOKEN/API key gravados.

Tokens foram colados no chat; nao repetir, nao salvar em arquivo e recomendar rotacao no Render.

## Validacoes

- `npm run codex:health`: OK antes da rodada.
- `npm run review:team`: OK, `totalIssues: 0`.
- `node --check` nos JS principais de Jornal/Cheffe/PubPaid: OK.
- `npm run pubpaid:visual-audit`: falhou por divida visual real no runtime PubPaid 2 (`graphics`, `fillRect`, gradientes/glow). Nao declarar PubPaid visualmente limpa ate corrigir.

## Anti-alucinacao

- Uma ordem ativa por vez. Se `npm run codex:health` mostrar nenhuma ordem ativa, nao continuar tarefa antiga por inercia.
- Antes de editar, declarar escopo e conferir grupos sujos da worktree.
- Usar `git add` com pathspec explicito; nunca `git add .` em worktree suja.
- Memoria local deve continuar curta. Registrar so ordens atuais, provas e assets realmente uteis.
- Nao usar arquivo morto como memoria operacional.

## Risk gates 10/10

`npm run codex:health` deve imprimir risk gates antes de trabalho real.

- Escopo: ordem ampla tipo "resolver tudo" bloqueia acao se nao tiver frente/arquivo/prova.
- Render/admin: pedido Render administrativo bloqueia sem token, CLI ou prova de rota autenticada.
- PubPaid visual: qualquer rodada visual exige `npm run pubpaid:visual-audit`; falha bloqueia declarar visual limpo.
- Branch ahead: commits locais adiantados exigem decisao de push/PR/merge antes de dizer que historico esta pronto.
- Worktree: sujeira ativa exige classificacao; nao misturar dados sujos com novo escopo.
- Se o sandbox bloquear `git` dentro do Node (`spawnSync git EPERM`), o health deve avisar e eu devo conferir `git status` pelo shell antes de afirmar limpeza.

## Proximo passo

Aguardar proxima ordem explicita do usuario.
