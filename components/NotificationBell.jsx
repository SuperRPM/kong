'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

function showBrowserNotification(message) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return
  new Notification('Kong', { body: message, icon: '/favicon.ico' })
}

export default function NotificationBell() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id)
    })
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read_at).length)
    }
  }, [userId])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Supabase Realtime — 새 알림 실시간 수신
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      }, (payload) => {
        const n = payload.new
        setNotifications(prev => [n, ...prev].slice(0, 20))
        setUnreadCount(prev => prev + 1)
        showBrowserNotification(n.message)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  async function handleClick(notification) {
    if (!notification.read_at) {
      const now = new Date().toISOString()
      await supabase.from('notifications').update({ read_at: now }).eq('id', notification.id)
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read_at: now } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setOpen(false)
  }

  async function markAllRead() {
    if (!userId) return
    const now = new Date().toISOString()
    await supabase.from('notifications').update({ read_at: now }).eq('recipient_id', userId).is('read_at', null)
    setNotifications(prev => prev.map(n => n.read_at ? n : { ...n, read_at: now }))
    setUnreadCount(0)
  }

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      fetchNotifications()
      // 벨을 처음 클릭할 때 브라우저 알림 권한 요청
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggle}
        className="relative p-1.5 rounded-lg text-[#60646c] hover:text-[#171717] hover:bg-[#f5f5f7] transition-colors"
        aria-label="알림"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-[#ef4444] text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-[#dcdee0] rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f3]">
            <span className="text-sm font-semibold text-[#171717]">알림</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-[#60646c] hover:text-[#171717] transition-colors">모두 읽음</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#999999]">새로운 알림이 없습니다</div>
          ) : (
            <ul>
              {notifications.map(n => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className="w-full text-left px-4 py-3 hover:bg-[#fafafa] transition-colors border-b border-[#f0f0f3] last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-[#0d74ce]'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#171717] break-words leading-snug">{n.message}</p>
                        <p className="mt-0.5 text-xs text-[#999999]">{relativeTime(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
