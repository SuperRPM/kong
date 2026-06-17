'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge, PriorityBadge, STATUS_OPTIONS, PRIORITY_OPTIONS } from './StatusBadge'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const inputCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]'
const selectCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]'
const labelCls = 'block text-sm font-medium text-[#171717] mb-1'

function formatIssueId(prefix, category, number) {
  if (!category || !number) return null
  return `${prefix}-${category}-${String(number).padStart(3, '0')}`
}

function formatSubIssueId(prefix, parentCategory, parentNumber, subNumber) {
  if (!parentCategory || !parentNumber || !subNumber) return null
  return `${prefix}-${parentCategory}-${String(parentNumber).padStart(3, '0')}-${subNumber}`
}

function SubIssuesSection({ projectId, parentId, projectPrefix, parentCategory, parentNumber, initialSubIssues }) {
  return (
    <div className="mt-6 bg-white border border-[#dcdee0] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#171717]">
          하위이슈{initialSubIssues.length > 0 ? ` (${initialSubIssues.length})` : ''}
        </h2>
        <Link
          href={`/projects/${projectId}/issues/new?parent=${parentId}&ref=${encodeURIComponent(`/projects/${projectId}/issues/${parentId}`)}`}
          className="text-xs font-medium text-[#0d74ce] hover:text-[#0b63b0] transition-colors"
        >
          + 하위이슈
        </Link>
      </div>
      {initialSubIssues.length === 0 ? (
        <p className="text-sm text-[#cccccc]">하위이슈가 없습니다.</p>
      ) : (
        <div className="divide-y divide-[#f0f0f3] border border-[#f0f0f3] rounded-lg overflow-hidden">
          {initialSubIssues.map(sub => {
            const subId = formatSubIssueId(projectPrefix, parentCategory, parentNumber, sub.sub_number)
            const isCancelled = sub.status === 'cancelled'
            return (
              <Link
                key={sub.id}
                href={`/projects/${projectId}/issues/${sub.id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors ${isCancelled ? 'opacity-60' : ''}`}
              >
                <span className="font-mono text-xs text-[#60646c] w-32 shrink-0">{subId ?? '-'}</span>
                <span className={`flex-1 min-w-0 text-sm truncate ${isCancelled ? 'line-through text-[#aaaaaa]' : 'text-[#171717]'}`}>{sub.title}</span>
                <div className="shrink-0"><StatusBadge status={sub.status} /></div>
                <div className="shrink-0"><PriorityBadge priority={sub.priority} /></div>
                <span className="w-20 shrink-0 text-xs text-[#60646c] truncate text-right">{sub.assignee?.name ?? '-'}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getPublicUrl(filePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/issue-images/${filePath}`
}

function describeActivity(log) {
  const actor = log.actor?.name ?? '알 수 없음'
  const statusLabel = v => STATUS_OPTIONS.find(o => o.value === v)?.label ?? v ?? '-'
  const priorityLabel = v => PRIORITY_OPTIONS.find(o => o.value === v)?.label ?? v ?? '-'
  switch (log.action) {
    case 'status_changed':
      return `${actor}이(가) 상태를 “${statusLabel(log.old_value)}” → “${statusLabel(log.new_value)}”로 변경`
    case 'priority_changed':
      return `${actor}이(가) 우선순위를 “${priorityLabel(log.old_value)}” → “${priorityLabel(log.new_value)}”로 변경`
    case 'assignee_changed':
      return `${actor}이(가) 담당자를 “${log.old_value ?? '미지정'}” → “${log.new_value ?? '미지정'}”로 변경`
    case 'title_changed':
      return `${actor}이(가) 제목을 “${log.new_value}”로 변경`
    case 'category_changed':
      return `${actor}이(가) 카테고리를 “${log.old_value}” → “${log.new_value}”로 변경`
    default:
      return `${actor}이(가) 이슈를 수정`
  }
}

function ImagesSection({ issueId, initialAttachments, currentUserId }) {
  const [attachments, setAttachments] = useState(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const fileInputRef = useRef(null)

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('10MB 이하 이미지만 첨부 가능합니다.')
      return
    }
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filePath = `${issueId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage.from('issue-images').upload(filePath, file)
    if (uploadError) { setUploading(false); e.target.value = ''; return }
    const { data, error: dbError } = await supabase
      .from('issue_attachments')
      .insert({ issue_id: issueId, uploaded_by: currentUserId, file_path: filePath, file_name: file.name, file_size: file.size, mime_type: file.type })
      .select('id, file_path, file_name, file_size, uploaded_by, created_at')
      .single()
    setUploading(false)
    e.target.value = ''
    if (!dbError && data) setAttachments(prev => [...prev, data])
  }

  async function handleDelete(att) {
    const supabase = createClient()
    await supabase.storage.from('issue-images').remove([att.file_path])
    const { error } = await supabase.from('issue_attachments').delete().eq('id', att.id)
    if (!error) {
      setAttachments(prev => prev.filter(a => a.id !== att.id))
      if (lightbox === getPublicUrl(att.file_path)) setLightbox(null)
    }
  }

  return (
    <div className="mt-6 bg-white border border-[#dcdee0] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#171717]">
          이미지{attachments.length > 0 ? ` (${attachments.length})` : ''}
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs font-medium text-[#0d74ce] hover:text-[#0b63b0] disabled:text-[#cccccc] transition-colors"
        >
          {uploading ? '업로드 중...' : '+ 이미지 추가'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-[#cccccc]">첨부된 이미지가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {attachments.map(att => {
            const url = getPublicUrl(att.file_path)
            return (
              <div key={att.id} className="relative group aspect-square rounded-lg overflow-hidden bg-[#f0f0f3] border border-[#dcdee0]">
                <img
                  src={url}
                  alt={att.file_name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightbox(url)}
                />
                {att.uploaded_by === currentUserId && (
                  <button
                    onClick={() => handleDelete(att)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full items-center justify-center hidden group-hover:flex transition-all"
                    aria-label="삭제"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1l-8 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-lg transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

function renderCommentBody(text) {
  return text.split(/(@[^\s@]+)/g).map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-[#0d74ce] font-medium">{part}</span>
      : part
  )
}

function CommentsSection({ issueId, initialComments, currentUserId, members = [] }) {
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mention, setMention] = useState(null) // { query, start } | null
  const [mentionIndex, setMentionIndex] = useState(0)
  const textareaRef = useRef(null)

  const mentionMatches = mention
    ? members.filter(m => m.name.includes(mention.query)).slice(0, 6)
    : []

  function handleBodyChange(e) {
    const val = e.target.value
    setBody(val)
    const before = val.slice(0, e.target.selectionStart)
    const match = before.match(/@([^\s@]*)$/)
    if (match) {
      setMention({ query: match[1], start: match.index })
      setMentionIndex(0)
    } else {
      setMention(null)
    }
  }

  function insertMention(member) {
    const cursor = textareaRef.current?.selectionStart ?? body.length
    const before = body.slice(0, mention.start)
    const after = body.slice(cursor)
    const next = `${before}@${member.name} ${after}`
    setBody(next)
    setMention(null)
    const pos = before.length + member.name.length + 2
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(pos, pos)
    }, 0)
  }

  function handleKeyDown(e) {
    if (!mention || mentionMatches.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionMatches.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionMatches[mentionIndex]) }
    else if (e.key === 'Escape') setMention(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('issue_comments')
      .insert({ issue_id: issueId, author_id: currentUserId, body: body.trim() })
      .select('id, body, created_at, author_id, author:author_id(name)')
      .single()
    if (!error && data) {
      setComments(c => [...c, data])
      // 멘션된 사용자에게 알림 전송
      const mentionedNames = [...body.matchAll(/@([^\s@]+)/g)].map(m => m[1])
      const targets = members.filter(m => mentionedNames.includes(m.name) && m.id !== currentUserId)
      if (targets.length > 0) {
        await supabase.from('notifications').insert(
          targets.map(m => ({
            recipient_id: m.id,
            issue_id: issueId,
            type: 'mention',
            message: `댓글에서 회원님이 멘션되었습니다.`,
          }))
        )
      }
      setBody('')
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId) {
    const supabase = createClient()
    const { error } = await supabase.from('issue_comments').update({ deleted_at: new Date().toISOString() }).eq('id', commentId)
    if (!error) setComments(c => c.filter(x => x.id !== commentId))
  }

  return (
    <div className="mt-6 bg-white border border-[#dcdee0] rounded-xl p-6">
      <h2 className="text-sm font-semibold text-[#171717] mb-4">
        댓글{comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>
      {comments.length > 0 && (
        <div className="space-y-3 mb-5">
          {comments.map(c => (
            <div key={c.id} className="bg-[#f9f9fb] border border-[#f0f0f3] rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#171717]">{c.author?.name ?? '알 수 없음'}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#aaaaaa]">{formatDate(c.created_at)}</span>
                  {c.author_id === currentUserId && (
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-[#aaaaaa] hover:text-[#ef4444] transition-colors">삭제</button>
                  )}
                </div>
              </div>
              <p className="text-sm text-[#171717] whitespace-pre-wrap leading-relaxed">{renderCommentBody(c.body)}</p>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleBodyChange}
            onKeyDown={handleKeyDown}
            placeholder="댓글을 입력하세요... (@이름으로 멘션)"
            rows={3}
            className={`${inputCls} resize-none`}
          />
          {mention && mentionMatches.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-44 bg-white border border-[#dcdee0] rounded-lg shadow-lg overflow-hidden z-10">
              {mentionMatches.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); insertMention(m) }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    i === mentionIndex ? 'bg-[#f0f0f3] text-[#171717]' : 'text-[#60646c] hover:bg-[#fafafa]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={submitting || !body.trim()} className="bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {submitting ? '등록 중...' : '댓글 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ActivityLog({ logs }) {
  if (!logs || logs.length === 0) return null
  return (
    <div className="mt-6 bg-white border border-[#dcdee0] rounded-xl p-6">
      <h2 className="text-sm font-semibold text-[#171717] mb-4">활동 이력</h2>
      <div className="space-y-2.5">
        {logs.map(log => (
          <div key={log.id} className="flex items-start gap-3 text-xs">
            <span className="text-[#aaaaaa] shrink-0 tabular-nums mt-0.5">{formatDate(log.created_at)}</span>
            <span className="text-[#60646c]">{describeActivity(log)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function IssueDetailClient({ issue, members, projectId, initialComments, currentUserId, isAdmin, categories = [], activityLogs, initialAttachments, initialSubIssues = [], returnHref }) {
  const router = useRouter()
  const backHref = returnHref ?? `/projects/${projectId}`
  const [editing, setEditing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const prefix = issue.project?.prefix ?? 'REQ'
  const [form, setForm] = useState({
    title: issue.title,
    description: issue.description ?? '',
    status: issue.status,
    priority: issue.priority,
    assignee_id: issue.assignee_id ?? '',
    created_by: issue.created_by ?? '',
    category: issue.category ?? '',
    planned_at: issue.planned_at ?? '',
    completed_at: issue.completed_at ?? '',
  })

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    const supabase = createClient()
    const updates = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      assignee_id: form.assignee_id || null,
      category: form.category || null,
      planned_at: form.planned_at || null,
      completed_at: form.completed_at || null,
    }
    const wasClosed = issue.status === 'done' || issue.status === 'cancelled'
    const isNowClosed = form.status === 'done' || form.status === 'cancelled'
    if (isNowClosed && !wasClosed && !form.completed_at) {
      updates.completed_at = new Date().toISOString().split('T')[0]
    } else if (!isNowClosed && wasClosed) {
      updates.completed_at = null
    }
    if (isAdmin) updates.created_by = form.created_by || null
    const { error } = await supabase.from('issues').update(updates).eq('id', issue.id)
    setLoading(false)
    if (!error) { setEditing(false); router.refresh() }
  }

  async function handleDelete() {
    setLoadingDelete(true)
    setDeleteError(null)
    const supabase = createClient()
    const { error } = await supabase.from('issues').update({ deleted_at: new Date().toISOString() }).eq('id', issue.id)
    setLoadingDelete(false)
    if (error) { setDeleteError(error.message); return }
    router.push(backHref)
  }

  const isChild = !!issue.parent_issue_id
  const id = isChild
    ? formatSubIssueId(prefix, issue.parent?.category, issue.parent?.number, issue.sub_number)
    : formatIssueId(prefix, issue.category, issue.number)
  const parentId = issue.parent
    ? formatIssueId(prefix, issue.parent.category, issue.parent.number)
    : null

  return (
    <>
      <div className="bg-white border border-[#dcdee0] rounded-xl p-6">
        {isChild && issue.parent && (
          <div className="mb-4 pb-3 border-b border-[#f0f0f3]">
            <Link
              href={`/projects/${projectId}/issues/${issue.parent.id}`}
              className="text-xs text-[#0d74ce] hover:underline inline-flex items-center gap-1"
            >
              ↑ 부모: {parentId} · {issue.parent.title}
            </Link>
          </div>
        )}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {id && <span className="font-mono text-xs text-[#999999] mb-1 block">{id}</span>}
            <h1 className={`text-xl font-semibold leading-snug ${issue.status === 'cancelled' ? 'line-through text-[#aaaaaa]' : 'text-[#171717]'}`}>{issue.title}</h1>
          </div>
          <button onClick={() => setEditing(true)} className="shrink-0 text-sm font-medium text-[#60646c] hover:text-[#171717] border border-[#dcdee0] rounded-lg px-3 py-1.5 transition-colors">수정</button>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm">
          <div><span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">상태</span><StatusBadge status={issue.status} /></div>
          <div><span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">우선순위</span><PriorityBadge priority={issue.priority} /></div>
          <div><span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">카테고리</span><span className="text-[#171717]">{issue.category ?? '-'}</span></div>
          <div><span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">담당자</span><span className="text-[#171717]">{issue.assignee?.name ?? '-'}</span></div>
          <div><span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">요청자</span><span className="text-[#171717]">{issue.requester?.name ?? '-'}</span></div>
          <div><span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">계획 완료일</span><span className="text-[#171717]">{issue.planned_at ?? '-'}</span></div>
          <div><span className="text-[#999999] block mb-1 text-xs uppercase tracking-wide font-medium">실제 완료일</span><span className="text-[#171717]">{issue.completed_at ?? '-'}</span></div>
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
          <button onClick={() => setDeleteConfirm(true)} className="text-sm font-medium text-[#ef4444] hover:text-[#dc2626] transition-colors">이슈 삭제</button>
        </div>
      </div>

      {!isChild && (
        <SubIssuesSection
          projectId={projectId}
          parentId={issue.id}
          projectPrefix={prefix}
          parentCategory={issue.category}
          parentNumber={issue.number}
          initialSubIssues={initialSubIssues}
        />
      )}
      <ImagesSection issueId={issue.id} initialAttachments={initialAttachments} currentUserId={currentUserId} />
      <CommentsSection issueId={issue.id} initialComments={initialComments} currentUserId={currentUserId} members={members} />
      <ActivityLog logs={activityLogs} />

      {editing && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-[#171717] mb-5">이슈 수정</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>카테고리</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={selectCls}>
                    <option value="">없음</option>
                    {categories.map(opt => <option key={opt.value} value={opt.value}>{opt.value} — {opt.label}</option>)}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>담당자</label>
                  <select value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))} className={selectCls}>
                    <option value="">미지정</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                {isAdmin && (
                  <div>
                    <label className={labelCls}>요청자</label>
                    <select value={form.created_by} onChange={e => setForm(f => ({ ...f, created_by: e.target.value }))} className={selectCls}>
                      <option value="">미지정</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>계획 완료일</label>
                  <input type="date" value={form.planned_at} onChange={e => setForm(f => ({ ...f, planned_at: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>실제 완료일</label>
                  <input type="date" value={form.completed_at} onChange={e => setForm(f => ({ ...f, completed_at: e.target.value }))} className={inputCls} />
                </div>
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
            {deleteError && <p className="text-sm text-[#ef4444] mb-4">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(false)} disabled={loadingDelete} className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors disabled:opacity-50">취소</button>
              <button onClick={handleDelete} disabled={loadingDelete} className="bg-[#ef4444] hover:bg-[#dc2626] disabled:bg-[#cccccc] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors">
                {loadingDelete ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
