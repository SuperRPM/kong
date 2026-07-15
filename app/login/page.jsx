'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] h-11 focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email.endsWith('@mindwareworks.com')) {
      setError('회사 이메일(@mindwareworks.com)만 사용 가능합니다.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        // status가 없으면 서버 응답 자체를 못 받은 것(네트워크/주소 문제) — 자격증명 오류와 구분
        setError(authError.status
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : '서버에 연결할 수 없습니다. 네트워크 연결 상태를 확인해주세요.')
        setLoading(false)
        return
      }
    } catch {
      setError('서버에 연결할 수 없습니다. 네트워크 연결 상태를 확인해주세요.')
      setLoading(false)
      return
    }

    router.push('/projects')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#171717] tracking-tight">Kong</h1>
          <p className="text-sm text-[#60646c] mt-1">팀 이슈 트래커</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#dcdee0] rounded-xl p-8 space-y-4">
          <h2 className="text-base font-semibold text-[#171717] mb-2">로그인</h2>

          {error && (
            <p className="text-sm text-[#eb8e90] bg-[#fff5f5] border border-[#fecaca] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@mindwareworks.com" required className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <p className="text-center text-sm text-[#60646c]">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-[#0d74ce] hover:underline font-medium">회원가입</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
