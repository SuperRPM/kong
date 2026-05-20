import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProjectActions from '@/components/ProjectActions'
import ProjectViewClient from '@/components/ProjectViewClient'

export default async function ProjectPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: project }, { data: issues }, { data: membersRaw }, { data: allMembers }, { data: categories }] =
    await Promise.all([
      supabase.from('profiles').select('name, is_admin').eq('id', user.id).single(),
      supabase.from('projects').select('id, name, description, prefix, is_private').eq('id', id).is('deleted_at', null).single(),
      supabase
        .from('issues')
        .select('id, title, status, priority, category, number, planned_at, completed_at, assignee_id, assignee:assignee_id(name), requester:created_by(name)')
        .eq('project_id', id)
        .is('deleted_at', null)
        .order('category', { ascending: true })
        .order('number', { ascending: true }),
      supabase.from('project_members').select('user_id, role, profile:user_id(id, name)').eq('project_id', id),
      supabase.from('profiles').select('id, name').order('name'),
      supabase.from('project_categories').select('id, value, label, sort_order').eq('project_id', id).order('sort_order'),
    ])

  const membersWithRole = (membersRaw ?? [])
    .map(m => ({ ...m.profile, role: m.role, user_id: m.user_id }))
    .filter(m => m.id)
    .sort((a, b) => a.name.localeCompare(b.name))
  const members = membersWithRole.map(({ id, name }) => ({ id, name }))
  const isProjectAdmin = (membersRaw ?? []).some(m => m.user_id === user.id && m.role === 'admin')
  const canManage = (profile?.is_admin ?? false) || isProjectAdmin

  if (!project) notFound()

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-[#171717]">{project.name}</h1>
              <span className="font-mono text-xs bg-[#f0f0f3] text-[#60646c] px-2 py-0.5 rounded">{project.prefix}</span>
            </div>
            {project.description && (
              <p className="text-sm text-[#60646c]">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/projects/${id}/assign`}
              className="text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors"
            >
              업무 분배
            </Link>
            <Link
              href={`/projects/${id}/report`}
              className="text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors"
            >
              주간 리포트
            </Link>
            <ProjectActions projectId={id} projectName={project.name} project={project} canManage={canManage} projectMembers={membersWithRole} allMembers={allMembers ?? []} categories={categories ?? []} />
          </div>
        </div>
        <ProjectViewClient
          projectId={id}
          projectPrefix={project.prefix ?? 'REQ'}
          initialIssues={issues ?? []}
          members={members ?? []}
          categories={categories ?? []}
        />
      </main>
    </div>
  )
}
