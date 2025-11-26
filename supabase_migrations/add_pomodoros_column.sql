-- 为 todos 表添加 pomodoros 字段
-- 用于记录每个任务已完成的番茄钟数量 (0-4)

ALTER TABLE todos
ADD COLUMN IF NOT EXISTS pomodoros INTEGER DEFAULT 0;

-- 添加约束确保值在 0-4 范围内（可选）
-- ALTER TABLE todos
-- ADD CONSTRAINT pomodoros_range CHECK (pomodoros >= 0 AND pomodoros <= 4);

