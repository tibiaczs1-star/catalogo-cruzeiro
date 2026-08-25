ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS width integer CHECK (width > 0);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS height integer CHECK (height > 0);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS has_audio boolean;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS thumbnail_key text;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS original_filename text;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS fit_mode text NOT NULL DEFAULT 'contain'
  CHECK (fit_mode IN ('contain','cover','fill'));
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS focal_x numeric(5,2) NOT NULL DEFAULT 50
  CHECK (focal_x BETWEEN 0 AND 100);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS focal_y numeric(5,2) NOT NULL DEFAULT 50
  CHECK (focal_y BETWEEN 0 AND 100);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS zoom numeric(5,2) NOT NULL DEFAULT 1
  CHECK (zoom BETWEEN 1 AND 4);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS rotation integer NOT NULL DEFAULT 0
  CHECK (rotation IN (0,90,180,270));
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS background_color text NOT NULL DEFAULT '#000000'
  CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS trim_start_seconds numeric(10,3)
  CHECK (trim_start_seconds >= 0);
ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS trim_end_seconds numeric(10,3)
  CHECK (trim_end_seconds > 0);
ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS volume numeric(4,3) NOT NULL DEFAULT 1
  CHECK (volume BETWEEN 0 AND 1);
ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS transition_name text NOT NULL DEFAULT 'fade'
  CHECK (transition_name IN ('none','fade','slide'));

ALTER TABLE playlist_items ADD CONSTRAINT playlist_items_trim_order_check
  CHECK (trim_end_seconds IS NULL OR trim_end_seconds > COALESCE(trim_start_seconds, 0)) NOT VALID;
