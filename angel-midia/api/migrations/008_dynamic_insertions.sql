alter table media_assets
  add column if not exists content_kind text not null default 'standard';

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'media_assets_content_kind_check'
  ) then
    alter table media_assets
      add constraint media_assets_content_kind_check
      check (content_kind in ('standard', 'advertisement', 'news', 'meme'));
  end if;
end $$;

create index if not exists media_assets_dynamic_inventory_idx
  on media_assets (source_type, content_kind, created_at desc)
  where processing_status = 'ready';

create table if not exists dynamic_playback_policy (
  id smallint primary key check (id = 1),
  enabled boolean not null default false,
  interval_items integer not null default 4 check (interval_items between 2 and 20),
  max_dynamic_percent integer not null default 20 check (max_dynamic_percent between 5 and 40),
  allow_direct_ads boolean not null default true,
  allow_programmatic_ads boolean not null default false,
  allow_news boolean not null default true,
  allow_memes boolean not null default true,
  transition_name text not null default 'fade' check (transition_name in ('none', 'fade', 'slide', 'zoom')),
  effect_intensity text not null default 'balanced' check (effect_intensity in ('subtle', 'balanced', 'strong')),
  overlay_enabled boolean not null default true,
  direct_cpm_cents integer not null default 2500 check (direct_cpm_cents between 0 and 1000000),
  programmatic_floor_cpm_cents integer not null default 1200 check (programmatic_floor_cpm_cents between 0 and 1000000),
  estimated_daily_cycles integer not null default 120 check (estimated_daily_cycles between 0 and 10000),
  updated_by uuid references admins(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into dynamic_playback_policy (id) values (1)
on conflict (id) do nothing;
