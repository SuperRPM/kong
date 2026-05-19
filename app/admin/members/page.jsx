import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MembersClient from '@/components/MembersClient'

export default async function MembersPage() {
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

  const [{ data: members }, { data: projects }, { data: projectMembers }] = await Promise.all([
    supabase.from('profiles').select('id, name, email, is_admin, created_at').order('created_at', { ascending: true }),
    supabase.from('projects').select('id, name').is('deleted_at', null).order('name'),
    supabase.from('project_members').select('project_id, user_id, role'),
  ])

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-[#171717] mb-1">멤버 관리</h1>
        <p className="text-sm text-[#999999] mb-8">팀원 목록 및 권한을 관리합니다.</p>
        <MembersClient
          initialMembers={members ?? []}
          projects={projects ?? []}
          initialProjectMembers={projectMembers ?? []}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
