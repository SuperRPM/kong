import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import NewIssueForm from '@/components/NewIssueForm'

export default async function NewIssuePage({ params }) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: project }, { data: membersRaw }, { data: categories }] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).single(),
    supabase.from('projects').select('id, name, prefix').eq('id', projectId).single(),
    supabase.from('project_members').select('profile:user_id(id, name)').eq('project_id', projectId),
    supabase.from('project_categories').select('id, value, label, sort_order').eq('project_id', projectId).order('sort_order'),
  ])

  if (!project) redirect('/projects')

  const members = (membersRaw ?? []).map(m => m.profile).filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-[#0d74ce] hover:underline mb-6"
        >
          ← {project.name}
        </Link>
        <h1 className="text-xl font-semibold text-[#171717] mb-6">새 이슈</h1>
        <NewIssueForm projectId={projectId} projectPrefix={project.prefix ?? 'REQ'} members={members} categories={categories ?? []} />
      </main>
    </div>
  )
}
