# Backend • Catálogo Cruzeiro do Sul

API para assinaturas, comentários, analytics, votação e agregador de notícias.

## Rodar local

```bash
cd backend
npm install
npm run dev
```

Servidor padrão: `http://localhost:8787`

Dashboard admin: `http://localhost:8787/admin/admin-dashboard.html`

## Storage compartilhado opcional

O backend agora suporta dois modos:

- `file` -> padrão local, continua usando `backend/data/*.json`
- `supabase` -> ativa automaticamente quando `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão definidos

Para criar a tabela-base do storage compartilhado, rode o SQL em `backend/supabase/app_kv_store.sql`.

Variáveis relevantes:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORE_TABLE` (opcional, padrão `app_kv_store`)
- `NEWS_REFRESH_ENABLED` -> no serviço web, deixe `false` quando houver worker dedicado atualizando notícias

## Segurança admin

O painel administrativo aceita login HTTP Basic:

- Usuário: `admin`
- Senha: `99831455a`

Também é possível definir `ADMIN_TOKEN` no ambiente para acesso por token em integrações:

- `/admin/*`
- `/api/admin/*`

Com token ativo, abra dashboard com:

`http://localhost:8787/admin/admin-dashboard.html?token=SEU_TOKEN`

Para trocar o super admin sem editar código, defina `SUPER_ADMIN_USER` e `SUPER_ADMIN_PASSWORD` no ambiente.

Observação: a página HTML do dashboard pode abrir para mostrar o formulário de login, mas as rotas de dados em `/api/admin/*` continuam protegidas por senha ou token.

## Endpoints principais

- `POST /api/subscriptions` → recebe assinaturas
- `POST /api/comments` e `GET /api/comments/:articleId` → comentários por matéria
- `POST /api/analytics/visit` e `POST /api/analytics/heartbeat` → métricas de acesso e tempo
- `POST /api/votes` e `GET /api/votes/summary` → votos/simulações
- `POST /api/ninjas/requests`, `POST /api/ninjas/profiles`, `GET /api/ninjas/pix` → pedidos, currículos, créditos e Pix do Ninjas
- `POST /api/sales/listings` e `GET /api/sales/listings` → página filha de vendas por tipo
- `GET /api/admin/dashboard` → resumo de painel admin
- `GET /api/admin/reports/access.csv` e `GET /api/admin/reports/votes.csv`
- `GET /api/news/aggregator` → cache do agregador
- `POST /api/news/refresh` → atualização manual dos feeds
- `GET /api/elections/acre` → lógica de ciclo eleitoral + Acre

## Atualização automática do agregador

Ao iniciar o servidor:

- executa coleta imediata de RSS
- repete a atualização a cada 30 minutos (`setInterval`)

Em produção com worker separado, desative a coleta automática no web para evitar corrida de escrita sobre o mesmo cache.

## Nota legal (LGPD)

Ao colocar em produção:

- mantenha política de privacidade/cookies visível e atualizada
- colete consentimento explícito para rastreamento não essencial
- disponibilize canal para exclusão de dados (LGPD)
- registre base legal do tratamento e prazo de retenção
