# AShotelaria P0 — relatório de validação

Data: 2026-07-14 · Fuso: America/Rio_Branco

## Resultado

O P0 está integrado ao servidor do Catálogo CZS e funciona em modo demo online. O painel e a reserva pública não usam service worker, armazenamento local, fila offline ou sincronização posterior.

## Evidências automatizadas

- `npm run ashotelaria:check`: passou (`server.js`, APIs e scripts de interface).
- `npm run ashotelaria:test`: 71 testes passaram, 0 falhas.
- `git diff --check`: passou.
- Revisão independente de Task 3: aprovado, 38 testes de store/migração/PostgreSQL.
- Revisão independente de Task 4: aprovado, 50 testes de lockout, idempotência, camareira e erros seguros.

Os testes cobrem os 14 papéis, isolamento tenant/propriedade, hash scrypt, lockout concorrente, sessão revogável, force-change, reserva idempotente, conflito de inventário, transações PostgreSQL roteirizadas, projeção da camareira e mascaramento de erros 5xx.

## Prova HTTP local

Com `ASHOTELARIA_DEMO_MODE=true`, servidor em porta local:

- `/ashotelaria/app`, `/czs-labs/ashotelaria`, `/hoteis` e `/reservar/hotel-jurua-palace`: `200`.
- `/api/ashotelaria/v1/health`: `200`.
- propriedade e disponibilidade públicas: `200`.
- login inicial: `200` com `forceChange: true` e sem token no JSON.
- operação antes da troca: `409 PASSWORD_CHANGE_REQUIRED`.
- troca de senha: `200`; sessão anterior revogada (`401`).
- primeira reserva com chave de idempotência: `201`; replay: `200`, mesmo ID.

## Segurança e limites

Senhas reais não estão no repositório. As credenciais iniciais são lidas somente do ambiente; temporárias curtas são aceitas apenas no provisionamento e exigem troca. Senhas novas e redefinidas exigem pelo menos oito caracteres. Produção não pode cair para memória: exige `ASHOTELARIA_DATABASE_URL` e `ASHOTELARIA_SESSION_SECRET`.

Pagamento, fiscal e FNRH permanecem em `sandbox`; a reserva confirma pagamento na hospedagem, sem captura financeira real.

## Portão de produção

O `render.yaml` declara o PostgreSQL `ashotelaria-db`, injeta a connection string interna e executa `npm run ashotelaria:migrate` antes de `npm start`. O banco foi criado no plano gratuito (expira em 2026-08-13); para continuidade, migre-o para um plano persistente antes dessa data. A migration real aplicou as duas versões (`{"ok":true,"applied":2}`) e os cinco segredos foram configurados no cofre do serviço.

Deploy Render confirmado: serviço `catalogo-cruzeiro-web`, deploy `dep-d9badc8qmsqc73885ppg`, commit `61e5bd89`, status `live`. Smoke test remoto confirmou `200` nos quatro aliases, health, propriedade pública e disponibilidade; login inicial respondeu `200` com `forceChange: true` e o bootstrap foi bloqueado com `409` antes da troca.
