'use client'

import { Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import IssueList from './IssueList'
import ProjectStats from './ProjectStats'
import KanbanBoard from './KanbanBoard'
import KeyboardShortcuts from './KeyboardShortcuts'

const VIEWS = [
  { key: 'list', label: '목록' },
  { key: 'kanban', label: '칸반' },
  { key: 'stats', label: '통계' },
]

function ViewContent({ projectId, projectPrefix, initialIssues, members }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = searchParams.get('view') ?? 'list'
  const searchInputRef = useRef(null)

  function setView(key) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', key)
    router.replace(`?${params.toString()}`)
  }

  return (
    <>
      <KeyboardShortcuts projectId={projectId} searchInputRef={searchInputRef} />

      <div className="flex items-center gap-1 mb-5">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              view === v.key
                ? 'bg-[#171717] text-white'
                : 'text-[#60646c] hover:bg-[#f0f0f3]'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'list' && (
        <IssueList
          projectId={projectId}
          projectPrefix={projectPrefix}
          initialIssues={initialIssues}
          members={members}
          searchInputRef={searchInputRef}
        />
      )}
      {view === 'kanban' && (
        <KanbanBoard
          projectId={projectId}
          projectPrefix={projectPrefix}
          initialIssues={initialIssues}
        />
      )}
      {view === 'stats' && (
        <ProjectStats issues={initialIssues} />
      )}
    </>
  )
}

export default function ProjectViewClient({ projectId, projectPrefix, initialIssues, members }) {
  return (
    <Suspense fallback={null}>
      <ViewContent
        projectId={projectId}
        projectPrefix={projectPrefix}
        initialIssues={initialIssues}
        members={members}
      />
    </Suspense>
  )
}
