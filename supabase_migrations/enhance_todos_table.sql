-- 添加任务管理增强字段
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS estimated_pomodoros INTEGER DEFAULT 1;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_tags ON todos USING GIN(tags);

