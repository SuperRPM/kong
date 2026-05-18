'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VERSION } from '@/lib/version'
import NotificationBell from '@/components/NotificationBell'

export default function Navbar({ user }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 md:h-16 bg-white border-b border-[#f0f0f3] flex items-center px-4 md:px-6 gap-4 md:gap-6">
      <Link href="/projects" className="flex flex-col items-start mr-1 md:mr-2 shrink-0">
        <span className="text-base font-semibold text-[#171717] leading-tight">Kong</span>
        <span className="text-[10px] text-[#cccccc] leading-none">v{VERSION}</span>
      </Link>
      <Link href="/projects" className="hidden md:block text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors">
        프로젝트
      </Link>
      {user?.is_admin && (
        <>
          <Link href="/trash" className="hidden md:block text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors">
            휴지통
          </Link>
          <Link href="/admin/members" className="hidden md:block text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors">
            멤버 관리
          </Link>
        </>
      )}
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <NotificationBell />
        <Link href="/account" className="text-sm text-[#999999] hover:text-[#171717] transition-colors">
          <span className="hidden md:inline">{user?.name}</span>
          <span className="md:hidden w-7 h-7 rounded-full bg-[#f0f0f3] flex items-center justify-center text-xs font-medium text-[#60646c]">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors"
        >
          <span className="hidden md:inline">로그아웃</span>
          <span className="md:hidden text-xs">로그아웃</span>
        </button>
      </div>
    </header>
  )
}
