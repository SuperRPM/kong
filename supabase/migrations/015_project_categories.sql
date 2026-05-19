-- 015_project_categories.sql
-- 프로젝트별 카테고리 관리 테이블
-- 기존 하드코딩된 SL/CS/CM을 DB로 이관

CREATE TABLE project_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  value      TEXT NOT NULL,
  label      TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, value)
);

ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;

-- 모든 인증 사용자가 카테고리 조회 가능
CREATE POLICY "project_categories_select" ON project_categories
  FOR SELECT TO authenticated USING (true);

-- global admin 또는 project admin만 추가/수정/삭제
CREATE POLICY "project_categories_insert" ON project_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_categories.project_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE POLICY "project_categories_update" ON project_categories
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_categories.project_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE POLICY "project_categories_delete" ON project_categories
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_categories.project_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );
