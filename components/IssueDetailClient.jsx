'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge, PriorityBadge, STATUS_OPTIONS, PRIORITY_OPTIONS } from './StatusBadge'

const CATEGORY_OPTIONS = [
  { value: 'SL', label: 'SL — 세일즈' },
  { value: 'CS', label: 'CS — CS팀' },
  { value: 'CM', label: 'CM — 공통' },
]

const inputCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]'
const selectCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]'
const labelCls = 'block text-sm font-medium text-[#171717] mb-1'

function issueId(prefix, category, number) {
  if (!category || !number) return null
  return `${prefix}-${category}-${String(number).padStart(3, '0')}`
}

export default function IssueDetailClient({ issue, members, projectId }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const prefix = issue.project?.prefix ?? 'REQ'
  const [form, setForm] = useState({
    title: issue.title,
    description: issue.description ?? '',
    status: issue.status,
    priority: issue.priority,
    assignee_id: issue.assignee_id ?? '',
    category: issue.category ?? 'SL',
    planned_at: issue.planned_at ?? '',
    completed_at: issue.completed_at ?? '',
  })

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('issues')
      .update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        assignee_id: form.assignee_id || null,
        category: form.category || null,
        planned_at: form.planned_at || null,
        completed_at: form.completed_at || null,
      })
      .eq('id', issue.id)
    setLoading(false)
    if (!error) {
      setEditing(false)
      router.refresh()
    }
  }

  async function handleDelete() {
    const supabase = createClient()
    const { error } = await supabase.from('issues').update({ deleted_at: new Date().toISOString() }).eq('id', issue.id)
    if (!error) router.push(`/projects/${projectId}`)
  }

  const id = issueId(prefix, issue.category, issue.number)

  return (
    <>
      <div className="bg-white border border-[#dcdee0] rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {id && (
              <span className="font-mono text-xs text-[#999999] mb-1 block">{id}</span>
            )}
            <h1 className="text-xl font-semibold text-[#171717] leading-snug">{issue.title}</h1>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 text-sm font-medium text-[#60646c] hover:text-[#171717] border border-[#dcdee0] rounded-lg px-3 py-1.5 transition-colors"
          >
            수정
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm">
          <div>
            <span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">상태</span>
            <StatusBadge status={issue.status} />
          </div>
          <div>
            <span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">우선순위</span>
            <PriorityBadge priority={issue.priority} />
          </div>
          <div>
            <span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">카테고리</span>
            <span className="text-[#171717]">{issue.category ?? '-'}</span>
          </div>
          <div>
            <span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">담당자</span>
            <span className="text-[#171717]">{issue.assignee?.name ?? '-'}</span>
          </div>
          <div>
            <span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">요청자</span>
            <span className="text-[#171717]">{issue.requester?.name ?? '-'}</span>
          </div>
          <div>
            <span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">계획 완료일</span>
            <span className="text-[#171717]">{issue.planned_at ?? '-'}</span>
          </div>
          <div>
            <span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">실제 완료일</span>
            <span className="text-[#171717]">{issue.completed_at ?? '-'}</span>
          </div>
        </div>

        {issue.description ? (
          <div className="border-t border-[#f0f0f3] pt-5">
            <span className="text-[#999999] block mb-2 text-xs uppercase tracking-wide font-medium">설명</span>
            <p className="text-sm text-[#171717] whitespace-pre-wrap leading-relaxed">{issue.description}</p>
          </div>
        ) : (
          <div className="border-t border-[#f0f0f3] pt-5">
            <p className="text-sm text-[#cccccc]">설명 없음</p>
          </div>
        )}

        <div className="border-t border-[#f0f0f3] pt-5 mt-5 flex justify-end">
          <button
            onClick={() => setDeleteConfirm(true)}
            className="text-sm font-medium text-[#ef4444] hover:text-[#dc2626] transition-colors"
          >
            이슈 삭제
          </button>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-[#171717] mb-5">이슈 수정</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>카테고리</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={selectCls}>
                    {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>제목 *</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required autoFocus className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>설명</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>상태</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={selectCls}>
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>우선순위</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={selectCls}>
                    {PRIORITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>담당자</label>
                  <select value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))} className={selectCls}>
                    <option value="">미지정</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>계획 완료일</label>
                  <input type="date" value={form.planned_at} onChange={e => setForm(f => ({ ...f, planned_at: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>실제 완료일</label>
                <input type="date" value={form.completed_at} onChange={e => setForm(f => ({ ...f, completed_at: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors">취소</button>
                <button type="submit" disabled={loading} className="bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors">
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-[#171717] mb-2">이슈 삭제</h2>
            <p className="text-sm text-[#60646c] mb-5">
              <span className="font-medium text-[#171717]">{issue.title}</span>을(를) 휴지통으로 이동합니다. 30일 이내 복구 가능합니다.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(false)} className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors">취소</button>
              <button onClick={handleDelete} className="bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
