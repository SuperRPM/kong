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
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-[#171717]">프로젝트</h1>
          <NewProjectButton />
        </div>

        {!projects || projects.length === 0 ? (
          <div className="text-center py-20 text-[#999999]">
            <p className="text-sm">아직 프로젝트가 없습니다.</p>
            <p className="text-sm mt-1">위 버튼으로 첫 프로젝트를 만들어보세요.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {projects.map(project => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="block bg-white border border-[#dcdee0] rounded-xl p-5 hover:shadow-sm transition-shadow"
                >
                  <p className="font-semibold text-[#171717]">{project.name}</p>
                  {project.description && (
                    <p className="text-sm text-[#60646c] mt-1">{project.description}</p>
                  )}
                  <p className="text-xs text-[#999999] mt-2">
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
