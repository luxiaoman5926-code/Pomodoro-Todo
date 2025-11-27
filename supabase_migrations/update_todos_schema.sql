-- Add subtasks and estimated_time to todos table

ALTER TABLE todos ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 25; -- minutes

-- Update existing rows to have default values if null
UPDATE todos SET subtasks = '[]'::jsonb WHERE subtasks IS NULL;
-- For estimated_time, we can roughly migrate from estimated_pomodoros * 25 if we wanted,
-- but let's just default to 25 or keep as is.
UPDATE todos SET estimated_time = estimated_pomodoros * 25 WHERE estimated_time IS NULL AND estimated_pomodoros IS NOT NULL;

