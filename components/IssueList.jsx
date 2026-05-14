'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge, PriorityBadge, STATUS_OPTIONS } from './StatusBadge'

function issueId(prefix, category, number) {
  if (!category || !number) return null
  return `${prefix}-${category}-${String(number).padStart(3, '0')}`
}

export default function IssueList({ projectId, projectPrefix, initialIssues, members }) {
  const router = useRouter()
  const [issues, setIssues] = useState(initialIssues)
  const [activeCategory, setActiveCategory] = useState('전체')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = useMemo(() => {
    const cats = [...new Set(issues.map(i => i.category).filter(Boolean))].sort()
    return ['전체', ...cats]
  }, [issues])

  const filtered = useMemo(() => {
    let list = activeCategory === '전체' ? issues : issues.filter(i => i.category === activeCategory)
    if (filterStatus) list = list.filter(i => i.status === filterStatus)
    if (filterAssignee) list = list.filter(i => i.assignee_id === filterAssignee)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(i => {
        const id = issueId(projectPrefix, i.category, i.number) ?? ''
        return i.title.toLowerCase().includes(q) || id.toLowerCase().includes(q)
      })
    }
    return list
  }, [issues, activeCategory, filterStatus, filterAssignee, searchQuery, projectPrefix])

  async function handleStatusChange(issue, newStatus) {
    const supabase = createClient()
    const updates = { status: newStatus }
    if (newStatus === 'done' && !issue.completed_at) {
      updates.completed_at = new Date().toISOString().split('T')[0]
    }
    const { data } = await supabase
      .from('issues').update(updates).eq('id', issue.id)
      .select('id, title, status, priority, category, number, planned_at, completed_at, assignee_id, assignee:assignee_id(name), requester:created_by(name)')
      .single()
    if (data) setIssues(prev => prev.map(i => i.id === data.id ? data : i))
  }

  const selectCls = 'text-sm bg-white border border-[#dcdee0] rounded-lg px-3 py-1.5 text-[#60646c] focus:outline-none focus:ring-1 focus:ring-[#171717]'

  return (
    <>
      {categories.length > 1 && (
        <div className="flex items-center gap-1 mb-4 border-b border-[#f0f0f3] overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeCategory === cat
                  ? 'border-[#171717] text-[#171717]'
                  : 'border-transparent text-[#60646c] hover:text-[#171717]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="제목 / ID 검색..."
            className="text-sm bg-white border border-[#dcdee0] rounded-lg px-3 py-1.5 text-[#171717] placeholder:text-[#cccccc] focus:outline-none focus:ring-1 focus:ring-[#171717] w-44"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">전체 상태</option>
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          {members.length > 0 && (
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className={selectCls}>
              <option value="">전체 담당자</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
          <span className="text-sm text-[#999999]">{filtered.length}개</span>
        </div>
        <Link
          href={`/projects/${projectId}/issues/new`}
          className="bg-[#000000] hover:bg-[#1a1a1a] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors shrink-0"
        >
          + 새 이슈
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#999999] text-sm">
          {searchQuery ? `“${searchQuery}” 검색 결과가 없습니다.` : '이슈가 없습니다.'}
        </div>
      ) : (
        <>
          {/* 데스크톱 테이블 */}
          <div className="hidden md:block bg-white border border-[#dcdee0] rounded-xl overflow-hidden">
            <div className="flex items-center px-4 py-2 bg-[#fafafa] border-b border-[#f0f0f3] gap-3">
              <span className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">ID</span>
              <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">제목</span>
              <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">상태</span>
              <span className="w-14 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">우선</span>
              <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">담당자</span>
              <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">요청자</span>
              <span className="w-24 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">계획완료일</span>
              <span className="w-24 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">완료일</span>
              <span className="w-28 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">상태변경</span>
            </div>
            <div className="divide-y divide-[#f0f0f3]">
              {filtered.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
                  className="flex items-center px-4 py-3 hover:bg-[#fafafa] gap-3 transition-colors cursor-pointer"
                >
                  <span className="w-28 shrink-0 font-mono text-xs text-[#60646c]">
                    {issueId(projectPrefix, issue.category, issue.number) ?? <span className="text-[#cccccc]">-</span>}
                  </span>
                  <span className="flex-1 min-w-0 text-sm text-[#171717] truncate">{issue.title}</span>
                  <div className="w-20 shrink-0"><StatusBadge status={issue.status} /></div>
                  <div className="w-14 shrink-0"><PriorityBadge priority={issue.priority} /></div>
                  <span className="w-20 shrink-0 text-xs text-[#60646c] truncate">{issue.assignee?.name ?? '-'}</span>
                  <span className="w-20 shrink-0 text-xs text-[#60646c] truncate">{issue.requester?.name ?? '-'}</span>
                  <span className="w-24 shrink-0 text-xs text-[#60646c]">{issue.planned_at ?? '-'}</span>
                  <span className="w-24 shrink-0 text-xs text-[#60646c]">{issue.completed_at ?? '-'}</span>
                  <select
                    value={issue.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); handleStatusChange(issue, e.target.value) }}
                    className="w-28 shrink-0 text-xs bg-white border border-[#dcdee0] rounded px-2 py-1 text-[#60646c] focus:outline-none focus:ring-1 focus:ring-[#171717]"
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* 모바일 카드 */}
          <div className="md:hidden bg-white border border-[#dcdee0] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#f0f0f3]">
              {filtered.map(issue => {
                const id = issueId(projectPrefix, issue.category, issue.number)
                return (
                  <div
                    key={issue.id}
                    onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
                    className="p-4 cursor-pointer active:bg-[#fafafa]"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        {id && <span className="font-mono text-xs text-[#999999] block mb-0.5">{id}</span>}
                        <p className="text-sm font-medium text-[#171717] leading-snug">{issue.title}</p>
                      </div>
                      <PriorityBadge priority={issue.priority} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <StatusBadge status={issue.status} />
                      {issue.assignee?.name && (
                        <span className="text-xs text-[#60646c]">· {issue.assignee.name}</span>
                      )}
                      {issue.planned_at && (
                        <span className="text-xs text-[#999999]">· {issue.planned_at}</span>
                      )}
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <select
                        value={issue.status}
                        onChange={e => { e.stopPropagation(); handleStatusChange(issue, e.target.value) }}
                        className="text-xs bg-white border border-[#dcdee0] rounded-lg px-3 py-1.5 text-[#60646c] focus:outline-none"
                      >
                        {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
