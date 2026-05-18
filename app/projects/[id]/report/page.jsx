import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function WeeklyReportPage({ params }) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: project }] = await Promise.all([
    supabase.from('profiles').select('name, is_admin').eq('id', user.id).single(),
    supabase.from('projects').select('id, name, prefix').eq('id', projectId).is('deleted_at', null).single(),
  ])

  if (!project) notFound()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: completed } = await supabase
    .from('issues')
    .select('id, title, category, number, completed_at, assignee:assignee_id(name), requester:created_by(name)')
    .eq('project_id', projectId)
    .eq('status', 'done')
    .gte('completed_at', sevenDaysAgo)
    .is('deleted_at', null)
    .order('completed_at', { ascending: false })

  function issueId(category, number) {
    if (!category || !number) return null
    return `${project.prefix}-${category}-${String(number).padStart(3, '0')}`
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href={`/projects/${projectId}`}
            className="text-sm text-[#999999] hover:text-[#171717] transition-colors"
          >
            ← {project.name}
          </Link>
          <h1 className="text-xl font-semibold text-[#171717] mt-2">주간 리포트</h1>
          <p className="text-sm text-[#60646c] mt-1">최근 7일간 완료된 이슈</p>
        </div>

        {!completed || completed.length === 0 ? (
          <div className="text-center py-20 text-[#999999] text-sm">
            이번 주 완료된 이슈가 없습니다.
          </div>
        ) : (
          <div className="bg-white border border-[#dcdee0] rounded-xl overflow-hidden">
            {/* 데스크톱 테이블 */}
            <div className="hidden md:block">
              <div className="flex items-center px-4 py-2 bg-[#fafafa] border-b border-[#f0f0f3] gap-3">
                <span className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">ID</span>
                <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">제목</span>
                <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">카테고리</span>
                <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">담당자</span>
                <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">요청자</span>
                <span className="w-24 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">완료일</span>
              </div>
              <div className="divide-y divide-[#f0f0f3]">
                {completed.map(issue => (
                  <Link key={issue.id} href={`/projects/${projectId}/issues/${issue.id}`} className="flex items-center px-4 py-3 hover:bg-[#fafafa] gap-3 transition-colors">
                    <span className="w-28 shrink-0 font-mono text-xs text-[#60646c]">{issueId(issue.category, issue.number) ?? '-'}</span>
                    <span className="flex-1 min-w-0 text-sm text-[#171717] truncate">{issue.title}</span>
                    <span className="w-20 shrink-0 text-xs text-[#60646c]">{issue.category ?? '-'}</span>
                    <span className="w-20 shrink-0 text-xs text-[#60646c]">{issue.assignee?.name ?? '-'}</span>
                    <span className="w-20 shrink-0 text-xs text-[#60646c]">{issue.requester?.name ?? '-'}</span>
                    <span className="w-24 shrink-0 text-xs text-[#60646c]">{issue.completed_at ?? '-'}</span>
                  </Link>
                ))}
              </div>
            </div>
            {/* 모바일 카드 */}
            <div className="md:hidden divide-y divide-[#f0f0f3]">
              {completed.map(issue => (
                <Link key={issue.id} href={`/projects/${projectId}/issues/${issue.id}`} className="block p-4 hover:bg-[#fafafa] transition-colors">
                  <span className="font-mono text-xs text-[#999999] block mb-1">{issueId(issue.category, issue.number) ?? '-'}</span>
                  <p className="text-sm font-medium text-[#171717] mb-2">{issue.title}</p>
                  <div className="flex items-center gap-3 text-xs text-[#60646c]">
                    {issue.assignee?.name && <span>{issue.assignee.name}</span>}
                    {issue.completed_at && <span className="text-[#999999]">{issue.completed_at}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
