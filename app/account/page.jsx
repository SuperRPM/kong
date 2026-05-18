import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AccountClient from '@/components/AccountClient'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, is_admin')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-[#171717] mb-6">내 계정</h1>
        <AccountClient profile={profile} email={user.email} />
      </main>
    </div>
  )
}
