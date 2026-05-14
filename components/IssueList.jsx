'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge, PriorityBadge, STATUS_OPTIONS, PRIORITY_OPTIONS } from './StatusBadge'

const EMPTY_FORM = { title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '' }

export default function IssueList({ projectId, initialIssues, members }) {
  const router = useRouter()
  const [issues, setIssues] = useState(initialIssues)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function openNew() {
    setForm(EMPTY_FORM)
    setModal('new')
  }

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

      if (!error && data) {
        setIssues(prev => [data, ...prev])
      }
    } else {
      const { data, error } = await supabase
        .from('issues')
        .update(payload)
        .eq('id', modal.id)
        .select('id, title, status, priority, created_at, assignee_id, assignee:assignee_id(name)')
        .single()

      if (!error && data) {
        setIssues(prev => prev.map(i => i.id === data.id ? data : i))
      }
    }

    setLoading(false)
    setModal(null)
  }

  async function handleDelete(id) {
    const supabase = createClient()
    const { error } = await supabase.from('issues').delete().eq('id', id)
    if (!error) {
      setIssues(prev => prev.filter(i => i.id !== id))
    }
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
        <span className="text-sm text-gray-500">{issues.length}개의 이슈</span>
        <button
          onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + 새 이슈
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          이슈가 없습니다. 새 이슈를 만들어보세요.
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map(issue => (
            <div
              key={issue.id}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => openEdit(issue)}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
                >
                  {issue.title}
                </button>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                  {issue.assignee?.name && (
                    <span className="text-xs text-gray-500">{issue.assignee.name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={issue.status}
                  onChange={e => handleStatusChange(issue, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setDeleteConfirm(issue)}
                  className="text-xs text-gray-400 hover:text-red-500 px-1"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {modal === 'new' ? '새 이슈' : '이슈 수정'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                <select
                  value={form.assignee_id}
                  onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">미지정</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">이슈 삭제</h2>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">{deleteConfirm.title}</span>을(를) 삭제할까요? 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
