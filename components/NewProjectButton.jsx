'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        + 새 프로젝트
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">새 프로젝트</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">이름 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="프로젝트 이름"
                  required
                  autoFocus
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">설명</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="프로젝트 설명 (선택)"
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-slate-400 hover:text-slate-100 px-4 py-2 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
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
