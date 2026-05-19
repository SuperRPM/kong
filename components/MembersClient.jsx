'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MembersClient({ initialMembers, projects, initialProjectMembers, currentUserId }) {
  const [members, setMembers] = useState(initialMembers)
  const [projectMembers, setProjectMembers] = useState(initialProjectMembers)
  const [adminLoading, setAdminLoading] = useState({})
  const [editingMember, setEditingMember] = useState(null)
  const [memberLoading, setMemberLoading] = useState(false)
  const [addProjectId, setAddProjectId] = useState('')

  const globalAdmins = members.filter(m => m.is_admin)
  const regularMembers = members.filter(m => !m.is_admin)

  function getMemberProjects(userId) {
    return projectMembers
      .filter(pm => pm.user_id === userId)
      .map(pm => ({ ...pm, project: projects.find(p => p.id === pm.project_id) }))
      .filter(pm => pm.project)
      .sort((a, b) => a.project.name.localeCompare(b.project.name))
  }

  function getAddableProjects(userId) {
    const joined = new Set(projectMembers.filter(pm => pm.user_id === userId).map(pm => pm.project_id))
    return projects.filter(p => !joined.has(p.id))
  }

  async function toggleGlobalAdmin(memberId, current) {
    setAdminLoading(l => ({ ...l, [memberId]: true }))
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', memberId)
    setAdminLoading(l => ({ ...l, [memberId]: false }))
    if (!error) setMembers(m => m.map(x => x.id === memberId ? { ...x, is_admin: !current } : x))
  }

  async function handleAddToProject() {
    if (!addProjectId || !editingMember) return
    setMemberLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('project_members')
      .insert({ project_id: addProjectId, user_id: editingMember.id, role: 'member' })
    if (!error) {
      setProjectMembers(prev => [...prev, { project_id: addProjectId, user_id: editingMember.id, role: 'member' }])
      setAddProjectId('')
    }
    setMemberLoading(false)
  }

  async function handleRemoveFromProject(userId, projectId) {
    setMemberLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('project_members')
      .delete().eq('project_id', projectId).eq('user_id', userId)
    if (!error) setProjectMembers(prev => prev.filter(pm => !(pm.user_id === userId && pm.project_id === projectId)))
    setMemberLoading(false)
  }

  async function handleToggleRole(userId, projectId, currentRole) {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    setMemberLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('project_members')
      .update({ role: newRole }).eq('project_id', projectId).eq('user_id', userId)
    if (!error) setProjectMembers(prev => prev.map(pm =>
      pm.user_id === userId && pm.project_id === projectId ? { ...pm, role: newRole } : pm
    ))
    setMemberLoading(false)
  }

  const sectionLabel = 'text-xs font-semibold uppercase tracking-widest text-[#999999] mb-3'

  return (
    <div className="space-y-8">

      {/* 글로벌 관리자 영역 */}
      <div>
        <p className={sectionLabel}>글로벌 관리자</p>
        <div className="bg-[#fafafa] border border-[#dcdee0] rounded-xl divide-y divide-[#f0f0f3]">
          {globalAdmins.length === 0 ? (
            <p className="text-sm text-[#cccccc] px-4 py-4">글로벌 관리자가 없습니다.</p>
          ) : globalAdmins.map(m => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-sm font-medium text-[#171717]">{m.name}</span>
                <span className="text-xs text-[#999999] ml-2">{m.email}</span>
              </div>
              {m.id === currentUserId ? (
                <span className="text-xs text-[#cccccc]">본인</span>
              ) : (
                <button
                  onClick={() => toggleGlobalAdmin(m.id, true)}
                  disabled={!!adminLoading[m.id]}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#fecaca] text-[#ef4444] hover:bg-[#fef2f2] transition-colors disabled:opacity-50"
                >
                  {adminLoading[m.id] ? '처리 중...' : '관리자 해제'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 일반 멤버 영역 */}
      <div>
        <p className={sectionLabel}>멤버</p>
        <div className="space-y-2">
          {regularMembers.map(m => {
            const memberProjects = getMemberProjects(m.id)
            return (
              <div key={m.id} className="bg-white border border-[#dcdee0] rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-medium text-[#171717]">{m.name}</span>
                      <span className="text-xs text-[#999999]">{m.email}</span>
                    </div>
                    {memberProjects.length === 0 ? (
                      <span className="text-xs text-[#cccccc]">참여 중인 프로젝트 없음</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {memberProjects.map(pm => (
                          <span
                            key={pm.project_id}
                            className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              pm.role === 'admin'
                                ? 'bg-[#171717] text-white'
                                : 'bg-[#f0f0f3] text-[#60646c]'
                            }`}
                          >
                            {pm.project.name}{pm.role === 'admin' ? ' · 관리자' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setEditingMember(m); setAddProjectId('') }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#dcdee0] text-[#60646c] hover:text-[#171717] hover:bg-[#fafafa] transition-colors"
                    >
                      수정
                    </button>
                    {m.id !== currentUserId && (
                      <button
                        onClick={() => toggleGlobalAdmin(m.id, false)}
                        disabled={!!adminLoading[m.id]}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#bfdbfe] text-[#0d74ce] hover:bg-[#eff6ff] transition-colors disabled:opacity-50"
                      >
                        {adminLoading[m.id] ? '...' : '관리자 지정'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 멤버 프로젝트 수정 모달 */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#171717]">{editingMember.name}</h2>
                <p className="text-xs text-[#999999] mt-0.5">{editingMember.email}</p>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-[#999999] mb-2">참여 프로젝트</p>
            <div className="mb-4 max-h-52 overflow-y-auto">
              {getMemberProjects(editingMember.id).length === 0 ? (
                <p className="text-sm text-[#cccccc]">참여 중인 프로젝트 없음</p>
              ) : (
                <ul className="divide-y divide-[#f0f0f3]">
                  {getMemberProjects(editingMember.id).map(pm => (
                    <li key={pm.project_id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#171717]">{pm.project.name}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                          pm.role === 'admin' ? 'bg-[#171717] text-white' : 'bg-[#f0f0f3] text-[#60646c]'
                        }`}>
                          {pm.role === 'admin' ? '관리자' : '멤버'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleRole(editingMember.id, pm.project_id, pm.role)}
                          disabled={memberLoading}
                          className="text-xs text-[#0d74ce] hover:text-[#0b63b0] transition-colors disabled:opacity-40"
                        >
                          {pm.role === 'admin' ? '권한 해제' : '관리자 지정'}
                        </button>
                        <button
                          onClick={() => handleRemoveFromProject(editingMember.id, pm.project_id)}
                          disabled={memberLoading}
                          className="text-xs text-[#999999] hover:text-[#ef4444] transition-colors disabled:opacity-40"
                        >
                          제거
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {getAddableProjects(editingMember.id).length > 0 && (
              <div className="flex gap-2 pt-3 border-t border-[#f0f0f3]">
                <select
                  value={addProjectId}
                  onChange={e => setAddProjectId(e.target.value)}
                  className="flex-1 bg-white border border-[#dcdee0] rounded-lg px-3 py-2 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                >
                  <option value="">프로젝트 선택...</option>
                  {getAddableProjects(editingMember.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddToProject}
                  disabled={!addProjectId || memberLoading}
                  className="bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  추가
                </button>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setEditingMember(null)}
                className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
