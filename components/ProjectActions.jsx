'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputCls = 'w-full bg-white border border-[#dcdee0] rounded-lg px-4 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]'
const labelCls = 'block text-sm font-medium text-[#171717] mb-1'

export default function ProjectActions({ projectId, projectName, project, canManage, projectMembers = [], allMembers = [], categories = [] }) {
  const router = useRouter()

  // 삭제 확인
  const [confirm, setConfirm] = useState(false)

  // 완료/아카이브
  const [archiveLoading, setArchiveLoading] = useState(false)
  const isCompleted = !!project?.completed_at

  // 프로젝트 수정
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: project?.name ?? '',
    description: project?.description ?? '',
    prefix: project?.prefix ?? '',
    is_private: project?.is_private ?? false,
  })
  const [editLoading, setEditLoading] = useState(false)

  // 멤버 관리
  const [managingMembers, setManagingMembers] = useState(false)
  const [members, setMembers] = useState(projectMembers)
  const [addUserId, setAddUserId] = useState('')
  const [memberLoading, setMemberLoading] = useState(false)

  // 카테고리 관리
  const [managingCats, setManagingCats] = useState(false)
  const [cats, setCats] = useState(categories)
  const [newCatValue, setNewCatValue] = useState('')
  const [newCatLabel, setNewCatLabel] = useState('')
  const [catLoading, setCatLoading] = useState(false)

  const memberIds = new Set(members.map(m => m.id))
  const addableMembers = allMembers.filter(m => !memberIds.has(m.id))

  async function handleEdit(e) {
    e.preventDefault()
    if (!editForm.name.trim()) return
    setEditLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('projects').update({
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
      prefix: editForm.prefix.trim().toUpperCase() || project?.prefix,
      is_private: editForm.is_private,
    }).eq('id', projectId)
    setEditLoading(false)
    if (!error) { setEditing(false); router.refresh() }
  }

  async function handleToggleComplete() {
    setArchiveLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('projects').update({
      completed_at: isCompleted ? null : new Date().toISOString(),
    }).eq('id', projectId)
    setArchiveLoading(false)
    if (!error) router.refresh()
  }

  async function handleDelete() {
    const supabase = createClient()
    const now = new Date().toISOString()
    await supabase.from('issues').update({ deleted_at: now }).eq('project_id', projectId).is('deleted_at', null)
    const { error } = await supabase.from('projects').update({ deleted_at: now }).eq('id', projectId)
    if (!error) router.push('/projects')
  }

  async function handleAddMember() {
    if (!addUserId) return
    setMemberLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('project_members').insert({ project_id: projectId, user_id: addUserId, role: 'member' })
    if (!error) {
      const added = allMembers.find(m => m.id === addUserId)
      if (added) setMembers(prev => [...prev, { ...added, role: 'member' }].sort((a, b) => a.name.localeCompare(b.name)))
      setAddUserId('')
    }
    setMemberLoading(false)
  }

  async function handleRemoveMember(userId) {
    setMemberLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId)
    if (!error) setMembers(prev => prev.filter(m => m.id !== userId))
    setMemberLoading(false)
  }

  async function handleToggleRole(member) {
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    setMemberLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('project_members')
      .update({ role: newRole })
      .eq('project_id', projectId)
      .eq('user_id', member.id)
    if (!error) setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m))
    setMemberLoading(false)
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    const val = newCatValue.trim().toUpperCase()
    const lbl = newCatLabel.trim()
    if (!val || !lbl) return
    setCatLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('project_categories')
      .insert({ project_id: projectId, value: val, label: lbl, sort_order: cats.length })
      .select('id, value, label, sort_order')
      .single()
    if (!error && data) { setCats(prev => [...prev, data]); setNewCatValue(''); setNewCatLabel('') }
    setCatLoading(false)
  }

  async function handleDeleteCategory(catId) {
    setCatLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('project_categories').delete().eq('id', catId)
    if (!error) setCats(prev => prev.filter(c => c.id !== catId))
    setCatLoading(false)
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {canManage && (
          <>
            <button
              onClick={() => setManagingMembers(true)}
              className="text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors shrink-0"
            >
              멤버
            </button>
            <button
              onClick={() => setManagingCats(true)}
              className="text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors shrink-0"
            >
              카테고리
            </button>
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-medium text-[#60646c] hover:text-[#171717] transition-colors shrink-0"
            >
              수정
            </button>
          </>
        )}
        {canManage && (
          <button
            onClick={handleToggleComplete}
            disabled={archiveLoading}
            className="text-sm font-medium text-[#999999] hover:text-[#171717] transition-colors shrink-0 disabled:opacity-40"
          >
            {isCompleted ? '완료 취소' : '완료'}
          </button>
        )}
        <button
          onClick={() => setConfirm(true)}
          className="text-sm font-medium text-[#999999] hover:text-[#ef4444] transition-colors shrink-0"
        >
          삭제
        </button>
      </div>

      {/* 멤버 관리 모달 */}
      {managingMembers && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-[#171717] mb-5">멤버 관리</h2>
            <div className="mb-4 max-h-60 overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-sm text-[#999999]">참여 중인 멤버가 없습니다.</p>
              ) : (
                <ul className="divide-y divide-[#f0f0f3]">
                  {members.map(m => (
                    <li key={m.id} className="flex items-center justify-between py-2.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-[#171717] truncate">{m.name}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                          m.role === 'admin' ? 'bg-[#171717] text-white' : 'bg-[#f0f0f3] text-[#60646c]'
                        }`}>
                          {m.role === 'admin' ? '관리자' : '멤버'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleRole(m)}
                          disabled={memberLoading}
                          className="text-xs text-[#0d74ce] hover:text-[#0b63b0] transition-colors disabled:opacity-40"
                        >
                          {m.role === 'admin' ? '권한 해제' : '관리자 지정'}
                        </button>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
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
            {addableMembers.length > 0 && (
              <div className="flex gap-2 pt-3 border-t border-[#f0f0f3]">
                <select
                  value={addUserId}
                  onChange={e => setAddUserId(e.target.value)}
                  className="flex-1 bg-white border border-[#dcdee0] rounded-lg px-3 py-2 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                >
                  <option value="">멤버 선택...</option>
                  {addableMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <button
                  onClick={handleAddMember}
                  disabled={!addUserId || memberLoading}
                  className="bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  추가
                </button>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => { setManagingMembers(false); router.refresh() }}
                className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 관리 모달 */}
      {managingCats && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-[#171717] mb-5">카테고리 관리</h2>
            <div className="mb-4 max-h-60 overflow-y-auto">
              {cats.length === 0 ? (
                <p className="text-sm text-[#999999]">등록된 카테고리가 없습니다.</p>
              ) : (
                <ul className="divide-y divide-[#f0f0f3]">
                  {cats.map(c => (
                    <li key={c.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="font-mono text-xs text-[#60646c] mr-2">{c.value}</span>
                        <span className="text-sm text-[#171717]">{c.label}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        disabled={catLoading}
                        className="text-xs text-[#999999] hover:text-[#ef4444] transition-colors disabled:opacity-40 shrink-0"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <form onSubmit={handleAddCategory} className="pt-3 border-t border-[#f0f0f3] space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatValue}
                  onChange={e => setNewCatValue(e.target.value.toUpperCase())}
                  placeholder="코드 (예: SL)"
                  maxLength={10}
                  className="w-28 bg-white border border-[#dcdee0] rounded-lg px-3 py-2 text-sm text-[#171717] font-mono focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]"
                />
                <input
                  type="text"
                  value={newCatLabel}
                  onChange={e => setNewCatLabel(e.target.value)}
                  placeholder="이름 (예: 세일즈)"
                  className="flex-1 bg-white border border-[#dcdee0] rounded-lg px-3 py-2 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717] placeholder:text-[#999999]"
                />
                <button
                  type="submit"
                  disabled={!newCatValue.trim() || !newCatLabel.trim() || catLoading}
                  className="bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
                >
                  추가
                </button>
              </div>
            </form>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setManagingCats(false)}
                className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로젝트 수정 모달 */}
      {editing && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-[#171717] mb-5">프로젝트 수정</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className={labelCls}>프로젝트명 *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>이슈 ID 접두사 (Prefix)</label>
                <input
                  type="text"
                  value={editForm.prefix}
                  onChange={e => setEditForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))}
                  maxLength={10}
                  className={inputCls}
                />
                <p className="text-xs text-[#999999] mt-1">변경 시 기존 이슈 ID 표시에 영향을 줍니다.</p>
              </div>
              <div>
                <label className={labelCls}>설명</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="is_private"
                  checked={editForm.is_private}
                  onChange={e => setEditForm(f => ({ ...f, is_private: e.target.checked }))}
                  className="rounded border-[#dcdee0] cursor-pointer"
                />
                <label htmlFor="is_private" className="text-sm text-[#171717] cursor-pointer select-none">
                  비공개 프로젝트 <span className="text-[#999999]">(멤버와 관리자만 접근 가능)</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors">취소</button>
                <button type="submit" disabled={editLoading} className="bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#cccccc] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors">
                  {editLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {confirm && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white border border-[#dcdee0] rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-[#171717] mb-2">프로젝트 삭제</h2>
            <p className="text-sm text-[#60646c] mb-5">
              <span className="font-medium text-[#171717]">{projectName}</span>과(와) 모든 이슈가 휴지통으로 이동합니다. 30일 이내 복구 가능합니다.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(false)} className="text-sm font-medium text-[#60646c] hover:text-[#171717] px-4 py-2 transition-colors">취소</button>
              <button onClick={handleDelete} className="bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
