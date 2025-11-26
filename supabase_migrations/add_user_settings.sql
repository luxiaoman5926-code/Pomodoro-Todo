-- 创建用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_duration INTEGER DEFAULT 1500, -- 25分钟 (秒)
  short_break_duration INTEGER DEFAULT 300, -- 5分钟 (秒)
  long_break_duration INTEGER DEFAULT 1200, -- 20分钟 (秒)
  cycles_before_long_break INTEGER DEFAULT 4,
  auto_start_focus BOOLEAN DEFAULT FALSE,
  auto_start_break BOOLEAN DEFAULT FALSE,
  white_noise_type TEXT DEFAULT 'rain',
  white_noise_volume FLOAT DEFAULT 0.5,
  notification_sound TEXT DEFAULT 'default',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

