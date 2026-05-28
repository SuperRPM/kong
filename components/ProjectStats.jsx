'use client'

import { useMemo } from 'react'
import { STATUS_OPTIONS } from './StatusBadge'

const STATUS_COLORS = {
  todo: 'bg-[#aaaaaa]',
  in_progress: 'bg-[#0d74ce]',
  review: 'bg-[#f59e0b]',
  done: 'bg-[#22c55e]',
}

const CATEGORY_COLORS = ['bg-[#8b5cf6]', 'bg-[#ec4899]', 'bg-[#f97316]']

function StatBar({ label, count, total, colorCls }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[#60646c]">{label}</span>
        <span className="text-sm font-medium text-[#171717]">
          {count}건 <span className="text-xs text-[#999999]">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-[#f0f0f3] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colorCls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-[#dcdee0] rounded-xl p-5 text-center">
      <p className="text-3xl font-bold text-[#171717]">{value}</p>
      <p className="text-sm text-[#60646c] mt-1">{label}</p>
      {sub && <p className="text-xs text-[#999999] mt-0.5">{sub}</p>}
    </div>
  )
}

export default function ProjectStats({ issues, categories = [] }) {
  const stats = useMemo(() => {
    const categoryLabelMap = Object.fromEntries(categories.map(c => [c.value, `${c.value} — ${c.label}`]))
    const activeIssues = issues.filter(i => i.status !== 'cancelled')
    const total = activeIssues.length
    const today = new Date().toISOString().split('T')[0]

    const byStatus = STATUS_OPTIONS.filter(opt => opt.value !== 'cancelled').map(opt => ({
      ...opt,
      count: activeIssues.filter(i => i.status === opt.value).length,
    }))

    const done = byStatus.find(s => s.value === 'done')?.count ?? 0
    const inProgress = byStatus.find(s => s.value === 'in_progress')?.count ?? 0
    const overdue = activeIssues.filter(i => i.planned_at && i.planned_at < today && i.status !== 'done').length

    const usedCats = [...new Set(activeIssues.map(i => i.category).filter(Boolean))].sort()
    const byCategory = usedCats.map(cat => ({
      label: categoryLabelMap[cat] ?? cat,
      count: activeIssues.filter(i => i.category === cat).length,
    }))

    const assigneeMap = {}
    activeIssues.forEach(i => {
      const name = i.assignee?.name ?? '미지정'
      assigneeMap[name] = (assigneeMap[name] ?? 0) + 1
    })
    const byAssignee = Object.entries(assigneeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }))

    return { total, done, inProgress, overdue, byStatus, byCategory, byAssignee }
  }, [issues, categories])

  const doneRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="전체 이슈" value={stats.total} />
        <SummaryCard label="완료" value={stats.done} sub={`${doneRate}%`} />
        <SummaryCard label="진행 중" value={stats.inProgress} />
        <SummaryCard label="기한 초과" value={stats.overdue} sub="미완료" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#dcdee0] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#171717] mb-4">상태별</h3>
          {stats.byStatus.map(s => (
            <StatBar key={s.value} label={s.label} count={s.count} total={stats.total} colorCls={STATUS_COLORS[s.value] ?? 'bg-[#aaaaaa]'} />
          ))}
        </div>

        <div className="bg-white border border-[#dcdee0] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#171717] mb-4">카테고리별</h3>
          {stats.byCategory.length === 0 ? (
            <p className="text-sm text-[#cccccc]">데이터 없음</p>
          ) : stats.byCategory.map((s, i) => (
            <StatBar key={s.label} label={s.label} count={s.count} total={stats.total} colorCls={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
          ))}
        </div>

        <div className="bg-white border border-[#dcdee0] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#171717] mb-4">담당자별</h3>
          {stats.byAssignee.length === 0 ? (
            <p className="text-sm text-[#cccccc]">데이터 없음</p>
          ) : stats.byAssignee.map(s => (
            <StatBar key={s.label} label={s.label} count={s.count} total={stats.total} colorCls="bg-[#0d74ce]" />
          ))}
        </div>
      </div>
    </div>
  )
}
