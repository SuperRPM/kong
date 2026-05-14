ALTER TABLE projects ADD COLUMN IF NOT EXISTS prefix TEXT NOT NULL DEFAULT 'REQ';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS number INT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS planned_at DATE;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS completed_at DATE;

CREATE OR REPLACE FUNCTION assign_issue_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1
  INTO NEW.number
  FROM issues
  WHERE project_id = NEW.project_id AND category = NEW.category;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER issues_auto_number
    BEFORE INSERT ON issues
    FOR EACH ROW
    WHEN (NEW.category IS NOT NULL)
    EXECUTE FUNCTION assign_issue_number();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
