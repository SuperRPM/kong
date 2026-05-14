'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MembersClient({ initialMembers, currentUserId }) {
  const [members, setMembers] = useState(initialMembers)
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  async function toggleAdmin(memberId, currentValue) {
    setLoading(l => ({ ...l, [memberId]: true }))
    setErrors(e => ({ ...e, [memberId]: null }))
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentValue })
      .eq('id', memberId)
    setLoading(l => ({ ...l, [memberId]: false }))
    if (error) {
      setErrors(e => ({ ...e, [memberId]: error.message }))
      return
    }
    setMembers(m => m.map(member =>
      member.id === memberId ? { ...member, is_admin: !currentValue } : member
    ))
  }

  return (
    <div className="space-y-2">
      {members.map(member => (
        <div key={member.id} className="bg-white border border-[#dcdee0] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-[#171717] text-sm">{member.name}</p>
                {member.is_admin && (
                  <span className="text-xs font-medium text-[#8b5cf6] bg-[#f5f3ff] px-2 py-0.5 rounded">관리자</span>
                )}
              </div>
              <p className="text-xs text-[#999999] mt-0.5">{member.email}</p>
            </div>
            <div className="shrink-0 ml-4">
              {member.id === currentUserId ? (
                <span className="text-xs text-[#cccccc]">본인</span>
              ) : (
                <button
                  onClick={() => toggleAdmin(member.id, member.is_admin)}
                  disabled={!!loading[member.id]}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 border ${
                    member.is_admin
                      ? 'text-[#ef4444] hover:bg-[#fef2f2] border-[#fecaca]'
                      : 'text-[#0d74ce] hover:bg-[#eff6ff] border-[#bfdbfe]'
                  }`}
                >
                  {loading[member.id] ? '처리 중...' : member.is_admin ? '관리자 해제' : '관리자 지정'}
                </button>
              )}
            </div>
          </div>
          {errors[member.id] && (
            <p className="text-xs text-[#ef4444] mt-2">{errors[member.id]}</p>
          )}
        </div>
      ))}
    </div>
  )
}
