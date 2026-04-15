create table if not exists public.app_kv_store (
  store_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.app_kv_store is
  'Store compartilhado em JSON para cache e dados do backend/worker do Catalogo Cruzeiro do Sul.';
