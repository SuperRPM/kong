-- 014_project_role.sql
-- project_members에 role 컬럼 추가 (member | admin)
-- 프로젝트 생성자를 자동으로 admin으로 시딩
-- project_members RLS 업데이트: project admin도 멤버 관리 가능

ALTER TABLE project_members
  ADD COLUMN role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('member', 'admin'));

-- 기존 프로젝트 생성자를 project admin으로 승격
UPDATE project_members pm
SET role = 'admin'
FROM projects p
WHERE pm.project_id = p.id
  AND pm.user_id = p.created_by;

-- 기존 INSERT/DELETE 정책 교체 (project admin도 허용하도록)
DROP POLICY "project_members_insert" ON project_members;
DROP POLICY "project_members_delete" ON project_members;

-- INSERT: global admin 또는 해당 프로젝트의 project admin
CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM project_members pm_admin
      WHERE pm_admin.project_id = project_members.project_id
        AND pm_admin.user_id = auth.uid()
        AND pm_admin.role = 'admin'
    )
  );

-- UPDATE (role 변경용): global admin 또는 project admin
CREATE POLICY "project_members_update" ON project_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM project_members pm_admin
      WHERE pm_admin.project_id = project_members.project_id
        AND pm_admin.user_id = auth.uid()
        AND pm_admin.role = 'admin'
    )
  );

-- DELETE: global admin 또는 project admin
CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM project_members pm_admin
      WHERE pm_admin.project_id = project_members.project_id
        AND pm_admin.user_id = auth.uid()
        AND pm_admin.role = 'admin'
    )
  );
