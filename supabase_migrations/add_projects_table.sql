-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加 RLS 策略
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- 为 todos 表添加 project_id 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE todos ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 为 todos 表添加 due_date 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE todos ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_project_id ON todos(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);



