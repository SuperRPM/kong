import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import IssueList from '@/components/IssueList'
import ProjectActions from '@/components/ProjectActions'

export default async function ProjectPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: project }, { data: issues }, { data: members }] =
    await Promise.all([
      supabase.from('profiles').select('name, is_admin').eq('id', user.id).single(),
      supabase.from('projects').select('id, name, description, prefix').eq('id', id).is('deleted_at', null).single(),
      supabase
        .from('issues')
        .select('id, title, status, priority, category, number, planned_at, completed_at, assignee_id, assignee:assignee_id(name), requester:created_by(name)')
        .eq('project_id', id)
        .is('deleted_at', null)
        .order('category', { ascending: true })
        .order('number', { ascending: true }),
      supabase.from('profiles').select('id, name'),
    ])

  if (!project) notFound()

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-[#171717]">{project.name}</h1>
              <span className="font-mono text-xs bg-[#f0f0f3] text-[#60646c] px-2 py-0.5 rounded">{project.prefix}</span>
            </div>
            {project.description && (
              <p className="text-sm text-[#60646c]">{project.description}</p>
            )}
          </div>
          <ProjectActions projectId={id} projectName={project.name} />
        </div>
        <IssueList
          projectId={id}
          projectPrefix={project.prefix ?? 'REQ'}
          initialIssues={issues ?? []}
          members={members ?? []}
        />
      </main>
    </div>
  )
}
