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

  const [{ data: profile }, { data: project }, { data: members }] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).single(),
    supabase.from('projects').select('id, name, prefix').eq('id', projectId).single(),
    supabase.from('profiles').select('id, name').order('name'),
  ])

  if (!project) redirect('/projects')

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
        <NewIssueForm projectId={projectId} projectPrefix={project.prefix ?? 'REQ'} members={members ?? []} />
      </main>
    </div>
  )
}
