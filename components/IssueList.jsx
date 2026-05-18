'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge, PriorityBadge, STATUS_OPTIONS } from './StatusBadge'

function issueId(prefix, category, number) {
  if (!category || !number) return null
  return `${prefix}-${category}-${String(number).padStart(3, '0')}`
}

const STATUS_ORDER = { todo: 0, in_progress: 1, review: 2, done: 3 }
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export default function IssueList({ projectId, projectPrefix, initialIssues, members, searchInputRef: externalSearchRef }) {
  const router = useRouter()
  const internalSearchRef = useRef(null)
  const searchInputRef = externalSearchRef ?? internalSearchRef

  const [issues, setIssues] = useState(initialIssues)
  const [activeCategory, setActiveCategory] = useState('전체')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Sorting state
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkStatus, setBulkStatus] = useState('todo')

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

  const sortedFiltered = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      let aVal, bVal
      if (sortKey === 'status') {
        aVal = STATUS_ORDER[a.status] ?? 99
        bVal = STATUS_ORDER[b.status] ?? 99
      } else if (sortKey === 'priority') {
        aVal = PRIORITY_ORDER[a.priority] ?? 99
        bVal = PRIORITY_ORDER[b.priority] ?? 99
      } else if (sortKey === 'assignee') {
        aVal = a.assignee?.name ?? ''
        bVal = b.assignee?.name ?? ''
      } else if (sortKey === 'planned_at') {
        aVal = a.planned_at ?? ''
        bVal = b.planned_at ?? ''
      } else {
        return 0
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <span className="ml-0.5 text-[#cccccc]">&#x21C5;</span>
    return <span className="ml-0.5">{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  // Bulk selection helpers
  const allVisibleIds = sortedFiltered.map(i => i.id)
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id))
  const someSelected = allVisibleIds.some(id => selectedIds.has(id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allVisibleIds))
    }
  }

  function toggleSelectOne(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkApply() {
    if (selectedIds.size === 0) return
    const supabase = createClient()
    await supabase
      .from('issues')
      .update({ status: bulkStatus })
      .in('id', [...selectedIds])
    setSelectedIds(new Set())
    router.refresh()
  }

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

  const STATUS_KO = { todo: '할 일', in_progress: '진행 중', review: '검토 대기', done: '완료' }
  const PRIORITY_KO = { low: '낙음', medium: '보통', high: '높음' }

  function handleExportCSV() {
    const headers = ['ID', '제목', '상태', '우선순위', '카테고리', '담당자', '요청자', '계획완료일', '완료일']
    const rows = filtered.map(issue => [
      issueId(projectPrefix, issue.category, issue.number) ?? '',
      issue.title,
      STATUS_KO[issue.status] ?? issue.status,
      PRIORITY_KO[issue.priority] ?? issue.priority,
      issue.category ?? '',
      issue.assignee?.name ?? '',
      issue.requester?.name ?? '',
      issue.planned_at ?? '',
      issue.completed_at ?? '',
    ])
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(','))
      .join('\n')
    const bom = '﻿'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'issues_' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectCls = 'text-sm bg-white border border-[#dcdee0] rounded-lg px-3 py-1.5 text-[#60646c] focus:outline-none focus:ring-1 focus:ring-[#171717]'
  const sortHeaderCls = 'cursor-pointer select-none hover:text-[#171717] transition-colors'

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
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={'제목 / ID 검색...'}
            className="text-sm bg-white border border-[#dcdee0] rounded-lg px-3 py-1.5 text-[#171717] placeholder:text-[#cccccc] focus:outline-none focus:ring-1 focus:ring-[#171717] w-44"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">{'전체 상태'}</option>
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          {members.length > 0 && (
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className={selectCls}>
              <option value="">{'전체 담당자'}</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
          <span className="text-sm text-[#999999]">{sortedFiltered.length}{'개'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-[#dcdee0] hover:bg-[#fafafa] text-[#60646c] text-sm font-medium px-[14px] py-[9px] rounded-lg transition-colors"
          >
            CSV {'내보내기'}
          </button>
          <Link
            href={`/projects/${projectId}/issues/new`}
            className="bg-[#000000] hover:bg-[#1a1a1a] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors"
          >
            + {'새 이슈'}
          </Link>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-[#f0f0f3] border border-[#dcdee0] rounded-xl text-sm text-[#171717]">
          <span className="font-medium">{selectedIds.size}{'개 선택됨'}</span>
          <span className="text-[#dcdee0]">|</span>
          <span className="text-[#60646c]">{'상태 일괄 변경:'}</span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className="text-sm bg-white border border-[#dcdee0] rounded-lg px-3 py-1.5 text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#171717]"
          >
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <button
            onClick={handleBulkApply}
            className="bg-[#171717] hover:bg-[#333333] text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            {'적용'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-[#60646c] hover:text-[#171717] transition-colors ml-auto"
          >
            {'취소'}
          </button>
        </div>
      )}

      {sortedFiltered.length === 0 ? (
        <div className="text-center py-20 text-[#999999] text-sm">
          {searchQuery ? `"${searchQuery}" 검색 결과가 없습니다.` : '이슈가 없습니다.'}
        </div>
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden md:block bg-white border border-[#dcdee0] rounded-xl overflow-hidden">
            <div className="flex items-center px-4 py-2 bg-[#fafafa] border-b border-[#f0f0f3] gap-3">
              <div className="w-5 shrink-0">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                  onChange={toggleSelectAll}
                  className="rounded border-[#dcdee0] cursor-pointer"
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <span className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">ID</span>
              <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">{'제목'}</span>
              <button
                onClick={() => handleSort('status')}
                className={`w-20 text-left text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999] ${sortHeaderCls}`}
              >
                {'상태'}<SortIcon col="status" />
              </button>
              <button
                onClick={() => handleSort('priority')}
                className={`w-14 text-left text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999] ${sortHeaderCls}`}
              >
                {'우선'}<SortIcon col="priority" />
              </button>
              <button
                onClick={() => handleSort('assignee')}
                className={`w-20 text-left text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999] ${sortHeaderCls}`}
              >
                {'담당자'}<SortIcon col="assignee" />
              </button>
              <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">{'요청자'}</span>
              <button
                onClick={() => handleSort('planned_at')}
                className={`w-24 text-left text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999] ${sortHeaderCls}`}
              >
                {'계획완료일'}<SortIcon col="planned_at" />
              </button>
              <span className="w-24 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">{'완료일'}</span>
              <span className="w-28 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#999999]">{'상태변경'}</span>
            </div>
            <div className="divide-y divide-[#f0f0f3]">
              {sortedFiltered.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
                  className="flex items-center px-4 py-3 hover:bg-[#fafafa] gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-5 shrink-0" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(issue.id)}
                      onChange={() => toggleSelectOne(issue.id)}
                      className="rounded border-[#dcdee0] cursor-pointer"
                    />
                  </div>
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

          {/* mobile cards */}
          <div className="md:hidden bg-white border border-[#dcdee0] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#f0f0f3]">
              {sortedFiltered.map(issue => {
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
                        <span className="text-xs text-[#60646c]">&#xB7; {issue.assignee.name}</span>
                      )}
                      {issue.planned_at && (
                        <span className="text-xs text-[#999999]">&#xB7; {issue.planned_at}</span>
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
