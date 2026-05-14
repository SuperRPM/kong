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
    <header className="h-16 bg-white border-b border-[#f0f0f3] flex items-center px-6 gap-6">
      <Link href="/projects" className="text-base font-semibold text-[#171717] mr-2">
        Kong
      </Link>
      <Link href="/projects" className="text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors">
        프로젝트
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm text-[#999999]">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
