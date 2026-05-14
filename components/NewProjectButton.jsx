'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]'
const labelCls = 'block text-sm font-medium text-[#171717] mb-1'

export default function NewProjectButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: name.trim(), description: description.trim() || null, created_by: user.id })
      .select('id')
      .single()
    setLoading(false)
    if (!error && data) {
      setOpen(false)
      setName('')
      setDescription('')
      router.push(`/projects/${data.id}`)
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#000000] hover:bg-[#1a1a1a] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors"
      >
        + 새 프로젝트
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-[#171717] mb-5">새 프로젝트</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={labelCls}>이름 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="프로젝트 이름"
                  required
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>설명</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="프로젝트 설명 (선택)"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors">취소</button>
                <button type="submit" disabled={loading} className="bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors">
                  {loading ? '생성 중...' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
