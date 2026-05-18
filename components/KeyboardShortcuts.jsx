'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SHORTCUTS = [
  { key: 'N', desc: '새 이슈 만들기' },
  { key: 'F', desc: '검색 인풋 포커스' },
  { key: '1', desc: '목록 뷰' },
  { key: '2', desc: '칸반 뷰' },
  { key: '3', desc: '통계 뷰' },
  { key: '?', desc: '단축키 도움말 토글' },
  { key: 'Esc', desc: '도움말 닫기' },
]

export default function KeyboardShortcuts({ projectId, searchInputRef }) {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      // Ignore when typing in input/textarea/select
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault()
          router.push(`/projects/${projectId}/issues/new`)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          searchInputRef?.current?.focus()
          break
        case '1':
          e.preventDefault()
          router.push(`?view=list`)
          break
        case '2':
          e.preventDefault()
          router.push(`?view=kanban`)
          break
        case '3':
          e.preventDefault()
          router.push(`?view=stats`)
          break
        case '?':
          e.preventDefault()
          setShowHelp(v => !v)
          break
        case 'Escape':
          setShowHelp(false)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [projectId, router, searchInputRef])

  if (!showHelp) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-[#dcdee0] w-full max-w-sm mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f3]">
          <h2 className="text-sm font-semibold text-[#171717]">키보드 단축키</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-[#999999] hover:text-[#171717] transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        <table className="w-full">
          <tbody>
            {SHORTCUTS.map(({ key, desc }) => (
              <tr key={key} className="border-b border-[#f0f0f3] last:border-0">
                <td className="px-5 py-3 w-16">
                  <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 bg-[#f0f0f3] border border-[#dcdee0] rounded text-[11px] font-mono font-semibold text-[#60646c]">
                    {key}
                  </kbd>
                </td>
                <td className="px-5 py-3 text-sm text-[#60646c]">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 bg-[#fafafa] border-t border-[#f0f0f3]">
          <p className="text-[11px] text-[#999999]">인풋 포커스 중에는 단축키가 비활성화됩니다.</p>
        </div>
      </div>
    </div>
  )
}
