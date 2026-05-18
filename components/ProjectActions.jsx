'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]'
const labelCls = 'block text-sm font-medium text-[#171717] mb-1'

export default function ProjectActions({ projectId, projectName, project, isAdmin }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: project?.name ?? '',
    description: project?.description ?? '',
    prefix: project?.prefix ?? '',
  })
  const [editLoading, setEditLoading] = useState(false)

  async function handleEdit(e) {
    e.preventDefault()
    if (!editForm.name.trim()) return
    setEditLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('projects').update({
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
      prefix: editForm.prefix.trim().toUpperCase() || project?.prefix,
    }).eq('id', projectId)
    setEditLoading(false)
    if (!error) { setEditing(false); router.refresh() }
  }

  async function handleDelete() {
    const supabase = createClient()
    const now = new Date().toISOString()
    await supabase.from('issues').update({ deleted_at: now }).eq('project_id', projectId).is('deleted_at', null)
    const { error } = await supabase.from('projects').update({ deleted_at: now }).eq('id', projectId)
    if (!error) router.push('/projects')
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {isAdmin && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors shrink-0"
          >
            프로젝트 수정
          </button>
        )}
        <button
          onClick={() => setConfirm(true)}
          className="text-sm font-medium text-[#999999] hover:text-[#ef4444] transition-colors shrink-0"
        >
          프로젝트 삭제
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-[#171717] mb-5">프로젝트 수정</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className={labelCls}>프로젝트명 *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>이슈 ID 접두사 (Prefix)</label>
                <input
                  type="text"
                  value={editForm.prefix}
                  onChange={e => setEditForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))}
                  maxLength={10}
                  className={inputCls}
                />
                <p className="text-xs text-[#999999] mt-1">변경 시 기존 이슈 ID 표시에 영향을 줍니다.</p>
              </div>
              <div>
                <label className={labelCls}>설명</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors">취소</button>
                <button type="submit" disabled={editLoading} className="bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors">
                  {editLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-[#171717] mb-2">프로젝트 삭제</h2>
            <p className="text-sm text-[#60646c] mb-5">
              <span className="font-medium text-[#171717]">{projectName}</span>과(와) 모든 이슈가 휴지통으로 이동합니다. 30일 이내 복구 가능합니다.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(false)} className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors">취소</button>
              <button onClick={handleDelete} className="bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
