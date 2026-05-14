import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import TrashClient from '@/components/TrashClient'

export default async function TrashPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={profile} />
        <main className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-[#999999] text-sm">관리자만 접근할 수 있습니다.</p>
        </main>
      </div>
    )
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: deletedProjects }, { data: deletedIssues }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, description, deleted_at')
      .not('deleted_at', 'is', null)
      .gte('deleted_at', cutoff)
      .order('deleted_at', { ascending: false }),
    supabase
      .from('issues')
      .select('id, title, category, number, status, deleted_at, project:project_id(id, name, prefix)')
      .not('deleted_at', 'is', null)
      .gte('deleted_at', cutoff)
      .order('deleted_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-[#171717] mb-1">휴지통</h1>
        <p className="text-sm text-[#999999] mb-8">삭제 후 30일 이내 복구 가능합니다.</p>
        <TrashClient
          initialProjects={deletedProjects ?? []}
          initialIssues={deletedIssues ?? []}
        />
      </main>
    </div>
  )
}
