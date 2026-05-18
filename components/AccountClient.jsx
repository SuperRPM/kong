'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccountClient({ profile, email }) {
  const router = useRouter()

  const [name, setName] = useState(profile?.name ?? '')
  const [nameMsg, setNameMsg] = useState(null)
  const [nameSaving, setNameSaving] = useState(false)

  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg] = useState(null)
  const [pwSaving, setPwSaving] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteMsg, setDeleteMsg] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function saveName(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setNameSaving(true)
    setNameMsg(null)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', (await supabase.auth.getUser()).data.user.id)
    setNameSaving(false)
    if (error) {
      setNameMsg({ ok: false, text: '저장에 실패했습니다.' })
    } else {
      setNameMsg({ ok: true, text: '이름이 변경됐습니다.' })
      router.refresh()
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: '새 비밀번호가 일치하지 않습니다.' })
      return
    }
    if (newPw.length < 6) {
      setPwMsg({ ok: false, text: '비밀번호는 6자 이상이어야 합니다.' })
      return
    }
    setPwSaving(true)
    setPwMsg(null)
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: oldPw })
    if (signInError) {
      setPwSaving(false)
      setPwMsg({ ok: false, text: '현재 비밀번호가 올바르지 않습니다.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwSaving(false)
    if (error) {
      setPwMsg({ ok: false, text: '변경에 실패했습니다.' })
    } else {
      setPwMsg({ ok: true, text: '비밀번호가 변경됐습니다.' })
      setOldPw('')
      setNewPw('')
      setConfirmPw('')
    }
  }

  async function deleteAccount(e) {
    e.preventDefault()
    if (deleteConfirm !== '탈퇴합니다') return
    setDeleting(true)
    setDeleteMsg(null)
    const supabase = createClient()
    const { error } = await supabase.rpc('delete_user')
    if (error) {
      setDeleting(false)
      setDeleteMsg({ ok: false, text: '탈퇴 처리에 실패했습니다. 관리자에게 문의하세요.' })
      return
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-8">

      {/* 프로필 */}
      <section className="bg-white border border-[#dcdee0] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#171717] mb-4">프로필</h2>
        <form onSubmit={saveName} className="space-y-3">
          <div>
            <label className="block text-xs text-[#60646c] mb-1">이메일</label>
            <p className="text-sm text-[#999999]">{email}</p>
          </div>
          <div>
            <label className="block text-xs text-[#60646c] mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-[#dcdee0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d74ce]"
            />
          </div>
          {nameMsg && (
            <p className={`text-xs ${nameMsg.ok ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{nameMsg.text}</p>
          )}
          <button
            type="submit"
            disabled={nameSaving}
            className="text-sm font-medium bg-[#171717] text-white rounded-lg px-4 py-2 hover:bg-[#333333] disabled:opacity-50 transition-colors"
          >
            {nameSaving ? '저장 중...' : '저장'}
          </button>
        </form>
      </section>

      {/* 비밀번호 변경 */}
      <section className="bg-white border border-[#dcdee0] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#171717] mb-4">비밀번호 변경</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="block text-xs text-[#60646c] mb-1">현재 비밀번호</label>
            <input
              type="password"
              value={oldPw}
              onChange={e => setOldPw(e.target.value)}
              className="w-full border border-[#dcdee0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d74ce]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#60646c] mb-1">새 비밀번호</label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              className="w-full border border-[#dcdee0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d74ce]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#60646c] mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className="w-full border border-[#dcdee0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d74ce]"
            />
          </div>
          {pwMsg && (
            <p className={`text-xs ${pwMsg.ok ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{pwMsg.text}</p>
          )}
          <button
            type="submit"
            disabled={pwSaving}
            className="text-sm font-medium bg-[#171717] text-white rounded-lg px-4 py-2 hover:bg-[#333333] disabled:opacity-50 transition-colors"
          >
            {pwSaving ? '변경 중...' : '변경'}
          </button>
        </form>
      </section>

      {/* 계정 탈퇴 */}
      <section className="bg-white border border-[#ef4444]/30 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#ef4444] mb-1">계정 탈퇴</h2>
        <p className="text-xs text-[#999999] mb-4">탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.</p>
        <form onSubmit={deleteAccount} className="space-y-3">
          <div>
            <label className="block text-xs text-[#60646c] mb-1">
              확인을 위해 <span className="font-mono font-semibold text-[#171717]">탈퇴합니다</span> 를 입력하세요
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full border border-[#dcdee0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ef4444]"
            />
          </div>
          {deleteMsg && (
            <p className="text-xs text-[#ef4444]">{deleteMsg.text}</p>
          )}
          <button
            type="submit"
            disabled={deleting || deleteConfirm !== '탈퇴합니다'}
            className="text-sm font-medium bg-[#ef4444] text-white rounded-lg px-4 py-2 hover:bg-[#dc2626] disabled:opacity-40 transition-colors"
          >
            {deleting ? '처리 중...' : '탈퇴하기'}
          </button>
        </form>
      </section>

    </div>
  )
}
