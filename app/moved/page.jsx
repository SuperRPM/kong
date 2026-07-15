'use client'

import { useEffect, useState } from 'react'

const NEW_URL = 'http://192.168.20.87'

export default function MovedPage() {
  const [seconds, setSeconds] = useState(5)

  useEffect(() => {
    if (seconds <= 0) {
      window.location.href = NEW_URL
      return
    }
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-xl font-semibold text-[#171717] mb-2">서비스가 이전되었습니다</h1>
        <p className="text-sm text-[#60646c] mb-6 leading-relaxed">
          보안 강화를 위해 Kong이 사내망 주소로 이전되었습니다.
          <br />
          {seconds}초 후 자동으로 이동합니다.
        </p>
        <a
          href={NEW_URL}
          className="inline-block bg-[#000000] hover:bg-[#1a1a1a] text-white text-sm font-medium px-[18px] py-[10px] rounded-lg transition-colors"
        >
          지금 이동
        </a>
        <p className="text-xs text-[#999999] mt-4">
          사내망(VPN 포함) 연결 상태에서만 접속 가능합니다.
        </p>
      </div>
    </div>
  )
}
