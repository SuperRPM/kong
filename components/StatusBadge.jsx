const STATUS = {
  todo:        { label: '할 일',     color: 'bg-[#f0f0f3] text-[#60646c]' },
  in_progress: { label: '진행 중',   color: 'bg-[#e8f4ff] text-[#0d74ce]' },
  review:      { label: '검토 대기', color: 'bg-[#f3ecfa] text-[#8145b5]' },
  done:        { label: '완료',      color: 'bg-[#dcfce7] text-[#16a34a]' },
  cancelled:   { label: '취소',      color: 'bg-[#f0f0f3] text-[#aaaaaa]' },
}

const PRIORITY = {
  low:    { label: '낮음', color: 'bg-[#f0f0f3] text-[#999999]' },
  medium: { label: '보통', color: 'bg-[#fef3c7] text-[#ab6400]' },
  high:   { label: '높음', color: 'bg-[#fef2f2] text-[#ef4444]' },
}

const pillBase = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.6px]'

export function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.todo
  return <span className={`${pillBase} ${s.color}`}>{s.label}</span>
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] ?? PRIORITY.medium
  return <span className={`${pillBase} ${p.color}`}>{p.label}</span>
}

export const STATUS_OPTIONS = Object.entries(STATUS).map(([value, { label }]) => ({ value, label }))
export const PRIORITY_OPTIONS = Object.entries(PRIORITY).map(([value, { label }]) => ({ value, label }))
