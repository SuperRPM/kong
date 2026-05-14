const STATUS = {
  todo:        { label: '할 일',    color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: '진행 중',  color: 'bg-blue-100 text-blue-700' },
  review:      { label: '검토 대기', color: 'bg-yellow-100 text-yellow-700' },
  done:        { label: '완료',     color: 'bg-green-100 text-green-700' },
}

const PRIORITY = {
  low:    { label: '낮음', color: 'bg-gray-100 text-gray-500' },
  medium: { label: '보통', color: 'bg-orange-100 text-orange-600' },
  high:   { label: '높음', color: 'bg-red-100 text-red-600' },
}

export function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.todo
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] ?? PRIORITY.medium
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${p.color}`}>
      {p.label}
    </span>
  )
}

export const STATUS_OPTIONS = Object.entries(STATUS).map(([value, { label }]) => ({ value, label }))
export const PRIORITY_OPTIONS = Object.entries(PRIORITY).map(([value, { label }]) => ({ value, label }))
