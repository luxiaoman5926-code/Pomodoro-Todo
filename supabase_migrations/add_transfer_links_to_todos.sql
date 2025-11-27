-- Add transfer_ids array column to todos table to link tasks with transfer items
ALTER TABLE todos ADD COLUMN IF NOT EXISTS transfer_ids UUID[] DEFAULT '{}';



