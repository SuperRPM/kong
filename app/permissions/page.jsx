import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

const CHECK = '✓'
const CROSS = '–'

const ROWS = [
  {
    category: '이슈',
    items: [
      { label: '이슈 조회', member: CHECK, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '이슈 생성 / 수정 / 삭제', member: CHECK, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '이슈 댓글 작성 / 삭제', member: CHECK, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '이슈 상태 변경 (취소 포함)', member: CHECK, projectAdmin: CHECK, globalAdmin: CHECK },
    ],
  },
  {
    category: '프로젝트',
    items: [
      { label: '프로젝트 조회', member: CHECK, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '프로젝트 생성', member: CHECK, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '프로젝트 수정 (이름 · prefix · 설명 · 공개여부)', member: CROSS, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '프로젝트 완료 / 아카이브', member: CROSS, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '프로젝트 삭제 (휴지통 이동)', member: CROSS, projectAdmin: CHECK, globalAdmin: CHECK },
    ],
  },
  {
    category: '프로젝트 멤버 · 카테고리',
    items: [
      { label: '멤버 추가 / 제거', member: CROSS, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '멤버 권한 변경 (관리자 ↔ 멤버)', member: CROSS, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '카테고리 추가 / 삭제', member: CROSS, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '업무 분배 보드 사용', member: CROSS, projectAdmin: CHECK, globalAdmin: CHECK },
    ],
  },
  {
    category: '전체 관리자 전용',
    items: [
      { label: '휴지통 (삭제된 프로젝트 · 이슈 복구)', member: CROSS, projectAdmin: CROSS, globalAdmin: CHECK },
      { label: '전체 멤버 관리 (계정 비활성화 등)', member: CROSS, projectAdmin: CROSS, globalAdmin: CHECK },
    ],
  },
  {
    category: '계정',
    items: [
      { label: '내 계정 설정 (이름 · 비밀번호 변경)', member: CHECK, projectAdmin: CHECK, globalAdmin: CHECK },
      { label: '알림 수신 · 읽기 · 삭제', member: CHECK, projectAdmin: CHECK, globalAdmin: CHECK },
    ],
  },
]

function Cell({ value }) {
  const isCheck = value === CHECK
  return (
    <td className={`text-center px-4 py-2.5 text-sm font-medium ${isCheck ? 'text-[#16a34a]' : 'text-[#cccccc]'}`}>
      {value}
    </td>
  )
}

export default async function PermissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, is_admin')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#171717]">권한 안내</h1>
          <p className="text-sm text-[#60646c] mt-1">역할별로 사용할 수 있는 기능을 정리한 표입니다.</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-[#f0f0f3] rounded-lg px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#60646c]">내 역할</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              profile?.is_admin
                ? 'bg-[#171717] text-white'
                : 'bg-[#f0f0f3] border border-[#dcdee0] text-[#60646c]'
            }`}>
              {profile?.is_admin ? '글로벌 관리자' : '멤버'}
            </span>
          </div>
          <p className="text-xs text-[#999999] self-center">
            프로젝트별 관리자 권한은 각 프로젝트 멤버 설정에서 확인하세요.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[#171717]">
                <th className="text-left px-4 py-3 text-sm font-semibold text-[#171717]">기능</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-[#60646c] whitespace-nowrap">일반 멤버</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-[#0d74ce] whitespace-nowrap">프로젝트 관리자</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-[#171717] whitespace-nowrap">글로벌 관리자</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(group => (
                <>
                  <tr key={group.category} className="bg-[#fafafa]">
                    <td colSpan={4} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#aaaaaa]">
                      {group.category}
                    </td>
                  </tr>
                  {group.items.map(row => (
                    <tr key={row.label} className="border-b border-[#f0f0f3] hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-2.5 text-sm text-[#171717]">{row.label}</td>
                      <Cell value={row.member} />
                      <Cell value={row.projectAdmin} />
                      <Cell value={row.globalAdmin} />
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-[#fafafa] border border-[#dcdee0] rounded-xl p-4">
          <p className="text-xs text-[#60646c] leading-relaxed">
            <span className="font-semibold text-[#171717]">프로젝트 관리자</span>란 해당 프로젝트의 멤버 설정에서 <span className="font-mono bg-[#f0f0f3] px-1 py-0.5 rounded text-[10px]">admin</span> 역할을 부여받은 멤버입니다.
            프로젝트 생성자는 자동으로 해당 프로젝트의 관리자가 됩니다.
            글로벌 관리자는 모든 프로젝트에서 프로젝트 관리자와 동일한 권한을 가집니다.
          </p>
        </div>
      </main>
    </div>
  )
}
