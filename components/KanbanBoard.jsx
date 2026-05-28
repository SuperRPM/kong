'use client'

import { useState, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PriorityBadge, StatusBadge, STATUS_OPTIONS } from './StatusBadge'

function fmtId(prefix, category, number) {
  if (!category || !number) return null
  return `${prefix}-${category}-${String(number).padStart(3, '0')}`
}

const COL_TOP_BORDER = {
  todo: 'border-[#aaaaaa]',
  in_progress: 'border-[#0d74ce]',
  review: 'border-[#f59e0b]',
  done: 'border-[#22c55e]',
}

const COL_HEADER_COLOR = {
  todo: 'text-[#60646c]',
  in_progress: 'text-[#0d74ce]',
  review: 'text-[#d97706]',
  done: 'text-[#16a34a]',
}

export default function KanbanBoard({ projectId, projectPrefix, initialIssues, categories = [] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [issues, setIssues] = useState(initialIssues)
  const [draggingId, setDraggingId] = useState(null)
  const [overColumn, setOverColumn] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('kcat') ?? 'all')

  function updateCategoryFilter(value) {
    setCategoryFilter(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('kcat', value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  // 칸반에는 부모 이슈만 표시 + 취소 이슈는 숨김 (자식은 호버 미리보기로만 노출)
  const parents = useMemo(
    () => issues.filter(i => !i.parent_issue_id && i.status !== 'cancelled'),
    [issues],
  )
  const childrenByParent = useMemo(() => {
    const map = {}
    issues.forEach(i => {
      if (i.parent_issue_id) {
        if (!map[i.parent_issue_id]) map[i.parent_issue_id] = []
        map[i.parent_issue_id].push(i)
      }
    })
    Object.values(map).forEach(arr => arr.sort((a, b) => (a.sub_number ?? 0) - (b.sub_number ?? 0)))
    return map
  }, [issues])

  const filtered = categoryFilter === 'all' ? parents : parents.filter(i => i.category === categoryFilter)

  const columns = STATUS_OPTIONS.filter(opt => opt.value !== 'cancelled').map(opt => ({
    ...opt,
    issues: filtered.filter(i => i.status === opt.value),
  }))

  async function handleDrop(issueId, newStatus) {
    const issue = issues.find(i => i.id === issueId)
    if (!issue || issue.status === newStatus) return

    const updates = { status: newStatus }
    const newClosed = newStatus === 'done' || newStatus === 'cancelled'
    const oldClosed = issue.status === 'done' || issue.status === 'cancelled'
    if (newClosed && !oldClosed) {
      updates.completed_at = new Date().toISOString().split('T')[0]
    } else if (oldClosed && !newClosed) {
      updates.completed_at = null
    }

    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, ...updates } : i))

    const supabase = createClient()
    const { error } = await supabase.from('issues').update(updates).eq('id', issueId)
    if (error) {
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: issue.status, completed_at: issue.completed_at } : i))
    } else {
      router.refresh()
    }
  }

  return (
    <div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => updateCategoryFilter('all')}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              categoryFilter === 'all'
                ? 'bg-[#171717] text-white border-[#171717]'
                : 'bg-white text-[#60646c] border-[#dcdee0] hover:border-[#171717]'
            }`}
          >
            전체
          </button>
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => updateCategoryFilter(cat.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                categoryFilter === cat.value
                  ? 'bg-[#171717] text-white border-[#171717]'
                  : 'bg-white text-[#60646c] border-[#dcdee0] hover:border-[#171717]'
              }`}
            >
              {cat.value}
            </button>
          ))}
        </div>
      )}
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
      {columns.map(col => (
        <div
          key={col.value}
          onDragOver={e => { e.preventDefault(); setOverColumn(col.value) }}
          onDragLeave={e => {
            if (!e.currentTarget.contains(e.relatedTarget)) setOverColumn(null)
          }}
          onDrop={e => {
            e.preventDefault()
            const id = draggingId
            setOverColumn(null)
            setDraggingId(null)
            if (id) handleDrop(id, col.value)
          }}
          className={`flex-1 min-w-[200px] max-w-[280px] border-t-2 rounded-xl transition-colors ${
            overColumn === col.value ? 'bg-[#f0f0f3]' : 'bg-[#fafafa]'
          } ${COL_TOP_BORDER[col.value]}`}
        >
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wide ${COL_HEADER_COLOR[col.value]}`}>
                {col.label}
              </span>
              <span className="text-xs text-[#999999] font-medium">{col.issues.length}</span>
            </div>
            <Link
              href={`/projects/${projectId}/issues/new?status=${col.value}`}
              className="text-xs text-[#999999] hover:text-[#171717] font-medium px-1.5 -mr-1 rounded transition-colors"
              title="이 상태로 새 이슈"
            >
              +
            </Link>
          </div>

          <div className="px-3 pb-3 space-y-2 min-h-[80px]">
            {col.issues.map(issue => {
              const id = fmtId(projectPrefix, issue.category, issue.number)
              const allSubs = childrenByParent[issue.id] ?? []
              const subs = allSubs.filter(s => s.status !== 'cancelled')
              const doneCount = subs.filter(s => s.status === 'done').length
              return (
                <div
                  key={issue.id}
                  draggable
                  onDragStart={e => {
                    setDraggingId(issue.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => { setDraggingId(null); setOverColumn(null) }}
                  onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
                  className={`group relative bg-white border border-[#dcdee0] rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all select-none ${
                    draggingId === issue.id ? 'opacity-40 scale-95' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    {id && <span className="font-mono text-[10px] text-[#999999]">{id}</span>}
                    {subs.length > 0 && (
                      <span className="text-[10px] font-semibold text-[#0d74ce] bg-[#eff6ff] px-1.5 py-0.5 rounded">
                        {doneCount}/{subs.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#171717] leading-snug mb-2 line-clamp-2">{issue.title}</p>
                  <div className="flex items-center justify-between gap-2">
                    <PriorityBadge priority={issue.priority} />
                    {issue.assignee?.name && (
                      <span className="text-xs text-[#999999] truncate">{issue.assignee.name}</span>
                    )}
                  </div>

                  {subs.length > 0 && (
                    <div className="hidden group-hover:block absolute left-full top-0 ml-2 w-64 bg-white border border-[#dcdee0] rounded-lg shadow-xl p-2 z-20">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#aaaaaa] px-2 py-1">
                        하위이슈 {doneCount}/{subs.length}
                      </p>
                      <div className="space-y-1 max-h-72 overflow-y-auto">
                        {subs.map(sub => (
                          <div key={sub.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#fafafa]">
                            <span className="font-mono text-[10px] text-[#999999] shrink-0">-{sub.sub_number}</span>
                            <span className="flex-1 min-w-0 text-xs text-[#171717] truncate">{sub.title}</span>
                            <div className="shrink-0 scale-90 origin-right"><StatusBadge status={sub.status} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
    </div>
  )
}
