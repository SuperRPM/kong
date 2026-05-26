import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AssignBoard from '@/components/AssignBoard'

export default async function AssignPage({ params }) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: project }, { data: membersRaw }, { data: issues }] = await Promise.all([
    supabase.from('profiles').select('name, is_admin').eq('id', user.id).single(),
    supabase.from('projects').select('id, name, prefix').eq('id', projectId).single(),
    supabase.from('project_members').select('user_id, role, profile:user_id(id, name)').eq('project_id', projectId),
    supabase
      .from('issues')
      .select('id, number, sub_number, parent_issue_id, title, description, status, priority, category, assignee_id, assignee:assignee_id(name), parent:parent_issue_id(category, number)')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .neq('status', 'done')
      .order('created_at', { ascending: false }),
  ])

  const members = (membersRaw ?? []).map(m => ({ ...m.profile, role: m.role })).filter(m => m.id)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <AssignBoard
        projectId={projectId}
        project={project}
        members={members}
        initialIssues={issues ?? []}
      />
    </div>
  )
}
