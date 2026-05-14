import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import NewProjectButton from '@/components/NewProjectButton'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar user={profile} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-100">프로젝트</h1>
          <NewProjectButton />
        </div>

        {!projects || projects.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-sm">아직 프로젝트가 없습니다.</p>
            <p className="text-sm mt-1">위 버튼으로 첫 프로젝트를 만들어보세요.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {projects.map(project => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="block bg-slate-800 border border-slate-700 rounded-xl p-5 hover:bg-slate-700 transition-colors"
                >
                  <p className="font-semibold text-slate-100">{project.name}</p>
                  {project.description && (
                    <p className="text-sm text-slate-400 mt-1">{project.description}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(project.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
