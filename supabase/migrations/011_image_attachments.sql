-- Supabase Storage 버튷 생성 (issue-images, public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'issue-images',
  'issue-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage 정첵
CREATE POLICY "authenticated read issue images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'issue-images');

CREATE POLICY "authenticated upload issue images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'issue-images');

CREATE POLICY "owners delete issue images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'issue-images' AND owner = auth.uid());

-- 체 테이블
CREATE TABLE IF NOT EXISTS issue_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE issue_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read attachments" ON issue_attachments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated insert attachments" ON issue_attachments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "uploaders delete own attachments" ON issue_attachments
  FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);
