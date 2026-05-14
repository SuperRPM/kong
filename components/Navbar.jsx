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
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6 gap-4">
      <Link href="/projects" className="text-base font-bold text-blue-600 mr-4">
        Kong
      </Link>
      <Link href="/projects" className="text-sm text-gray-600 hover:text-gray-900">
        프로젝트
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-gray-500">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
