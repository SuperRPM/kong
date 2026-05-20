import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function IssueRedirectPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: issue } = await supabase
    .from('issues')
    .select('id, project_id')
    .eq('id', id)
    .single()

  if (!issue) redirect('/projects')

  redirect(`/projects/${issue.project_id}/issues/${issue.id}`)
}
