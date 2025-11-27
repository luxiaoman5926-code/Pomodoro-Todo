-- 确保 user_settings 表包含所有必要的字段
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS tag_color_mode TEXT DEFAULT 'colorful',
ADD COLUMN IF NOT EXISTS notification_sound TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS white_noise_type TEXT DEFAULT 'rain',
ADD COLUMN IF NOT EXISTS white_noise_volume FLOAT DEFAULT 0.5;

-- 修复可能存在的 NULL 值
UPDATE user_settings SET tag_color_mode = 'colorful' WHERE tag_color_mode IS NULL;

