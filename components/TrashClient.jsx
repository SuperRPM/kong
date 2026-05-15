'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function getDaysLeft(deletedAt) {
  return 30 - Math.floor((Date.now() - new Date(deletedAt)) / 86400000)
}

function DaysLeftBadge({ deletedAt }) {
  const daysLeft = getDaysLeft(deletedAt)
  const isUrgent = daysLeft <= 7
  return (
    <span className={`text-xs shrink-0 ${isUrgent ? 'text-[#ef4444] font-medium' : 'text-[#999999]'}`}>
      {daysLeft}일 후 영구 삭제
    </span>
  )
}

function issueId(prefix, category, number) {
  if (!category || !number) return null
  return `${prefix}-${category}-${String(number).padStart(3, '0')}`
}

export default function TrashClient({ initialProjects, initialIssues }) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [issues, setIssues] = useState(initialIssues)

  async function restoreProject(id) {
    const supabase = createClient()
    await supabase.from('issues').update({ deleted_at: null }).eq('project_id', id).not('deleted_at', 'is', null)
    const { error } = await supabase.from('projects').update({ deleted_at: null }).eq('id', id)
    if (!error) {
      setProjects(prev => prev.filter(p => p.id !== id))
      setIssues(prev => prev.filter(i => i.project?.id !== id))
      router.refresh()
    }
  }

  async function purgeProject(id) {
    const supabase = createClient()
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) setProjects(prev => prev.filter(p => p.id !== id))
  }

  async function restoreIssue(id) {
    const supabase = createClient()
    const { error } = await supabase.from('issues').update({ deleted_at: null }).eq('id', id)
    if (!error) {
      setIssues(prev => prev.filter(i => i.id !== id))
      router.refresh()
    }
  }

  async function purgeIssue(id) {
    const supabase = createClient()
    const { error } = await supabase.from('issues').delete().eq('id', id)
    if (!error) setIssues(prev => prev.filter(i => i.id !== id))
  }

  const isEmpty = projects.length === 0 && issues.length === 0

  if (isEmpty) {
    return (
      <div className="text-center py-20 text-[#999999] text-sm">휴지통이 비어 있습니다.</div>
    )
  }

  return (
    <div className="space-y-8">
      {projects.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#171717] mb-3">삭제된 프로젝트</h2>
          <div className="bg-white border border-[#dcdee0] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#f0f0f3]">
              {projects.map(project => (
                <div key={project.id} className="flex items-center px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#171717] truncate">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-[#999999] truncate">{project.description}</p>
                    )}
                  </div>
                  <DaysLeftBadge deletedAt={project.deleted_at} />
                  <button
                    onClick={() => restoreProject(project.id)}
                    className="text-xs font-medium text-[#0d74ce] hover:underline shrink-0"
                  >
                    복구
                  </button>
                  <button
                    onClick={() => purgeProject(project.id)}
                    className="text-xs font-medium text-[#ef4444] hover:underline shrink-0"
                  >
                    영구삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {issues.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#171717] mb-3">삭제된 이슈</h2>
          <div className="bg-white border border-[#dcdee0] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#f0f0f3]">
              {issues.map(issue => (
                <div key={issue.id} className="flex items-center px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-[#999999]">
                      {issueId(issue.project?.prefix, issue.category, issue.number) ?? issue.project?.name}
                    </p>
                    <p className="text-sm text-[#171717] truncate">{issue.title}</p>
                  </div>
                  <DaysLeftBadge deletedAt={issue.deleted_at} />
                  <button
                    onClick={() => restoreIssue(issue.id)}
                    className="text-xs font-medium text-[#0d74ce] hover:underline shrink-0"
                  >
                    복구
                  </button>
                  <button
                    onClick={() => purgeIssue(issue.id)}
                    className="text-xs font-medium text-[#ef4444] hover:underline shrink-0"
                  >
                    영구삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
