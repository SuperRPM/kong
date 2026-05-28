'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from './StatusBadge'

const inputCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]'
const selectCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]'
const labelCls = 'block text-sm font-medium text-[#171717] mb-1'

export default function NewIssueForm({ projectId, projectPrefix, members, categories = [], potentialParents = [], initialParentId = null, initialStatus = 'todo' }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', status: initialStatus, priority: 'medium',
    assignee_id: '', category: categories[0]?.value ?? '', planned_at: '', completed_at: '',
    parent_issue_id: initialParentId ?? '',
  })

  const selectedParent = form.parent_issue_id
    ? potentialParents.find(p => p.id === form.parent_issue_id)
    : null

  const idPreview = selectedParent
    ? `${projectPrefix}-${selectedParent.category}-${String(selectedParent.number).padStart(3, '0')}-#`
    : (form.category ? `${projectPrefix}-${form.category}-###` : '')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('issues')
      .insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        assignee_id: form.assignee_id || null,
        category: form.category || null,
        planned_at: form.planned_at || null,
        completed_at: form.completed_at || null,
        parent_issue_id: form.parent_issue_id || null,
        project_id: projectId,
        created_by: user.id,
      })
      .select('id')
      .single()
    setLoading(false)
    if (!error && data) {
      router.refresh()
      router.push(`/projects/${projectId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#dcdee0] rounded-xl p-6 space-y-4">
      {potentialParents.length > 0 && (
        <div>
          <label className={labelCls}>부모 이슈 (선택 — 하위이슈로 만들 경우)</label>
          <select
            value={form.parent_issue_id}
            onChange={e => setForm(f => ({ ...f, parent_issue_id: e.target.value }))}
            className={selectCls}
          >
            <option value="">없음 (독립 이슈)</option>
            {potentialParents.map(p => (
              <option key={p.id} value={p.id}>
                {p.category && p.number
                  ? `${projectPrefix}-${p.category}-${String(p.number).padStart(3, '0')} · ${p.title}`
                  : p.title}
              </option>
            ))}
          </select>
          {selectedParent && (
            <p className="text-xs text-[#999999] mt-1">하위이슈는 부모 카테고리 prefix를 따릅니다. 자식 카테고리는 독립이며 표시 ID는 부모 기준.</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>카테고리</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={selectCls}>
            <option value="">없음</option>
            {categories.map(opt => <option key={opt.value} value={opt.value}>{opt.value} — {opt.label}</option>)}
          </select>
          {idPreview && <p className="text-xs text-[#999999] mt-1 font-mono">{idPreview}</p>}
        </div>
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
      </div>
      <div>
        <label className={labelCls}>설명</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={4}
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
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors"
        >
          {loading ? '생성 중...' : '이슈 생성'}
        </button>
      </div>
    </form>
  )
}
