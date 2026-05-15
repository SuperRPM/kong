-- pg_cron을 사용하기 위해 먼저 Supabase Dashboard → Database → Extensions에서
-- pg_cron 익스텐션을 활성화해야 합니다.
-- (Extensions 탭에서 "pg_cron" 검색 후 Enable)

-- 멱등성 보장: 동일 이름의 작업이 이미 존재하면 먼저 제거
SELECT cron.unschedule('kong-cleanup-soft-deleted')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'kong-cleanup-soft-deleted'
);

-- 매일 새벽 2시(UTC)에 소프트-삭제된 지 30일 이상 지난 레코드를 영구 삭제
SELECT cron.schedule(
  'kong-cleanup-soft-deleted',
  '0 2 * * *',
  $$
    DELETE FROM issues
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days';

    DELETE FROM projects
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days';
  $$
);
