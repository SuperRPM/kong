import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import IssueList from '@/components/IssueList'

export default async function ProjectPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: project }, { data: issues }, { data: members }] =
    await Promise.all([
      supabase.from('profiles').select('name').eq('id', user.id).single(),
      supabase.from('projects').select('id, name, description').eq('id', id).single(),
      supabase
        .from('issues')
        .select('id, title, status, priority, created_at, assignee:assignee_id(name)')
        .eq('project_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name'),
    ])

  if (!project) notFound()

  return (
    <div className="min-h-screen">
      <Navbar user={profile} />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        <IssueList
          projectId={id}
          initialIssues={issues ?? []}
          members={members ?? []}
        />
      </main>
    </div>
  )
}
