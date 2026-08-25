alter table dynamic_playback_policy
  drop constraint if exists dynamic_playback_policy_transition_name_check;

alter table dynamic_playback_policy
  add constraint dynamic_playback_policy_transition_name_check
    check (transition_name in ('none','fade','slide','zoom','wipe','rise','flip','blur','impact')),
  add column if not exists ticker_enabled boolean not null default true,
  add column if not exists ticker_mode text not null default 'live-news'
    check (ticker_mode in ('live-news','custom')),
  add column if not exists ticker_text text not null default 'Acompanhe o Catálogo CZS'
    check (char_length(ticker_text) between 1 and 180),
  add column if not exists ticker_speed text not null default 'normal'
    check (ticker_speed in ('calm','normal','fast')),
  add column if not exists ticker_position text not null default 'bottom'
    check (ticker_position in ('top','bottom')),
  add column if not exists news_source_url text not null default 'https://catalogo-cruzeiro-web.onrender.com/'
    check (news_source_url = 'https://catalogo-cruzeiro-web.onrender.com/'),
  add column if not exists news_feed_url text not null default 'https://catalogo-cruzeiro-web.onrender.com/api/news'
    check (news_feed_url = 'https://catalogo-cruzeiro-web.onrender.com/api/news'),
  add column if not exists news_qr_enabled boolean not null default true,
  add column if not exists schedule_days text not null default 'all'
    check (schedule_days in ('all','weekdays','weekends')),
  add column if not exists window_start text not null default '00:00'
    check (window_start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add column if not exists window_end text not null default '23:59'
    check (window_end ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add column if not exists priority_mode text not null default 'balanced'
    check (priority_mode in ('balanced','revenue','editorial'));
