import { NextResponse } from 'next/server'

// 사내망(192.168.20.87)으로 서비스 이전 — 모든 요청을 이전 안내 페이지로 리다이렉트
export function proxy(request) {
  const { pathname } = request.nextUrl
  if (pathname === '/moved') return NextResponse.next()
  return NextResponse.redirect(new URL('/moved', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
