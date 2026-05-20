'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PriorityBadge } from './StatusBadge'

const COLORS = ['#6366f1', '#0d74ce', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4']

function fmtId(prefix, category, number) {
  if (!category || !number) return null
  return `${prefix}-${category}-${String(number).padStart(3, '0')}`
}

export default function AssignBoard({ projectId, project, members, initialIssues }) {
  const [issues, setIssues] = useState(initialIssues)
  const [deferred, setDeferred] = useState(new Set())
  const [draggingId, setDraggingId] = useState(null)
  const [overZone, setOverZone] = useState(null)

  const unassigned = issues.filter(i => !i.assignee_id && !deferred.has(i.id))
  const deferredIssues = issues.filter(i => deferred.has(i.id))

  function getAssigned(memberId) {
    return issues.filter(i => i.assignee_id === memberId)
  }

  async function assignIssue(issueId, memberId) {
    const member = members.find(m => m.id === memberId)
    setIssues(prev => prev.map(i =>
      i.id === issueId ? { ...i, assignee_id: memberId, assignee: { name: member?.name } } : i
    ))
    const supabase = createClient()
    await supabase.from('issues').update({ assignee_id: memberId }).eq('id', issueId)
  }

  function handleDrop(zone) {
    if (!draggingId) return
    if (zone === 'deferred') {
      setDeferred(prev => new Set([...prev, draggingId]))
    } else {
      assignIssue(draggingId, zone)
    }
    setDraggingId(null)
    setOverZone(null)
  }

  const topCard = unassigned[0]

  return (
    <div style={{ height: 'calc(100vh - 57px)' }} className="flex flex-col">
      {/* 헤더 */}
      <div className="border-b border-[#f0f0f3] px-6 py-3 flex items-center gap-3 bg-white shrink-0">
        <Link href={`/projects/${projectId}`} className="text-sm text-[#0d74ce] hover:underline">
          ← {project?.name}
        </Link>
        <span className="text-[#dcdee0]">/</span>
        <span className="text-sm font-semibold text-[#171717]">업무 분배</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs bg-[#f0f0f3] text-[#60646c] px-2.5 py-1 rounded-md font-medium">
            미배정 {unassigned.length}건
          </span>
          {deferred.size > 0 && (
            <span className="text-xs bg-[#fefce8] text-[#ca8a04] px-2.5 py-1 rounded-md font-medium">
              미분류 {deferred.size}건
            </span>
          )}
        </div>
      </div>

      {/* 메인 */}
      <div className="flex-1 flex gap-8 p-6 overflow-auto min-h-0">

        {/* 왼쪽: 카드 더미 */}
        <div className="w-56 shrink-0 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#999999]">미배정 이슈</p>

          {unassigned.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <p className="text-sm text-[#cccccc] text-center">
                {issues.every(i => i.assignee_id) ? '모든 이슈가 배정되었습니다' : '미분류로 이동됨'}
              </p>
            </div>
          ) : (
            <>
              <div className="relative" style={{ height: `${Math.min(unassigned.length - 1, 2) * 10 + 200}px` }}>
                {unassigned.slice(0, 3).reverse().map((issue, idx, arr) => {
                  const isTop = idx === arr.length - 1
                  const stackIdx = arr.length - 1 - idx
                  const issueId = fmtId(project?.prefix, issue.category, issue.number)
                  return (
                    <div
                      key={issue.id}
                      style={{
                        position: 'absolute',
                        top: stackIdx * 10,
                        left: 0,
                        right: 0,
                        transform: `rotate(${(stackIdx - 1) * 1.5}deg)`,
                        zIndex: idx + 1,
                      }}
                      draggable={isTop}
                      onDragStart={isTop ? e => { setDraggingId(issue.id); e.dataTransfer.effectAllowed = 'move' } : undefined}
                      onDragEnd={() => { setDraggingId(null); setOverZone(null) }}
                      className={`bg-white border border-[#dcdee0] rounded-xl p-4 shadow-sm select-none ${
                        isTop ? 'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow' : ''
                      } ${draggingId === issue.id ? 'opacity-40' : ''}`}
                    >
                      {issueId && <span className="font-mono text-[10px] text-[#aaaaaa] block mb-1">{issueId}</span>}
                      <p className="text-sm font-medium text-[#171717] leading-snug mb-2 line-clamp-2">{issue.title}</p>
                      {isTop && issue.description && (
                        <p className="text-xs text-[#999999] leading-snug mb-3 line-clamp-3">{issue.description}</p>
                      )}
                      {isTop && <PriorityBadge priority={issue.priority} />}
                    </div>
                  )
                })}
              </div>
              {unassigned.length > 1 && (
                <p className="text-xs text-[#aaaaaa] text-center mt-1">총 {unassigned.length}건</p>
              )}
            </>
          )}
        </div>

        {/* 오른쪽: 멤버 존 + 미분류 */}
        <div className="flex-1 overflow-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#999999] mb-4">팀원</p>
          <div className="flex flex-wrap gap-4">
            {members.map((member, idx) => {
              const color = COLORS[idx % COLORS.length]
              const assigned = getAssigned(member.id)
              const isOver = overZone === member.id
              return (
                <div
                  key={member.id}
                  onDragOver={e => { e.preventDefault(); setOverZone(member.id) }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOverZone(null) }}
                  onDrop={e => { e.preventDefault(); handleDrop(member.id) }}
                  style={{
                    borderColor: isOver ? color : `${color}66`,
                    width: '208px',
                    minHeight: '240px',
                    backgroundColor: isOver ? `${color}08` : 'white',
                  }}
                  className="border-2 rounded-xl p-4 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      style={{ background: color }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    >
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#171717]">{member.name}</p>
                      <p className="text-xs text-[#999999]">{assigned.length}건 배정</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-1">
                    {assigned.map(i => (
                      <div key={i.id} className="rounded-lg px-3 py-1.5 text-xs text-[#60646c] truncate" style={{ backgroundColor: `${color}12` }}>
                        {i.title}
                      </div>
                    ))}
                    {assigned.length === 0 && !isOver && (
                      <p className="text-xs text-[#cccccc] text-center mt-auto py-6">여기로 드래그</p>
                    )}
                    {isOver && (
                      <p className="text-xs text-center mt-auto py-6 font-medium" style={{ color }}>놓아서 배정</p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* 미분류 존 */}
            <div
              onDragOver={e => { e.preventDefault(); setOverZone('deferred') }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOverZone(null) }}
              onDrop={e => { e.preventDefault(); handleDrop('deferred') }}
              style={{ width: '208px', minHeight: '240px', borderColor: overZone === 'deferred' ? '#60646c' : '#dcdee0' }}
              className={`border-2 border-dashed rounded-xl p-4 transition-all flex flex-col gap-2 ${
                overZone === 'deferred' ? 'bg-[#f5f5f7]' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-full bg-[#f0f0f3] flex items-center justify-center text-[#999999] text-sm font-bold shrink-0">
                  —
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#60646c]">미분류</p>
                  <p className="text-xs text-[#999999]">{deferredIssues.length}건</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                {deferredIssues.map(i => (
                  <div key={i.id} className="bg-[#f0f0f3] rounded-lg px-3 py-1.5 text-xs text-[#999999] truncate">
                    {i.title}
                  </div>
                ))}
                {deferredIssues.length === 0 && !overZone && (
                  <p className="text-xs text-[#cccccc] text-center mt-auto py-6">나중에 분류할 이슈</p>
                )}
                {overZone === 'deferred' && (
                  <p className="text-xs text-[#60646c] text-center font-medium mt-auto py-6">보류</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
