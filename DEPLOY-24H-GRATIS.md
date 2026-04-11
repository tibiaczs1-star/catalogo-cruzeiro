# Deploy 24h (baixo custo / grátis)

## Stack recomendada

1. **Backend + worker:** Render (Free) ou Railway (Starter)
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
   - `ADMIN_TOKEN=99831455a` (recomendado trocar depois da publicação)
   - `PORT` (apenas no web)
4. Garantir volume persistente para `backend/data/` (ou migrar para Supabase)

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
- Em host gratuito com disco efêmero, usar Supabase é obrigatório para garantir retenção após reinício.

## Próximo passo recomendado

- Migrar `backend/data/*.json` para tabelas Supabase:
  - `news_items`
  - `business_directory`
  - `comments`
  - `subscriptions`
  - `votes`
  - `analytics_events`

Assim você escala sem risco de perda quando o tráfego aumentar.
