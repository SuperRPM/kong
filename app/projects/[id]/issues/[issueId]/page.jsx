import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import IssueDetailClient from '@/components/IssueDetailClient'

export default async function IssuePage({ params, searchParams }) {
  const { id: projectId, issueId } = await params
  const sp = await searchParams
  const returnHref = sp?.ref ?? `/projects/${projectId}`
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: issue }, { data: membersRaw }, { data: comments }, { data: activityLogs }, { data: attachments }, { data: categories }] = await Promise.all([
    supabase.from('profiles').select('name, is_admin').eq('id', user.id).single(),
    supabase
      .from('issues')
      .select('id, title, description, status, priority, category, number, sub_number, parent_issue_id, planned_at, completed_at, assignee_id, created_by, assignee:assignee_id(name), requester:created_by(name), project:project_id(id, name, prefix), parent:parent_issue_id(id, category, number, title)')
      .eq('id', issueId)
      .single(),
    supabase.from('project_members').select('user_id, role, profile:user_id(id, name)').eq('project_id', projectId),
    supabase
      .from('issue_comments')
      .select('id, body, created_at, author_id, author:author_id(name)')
      .eq('issue_id', issueId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('issue_activity_logs')
      .select('id, action, old_value, new_value, created_at, actor:actor_id(name)')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('issue_attachments')
      .select('id, file_path, file_name, file_size, uploaded_by, created_at')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true }),
    supabase.from('project_categories').select('id, value, label, sort_order').eq('project_id', projectId).order('sort_order'),
  ])

  if (!issue) notFound()

  // 하위이슈는 부모 이슈에만 적용 (자식 이슈는 추가 자식을 가질 수 없음)
  const { data: subIssues } = issue.parent_issue_id
    ? { data: [] }
    : await supabase
        .from('issues')
        .select('id, title, status, priority, category, sub_number, assignee:assignee_id(name)')
        .eq('parent_issue_id', issueId)
        .is('deleted_at', null)
        .order('sub_number', { ascending: true })

  const members = (membersRaw ?? []).map(m => ({ ...m.profile, role: m.role })).filter(m => m.id)
    .sort((a, b) => a.name.localeCompare(b.name))
  const isProjectAdmin = (membersRaw ?? []).some(m => m.user_id === user.id && m.role === 'admin')
  const canManage = (profile?.is_admin ?? false) || isProjectAdmin

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href={returnHref} className="inline-flex items-center gap-1 text-sm text-[#0d74ce] hover:underline mb-6">
          ← {issue.project?.name}
        </Link>
        <IssueDetailClient
          issue={issue}
          members={members}
          projectId={projectId}
          initialComments={comments ?? []}
          currentUserId={user.id}
          isAdmin={canManage}
          categories={categories ?? []}
          activityLogs={activityLogs ?? []}
          initialAttachments={attachments ?? []}
          initialSubIssues={subIssues ?? []}
          returnHref={returnHref}
        />
      </main>
    </div>
  )
}
