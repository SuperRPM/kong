import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import NewProjectButton from '@/components/NewProjectButton'

function ProjectCard({ project, issueCounts }) {
  const projectIssues = (issueCounts ?? []).filter(i => i.project_id === project.id)
  const total = projectIssues.length
  const done = projectIssues.filter(i => i.status === 'done').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <li>
      <Link
        href={`/projects/${project.id}`}
        className="block bg-white border border-[#dcdee0] rounded-xl p-5 hover:shadow-sm transition-shadow"
      >
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[#171717]">{project.name}</p>
          {project.is_private && (
            <span className="text-[10px] font-semibold bg-[#f0f0f3] text-[#60646c] px-1.5 py-0.5 rounded uppercase tracking-wide">비공개</span>
          )}
          {project.completed_at && (
            <span className="text-[10px] font-semibold bg-[#f0fdf4] text-[#16a34a] px-1.5 py-0.5 rounded uppercase tracking-wide">완료</span>
          )}
        </div>
        {project.description && (
          <p className="text-sm text-[#60646c] mt-1">{project.description}</p>
        )}
        <p className="text-xs text-[#999999] mt-2">
          {new Date(project.created_at).toLocaleDateString('ko-KR')}
        </p>
        {total > 0 && (
          <div className="mt-3">
            <p className="text-xs text-[#999999] mb-1">완료 {done} / 전체 {total}</p>
            <div className="w-full bg-[#f0f0f3] rounded-full" style={{ height: '3px' }}>
              <div
                className="bg-[#22c55e] rounded-full"
                style={{ width: `${pct}%`, height: '3px' }}
              />
            </div>
          </div>
        )}
      </Link>
    </li>
  )
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, is_admin')
    .eq('id', user.id)
    .single()

  const [{ data: projects }, { data: issueCounts }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, description, is_private, completed_at, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('issues')
      .select('project_id, status')
      .is('deleted_at', null),
  ])

  const activeProjects = (projects ?? []).filter(p => !p.completed_at)
  const archivedProjects = (projects ?? []).filter(p => !!p.completed_at)

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-[#171717]">프로젝트</h1>
          <NewProjectButton />
        </div>

        {activeProjects.length === 0 && archivedProjects.length === 0 ? (
          <div className="text-center py-20 text-[#999999]">
            <p className="text-sm">아직 프로젝트가 없습니다.</p>
            <p className="text-sm mt-1">위 버튼으로 첫 프로젝트를 만들어보세요.</p>
          </div>
        ) : (
          <>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-[#999999] py-4">진행 중인 프로젝트가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {activeProjects.map(project => (
                  <ProjectCard key={project.id} project={project} issueCounts={issueCounts} />
                ))}
              </ul>
            )}

            {archivedProjects.length > 0 && (
              <details className="mt-8 group">
                <summary className="flex items-center gap-2 cursor-pointer list-none select-none mb-3">
                  <span className="text-sm font-semibold text-[#60646c] group-open:text-[#171717] transition-colors">
                    완료된 프로젝트
                  </span>
                  <span className="text-xs text-[#999999] bg-[#f0f0f3] px-2 py-0.5 rounded-full">{archivedProjects.length}</span>
                  <svg
                    className="w-4 h-4 text-[#aaaaaa] group-open:rotate-90 transition-transform"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </summary>
                <ul className="space-y-2 opacity-75">
                  {archivedProjects.map(project => (
                    <ProjectCard key={project.id} project={project} issueCounts={issueCounts} />
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </main>
    </div>
  )
}
