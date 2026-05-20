'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PriorityBadge } from './StatusBadge'

const COLORS = ['#6366f1', '#0d74ce', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4']

// 중앙을 기준으로 멤버 배치 슬롯 (최대 8명 + 미분류)
const SLOTS = [
  { top: '4%',  left: '4%' },
  { top: '4%',  left: '50%', transform: 'translateX(-50%)' },
  { top: '4%',  right: '4%' },
  { top: '50%', left: '1%',  transform: 'translateY(-50%)' },
  { top: '50%', right: '1%', transform: 'translateY(-50%)' },
  { bottom: '4%', left: '4%' },
  { bottom: '4%', left: '50%', transform: 'translateX(-50%)' },
  { bottom: '4%', right: '4%' },
]

// 미분류는 항상 오른쪽 하단 고정
const DEFERRED_SLOT = { bottom: '4%', right: '4%' }

function fmtId(prefix, category, number) {
  if (!category || !number) return null
  return `${prefix}-${category}-${String(number).padStart(3, '0')}`
}

function MemberZone({ member, color, assigned, isOver, onDragOver, onDragLeave, onDrop }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        width: 210,
        minHeight: 240,
        borderColor: isOver ? color : `${color}55`,
        backgroundColor: isOver ? `${color}0d` : 'white',
      }}
      className="border-2 rounded-2xl p-4 transition-all flex flex-col gap-2 shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <div style={{ background: color }} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
          {member.name[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#171717]">{member.name}</p>
          <p className="text-xs text-[#999999]">{assigned.length}건 배정</p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 flex-1 mt-1">
        {assigned.map(i => (
          <div key={i.id} style={{ backgroundColor: `${color}15` }} className="rounded-lg px-3 py-1.5 text-xs text-[#60646c] truncate">
            {i.title}
          </div>
        ))}
        {assigned.length === 0 && !isOver && (
          <p className="text-xs text-[#cccccc] text-center mt-auto py-8">여기로 드래그</p>
        )}
        {isOver && (
          <p className="text-xs font-semibold text-center mt-auto py-8" style={{ color }}>놓아서 배정</p>
        )}
      </div>
    </div>
  )
}

export default function AssignBoard({ projectId, project, members, initialIssues }) {
  const [issues, setIssues] = useState(initialIssues)
  const [deferred, setDeferred] = useState(new Set())
  const [draggingId, setDraggingId] = useState(null)
  const [overZone, setOverZone] = useState(null)

  const unassigned = issues.filter(i => !i.assignee_id && !deferred.has(i.id))
  const deferredIssues = issues.filter(i => deferred.has(i.id))

  // 미분류가 마지막 슬롯을 차지하므로 멤버는 SLOTS.length - 1개까지만 사용
  const memberSlots = SLOTS.slice(0, Math.min(members.length, SLOTS.length - 1))
  // 미분류는 마지막 남은 슬롯
  const deferredSlot = members.length < SLOTS.length ? SLOTS[members.length] : DEFERRED_SLOT

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

  function stopOver(e, zone) {
    e.preventDefault()
    setOverZone(zone)
  }

  function leaveZone(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setOverZone(null)
  }

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

      {/* 아레나 */}
      <div className="flex-1 relative overflow-hidden bg-[#fafafa]">

        {/* 중앙 카드 더미 */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 220 }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#aaaaaa] text-center mb-3">미배정 이슈</p>
          {unassigned.length === 0 ? (
            <div className="bg-white border border-dashed border-[#dcdee0] rounded-2xl p-8 text-center">
              <p className="text-sm text-[#cccccc]">
                {issues.every(i => i.assignee_id) ? '모두 배정 완료' : '모두 이동됨'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', height: Math.min(unassigned.length - 1, 2) * 10 + 210 }}>
                {unassigned.slice(0, 3).reverse().map((issue, idx, arr) => {
                  const isTop = idx === arr.length - 1
                  const stackIdx = arr.length - 1 - idx
                  const issueId = fmtId(project?.prefix, issue.category, issue.number)
                  return (
                    <div
                      key={issue.id}
                      draggable={isTop}
                      onDragStart={isTop ? e => { setDraggingId(issue.id); e.dataTransfer.effectAllowed = 'move' } : undefined}
                      onDragEnd={() => { setDraggingId(null); setOverZone(null) }}
                      style={{
                        position: 'absolute',
                        top: stackIdx * 10,
                        left: 0,
                        right: 0,
                        transform: `rotate(${(stackIdx - 1) * 2}deg)`,
                        zIndex: idx + 1,
                      }}
                      className={`bg-white border border-[#dcdee0] rounded-2xl p-4 shadow-sm select-none ${
                        isTop ? 'cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow' : ''
                      } ${draggingId === issue.id ? 'opacity-30' : ''}`}
                    >
                      {issueId && <span className="font-mono text-[10px] text-[#aaaaaa] block mb-1">{issueId}</span>}
                      <p className="text-sm font-semibold text-[#171717] leading-snug mb-2 line-clamp-2">{issue.title}</p>
                      {isTop && issue.description && (
                        <p className="text-xs text-[#999999] leading-snug mb-3 line-clamp-3">{issue.description}</p>
                      )}
                      {isTop && <PriorityBadge priority={issue.priority} />}
                    </div>
                  )
                })}
              </div>
              {unassigned.length > 1 && (
                <p className="text-[11px] text-[#aaaaaa] text-center mt-3">총 {unassigned.length}건</p>
              )}
            </>
          )}
        </div>

        {/* 멤버 존들 */}
        {members.slice(0, memberSlots.length).map((member, idx) => {
          const color = COLORS[idx % COLORS.length]
          const slot = memberSlots[idx]
          return (
            <div key={member.id} style={{ position: 'absolute', ...slot }}>
              <MemberZone
                member={member}
                color={color}
                assigned={issues.filter(i => i.assignee_id === member.id)}
                isOver={overZone === member.id}
                onDragOver={e => stopOver(e, member.id)}
                onDragLeave={leaveZone}
                onDrop={e => { e.preventDefault(); handleDrop(member.id) }}
              />
            </div>
          )
        })}

        {/* 미분류 존 */}
        <div style={{ position: 'absolute', ...deferredSlot }}>
          <div
            onDragOver={e => stopOver(e, 'deferred')}
            onDragLeave={leaveZone}
            onDrop={e => { e.preventDefault(); handleDrop('deferred') }}
            style={{
              width: 210,
              minHeight: 240,
              borderColor: overZone === 'deferred' ? '#60646c' : '#dcdee0',
              backgroundColor: overZone === 'deferred' ? '#f5f5f7' : 'white',
            }}
            className="border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#f0f0f3] flex items-center justify-center text-[#999999] text-base font-bold shrink-0">
                —
              </div>
              <div>
                <p className="text-sm font-semibold text-[#60646c]">미분류</p>
                <p className="text-xs text-[#999999]">{deferredIssues.length}건</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 mt-1">
              {deferredIssues.map(i => (
                <div key={i.id} className="bg-[#f0f0f3] rounded-lg px-3 py-1.5 text-xs text-[#999999] truncate">
                  {i.title}
                </div>
              ))}
              {deferredIssues.length === 0 && !overZone && (
                <p className="text-xs text-[#cccccc] text-center mt-auto py-8">나중에 분류할 이슈</p>
              )}
              {overZone === 'deferred' && (
                <p className="text-xs text-[#60646c] font-semibold text-center mt-auto py-8">보류</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
