ALTER TABLE schedules ADD COLUMN mode text NOT NULL DEFAULT 'scheduled';
ALTER TABLE schedules ALTER COLUMN starts_at DROP NOT NULL;
ALTER TABLE schedules ALTER COLUMN ends_at DROP NOT NULL;

ALTER TABLE schedules ADD CONSTRAINT schedules_mode_dates_check CHECK (
  (mode = 'continuous' AND starts_at IS NULL AND ends_at IS NULL)
  OR
  (mode = 'scheduled' AND starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at)
);

CREATE INDEX schedules_active_mode_priority_idx
  ON schedules(mode, priority DESC, created_at DESC);
