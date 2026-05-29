-- Phase 14: 프로젝트 아카이브 (completed_at)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;
