alter table media_assets
  add column if not exists source_type text not null default 'owned';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'media_assets_source_type_check'
  ) then
    alter table media_assets
      add constraint media_assets_source_type_check
      check (source_type in ('owned', 'direct', 'programmatic', 'editorial'));
  end if;
end $$;

create index if not exists media_assets_source_type_idx
  on media_assets (source_type, created_at desc);
