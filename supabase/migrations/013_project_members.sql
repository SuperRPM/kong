-- 013_project_members.sql
-- Project membership: controls which users can be assigned to issues in a project

CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- All authenticated users can see who's in a project (needed to render assignee names)
CREATE POLICY "project_members_select" ON project_members
  FOR SELECT TO authenticated USING (true);

-- Only admins can add/remove members
CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Seed: add all existing profiles as members of all existing projects
-- so current projects are not broken after migration
INSERT INTO project_members (project_id, user_id)
SELECT p.id, pr.id
FROM projects p
CROSS JOIN profiles pr
WHERE p.deleted_at IS NULL
ON CONFLICT DO NOTHING;
