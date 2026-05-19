-- 016_private_projects.sql
-- projects.is_private 컬럼 추가
-- projects/issues RLS를 세분화: 비공개 프로젝트는 멤버/global admin만 접근

ALTER TABLE projects
  ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;

-- 기존 ALL 정책을 DROP하고 세분화된 정책으로 교체
DROP POLICY "projects: 로그인 사용자 전체 접근" ON projects;

-- SELECT: 공개 프로젝트는 모든 인증 사용자, 비공개는 멤버 또는 global admin만
CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated
  USING (
    is_private = false
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
  );

-- INSERT: 모든 인증 사용자가 프로젝트 생성 가능
CREATE POLICY "projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: global admin 또는 project admin
CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: global admin 또는 project admin (소프트 딜리트이므로 실제론 UPDATE 경로)
CREATE POLICY "projects_delete" ON projects
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- issues도 동일한 접근 제어 적용
DROP POLICY "issues: 로그인 사용자 전체 접근" ON issues;

-- SELECT: 비공개 프로젝트의 이슈는 멤버/global admin만
CREATE POLICY "issues_select" ON issues
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = issues.project_id AND (
        p.is_private = false
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())
      )
    )
  );

-- INSERT: project member 또는 global admin
CREATE POLICY "issues_insert" ON issues
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = issues.project_id AND user_id = auth.uid())
  );

-- UPDATE: project member 또는 global admin
CREATE POLICY "issues_update" ON issues
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = issues.project_id AND user_id = auth.uid())
  );

-- DELETE: project admin 또는 global admin
CREATE POLICY "issues_delete" ON issues
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = issues.project_id AND user_id = auth.uid() AND role = 'admin'
    )
  );
