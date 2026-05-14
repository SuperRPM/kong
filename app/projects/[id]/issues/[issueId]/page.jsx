import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import IssueDetailClient from '@/components/IssueDetailClient'

export default async function IssuePage({ params }) {
  const { id: projectId, issueId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: issue }, { data: members }] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).single(),
    supabase
      .from('issues')
      .select('id, title, description, status, priority, category, number, planned_at, completed_at, assignee_id, assignee:assignee_id(name), requester:created_by(name), project:project_id(id, name, prefix)')
      .eq('id', issueId)
      .single(),
    supabase.from('profiles').select('id, name').order('name'),
  ])

  if (!issue) notFound()

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-[#0d74ce] hover:underline mb-6"
        >
          ← {issue.project?.name}
        </Link>
        <IssueDetailClient issue={issue} members={members ?? []} projectId={projectId} />
      </main>
    </div>
  )
}
