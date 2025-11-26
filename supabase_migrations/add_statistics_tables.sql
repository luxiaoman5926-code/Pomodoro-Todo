-- 创建 pomodoro_sessions 表：记录每次专注会话
-- 用于生成热力图和统计报表

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES todos(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  phase TEXT NOT NULL CHECK (phase IN ('focus', 'shortBreak', 'longBreak')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_date ON pomodoro_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_created ON pomodoro_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task ON pomodoro_sessions(task_id);

-- 为 todos 表添加 completed_at 字段（用于任务历史）
ALTER TABLE todos
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 创建索引以提高查询已完成任务的性能
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON todos(user_id, completed_at DESC) WHERE completed = TRUE;

