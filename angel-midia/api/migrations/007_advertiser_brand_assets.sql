alter table advertisers
  add column if not exists photo_asset_id uuid references media_assets(id) on delete set null,
  add column if not exists logo_asset_id uuid references media_assets(id) on delete set null;
