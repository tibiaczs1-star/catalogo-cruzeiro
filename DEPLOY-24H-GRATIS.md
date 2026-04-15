# Deploy 24h (baixo custo / grátis)

## Stack recomendada

1. **Backend + worker:** Render (web Free + worker Starter) ou Railway (Starter)
2. **Banco principal:** Supabase (Free Tier)
3. **Frontend estático (se separar):** Cloudflare Pages / Vercel

## Objetivo

- Site no ar 24h
- Agregador atualizando notícias a cada 30 minutos
- Coleta diária de empreendimentos de Cruzeiro do Sul
- Dados append-only (só adiciona, não apaga histórico)

## Processo rápido

1. Subir projeto no GitHub
2. Na Render, criar via Blueprint apontando para `render.yaml` na raiz.
3. Confirmar os dois serviços:
   - `catalogo-cruzeiro-web` -> `backend/server.js`
   - `catalogo-cruzeiro-worker` -> `backend/workers/catalogo-autoupdate-worker.js`
3. Definir variáveis de ambiente:
   - `NODE_ENV=production`
   - `ADMIN_TOKEN=<token-forte-gerado-por-voce>`
   - `PORT` (apenas no web)
   - `NEWS_REFRESH_ENABLED=false` no web quando o worker estiver ativo
   - `SUPABASE_URL=<url-do-projeto>`
   - `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
4. Rodar o SQL de `backend/supabase/app_kv_store.sql` no Supabase
5. Garantir volume persistente para `backend/data/` apenas se você optar por nao usar Supabase

## PM2 (quando usar VPS)

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## Garantia de não perder dados

- `news-archive.json` usa deduplicação por id/url/título
- `businesses-cruzeiro.json` atualiza por id e preserva histórico
- Estrutura append-only por padrão
- Em host gratuito com disco efêmero, usar Supabase é o caminho mais seguro para web + worker compartilharem o mesmo cache.

## Próximo passo recomendado

- Evoluir do storage JSON compartilhado para tabelas Supabase normalizadas:
  - `news_items`
  - `business_directory`
- `comments`
- `subscriptions`
- `votes`
- `analytics_events`
- `ninjas_requests`
- `ninjas_profiles`
- `sales_listings`

## Coleta pronta no painel

O dashboard em `/admin/admin-dashboard.html` agora mostra:

- acessos, visitantes, sessoes, IPs, dispositivos, cidades e origem do trafego
- tempo de permanencia por heartbeat
- materias mais vistas por slug de noticia
- comentarios, opinioes e assinaturas
- apoiadores/fundadores e pagamentos Pix pendentes
- pesquisas politicas, sentimento e sinais de reeleicao
- pedidos Ninjas, curriculos, planos, creditos e referencias Pix
- itens da pagina filha `vendas.html`

Importante: a tela `/admin` pode abrir sem Basic Auth para mostrar o formulario de login, mas todos os dados continuam protegidos em `/api/admin/*` por senha ou `ADMIN_TOKEN`.

Assim você escala sem risco de perda quando o tráfego aumentar.
