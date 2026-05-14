'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProjectActions({ projectId, projectName }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)

  async function handleDelete() {
    const supabase = createClient()
    const now = new Date().toISOString()
    await supabase.from('issues').update({ deleted_at: now }).eq('project_id', projectId).is('deleted_at', null)
    const { error } = await supabase.from('projects').update({ deleted_at: now }).eq('id', projectId)
    if (!error) router.push('/projects')
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className="text-sm font-medium text-[#999999] hover:text-[#ef4444] transition-colors shrink-0"
      >
        프로젝트 삭제
      </button>

      {confirm && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-[#171717] mb-2">프로젝트 삭제</h2>
            <p className="text-sm text-[#60646c] mb-5">
              <span className="font-medium text-[#171717]">{projectName}</span>과(와) 모든 이슈가 휴지통으로 이동합니다. 30일 이내 복구 가능합니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirm(false)}
                className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
