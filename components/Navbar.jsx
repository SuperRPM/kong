'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar({ user }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-6 gap-4">
      <Link href="/projects" className="text-base font-bold text-blue-400 mr-4">
        Kong
      </Link>
      <Link href="/projects" className="text-sm text-slate-400 hover:text-slate-100 transition-colors">
        프로젝트
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-slate-500">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
