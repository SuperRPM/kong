'use client'

import { useState } from 'react'
import IssueList from './IssueList'
import ProjectStats from './ProjectStats'
import KanbanBoard from './KanbanBoard'

const VIEWS = [
  { key: 'list', label: '목록' },
  { key: 'kanban', label: '칸반' },
  { key: 'stats', label: '통계' },
]

export default function ProjectViewClient({ projectId, projectPrefix, initialIssues, members }) {
  const [view, setView] = useState('list')

  return (
    <>
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
