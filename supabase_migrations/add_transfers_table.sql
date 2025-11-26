-- 创建 transfers 表
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'document')),
  content TEXT NOT NULL, -- 文本内容或文件路径
  metadata JSONB DEFAULT '{}'::jsonb, -- 文件名、大小、MIME类型等
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_transfers_user_created ON transfers(user_id, created_at DESC);

-- RLS
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transfers" ON transfers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfers" ON transfers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transfers" ON transfers
  FOR DELETE USING (auth.uid() = user_id);

-- 尝试创建 Storage Bucket (如果权限允许)
-- 注意：如果通过 SQL 创建失败，请在 Supabase Dashboard 手动创建名为 'transfers' 的私有 bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('transfers', 'transfers', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- 允许用户上传文件到自己的文件夹 (user_id/*)
CREATE POLICY "Users can upload own transfer files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'transfers' AND
  auth.uid() = owner
);

-- 允许用户查看自己的文件
CREATE POLICY "Users can view own transfer files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transfers' AND
  auth.uid() = owner
);

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete own transfer files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'transfers' AND
  auth.uid() = owner
);

