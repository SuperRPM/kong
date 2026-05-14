'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge, PriorityBadge, STATUS_OPTIONS, PRIORITY_OPTIONS } from './StatusBadge'

const EMPTY_FORM = { title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '' }

const inputCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]'
const selectCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]'
const labelCls = 'block text-sm font-medium text-[#171717] mb-1'

export default function IssueList({ projectId, initialIssues, members }) {
  const [issues, setIssues] = useState(initialIssues)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function openNew() { setForm(EMPTY_FORM); setModal('new') }

  function openEdit(issue) {
    setForm({
      title: issue.title,
      description: issue.description ?? '',
      status: issue.status,
      priority: issue.priority,
      assignee_id: issue.assignee_id ?? '',
    })
    setModal(issue)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    const supabase = createClient()
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      assignee_id: form.assignee_id || null,
    }
    if (modal === 'new') {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('issues')
        .insert({ ...payload, project_id: projectId, created_by: user.id })
        .select('id, title, status, priority, created_at, assignee_id, assignee:assignee_id(name)')
        .single()
      if (!error && data) setIssues(prev => [data, ...prev])
    } else {
      const { data, error } = await supabase
        .from('issues')
        .update(payload)
        .eq('id', modal.id)
        .select('id, title, status, priority, created_at, assignee_id, assignee:assignee_id(name)')
        .single()
      if (!error && data) setIssues(prev => prev.map(i => i.id === data.id ? data : i))
    }
    setLoading(false)
    setModal(null)
  }

  async function handleDelete(id) {
    const supabase = createClient()
    const { error } = await supabase.from('issues').delete().eq('id', id)
    if (!error) setIssues(prev => prev.filter(i => i.id !== id))
    setDeleteConfirm(null)
  }

  async function handleStatusChange(issue, newStatus) {
    const supabase = createClient()
    const { data } = await supabase
      .from('issues')
      .update({ status: newStatus })
      .eq('id', issue.id)
      .select('id, title, status, priority, created_at, assignee_id, assignee:assignee_id(name)')
      .single()
    if (data) setIssues(prev => prev.map(i => i.id === data.id ? data : i))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[#999999]">{issues.length}개의 이슈</span>
        <button
          onClick={openNew}
          className="bg-[#000000] hover:bg-[#1a1a1a] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors"
        >
          + 새 이슈
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-20 text-[#999999] text-sm">
          이슈가 없습니다. 새 이슈를 만들어보세요.
        </div>
      ) : (
        <div className="bg-white border border-[#dcdee0] rounded-xl overflow-hidden">
          <div className="flex items-center px-4 py-2 bg-[#fafafa] border-b border-[#f0f0f3] gap-3">
            <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">제목</span>
            <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">상태</span>
            <span className="w-14 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">우선</span>
            <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">담당자</span>
            <span className="w-28 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">상태변경</span>
            <span className="w-6"></span>
          </div>
          <div className="divide-y divide-[#f0f0f3]">
            {issues.map(issue => (
              <div key={issue.id} className="flex items-center px-4 py-3 hover:bg-[#fafafa] gap-3 transition-colors">
                <button
                  onClick={() => openEdit(issue)}
                  className="flex-1 min-w-0 text-sm text-[#171717] hover:text-[#0d74ce] text-left truncate transition-colors"
                >
                  {issue.title}
                </button>
                <div className="w-20 shrink-0"><StatusBadge status={issue.status} /></div>
                <div className="w-14 shrink-0"><PriorityBadge priority={issue.priority} /></div>
                <span className="w-20 shrink-0 text-xs text-[#60646c] truncate">
                  {issue.assignee?.name ?? '-'}
                </span>
                <select
                  value={issue.status}
                  onChange={e => handleStatusChange(issue, e.target.value)}
                  className="w-28 shrink-0 text-xs bg-white border border-[#dcdee0] rounded px-2 py-1 text-[#60646c] focus:outline-none focus:ring-1 focus:ring-[#171717]"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setDeleteConfirm(issue)}
                  className="w-6 shrink-0 text-xs text-[#cccccc] hover:text-[#ef4444] transition-colors text-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold text-[#171717] mb-5">
              {modal === 'new' ? '새 이슈' : '이슈 수정'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={labelCls}>제목 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>설명</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
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
              <div>
                <label className={labelCls}>담당자</label>
                <select value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))} className={selectCls}>
                  <option value="">미지정</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(null)} className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors">장 취소</button>
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
              <span className="font-medium text-[#171717]">{deleteConfirm.title}</span>을(를) 삭제할까요? 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors">취소</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
