-- Add tag_color_mode column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS tag_color_mode TEXT DEFAULT 'colorful';




