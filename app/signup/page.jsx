'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] h-11 focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.endsWith('@mindwareworks.com')) {
      setError('회사 이메일(@mindwareworks.com)만 사용 가능합니다.')
      return
    }
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (authError) {
      setError(authError.message)
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
          <h2 className="text-base font-semibold text-[#171717] mb-2">회원가입</h2>

          {error && (
            <p className="text-sm text-[#eb8e90] bg-[#fff5f5] border border-[#fecaca] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">이름</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" required className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@mindwareworks.com" required className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6자 이상" required className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">비밀번호 확인</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className={inputCls} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {loading ? '가입 중...' : '가입하기'}
          </button>

          <p className="text-center text-sm text-[#60646c]">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-[#0d74ce] hover:underline font-medium">로그인</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
