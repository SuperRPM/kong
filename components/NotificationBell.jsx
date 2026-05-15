'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function relativeTime(dateStr) {
  const now = Date.now()
  const diff = Math.floor((now - new Date(dateStr).getTime()) / 1000) // seconds
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

export default function NotificationBell() {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState(null)
  const dropdownRef = useRef(null)

  // Fetch current user on mount
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
  }, [userId, supabase])

  // Fetch notifications when userId is known
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  async function handleNotificationClick(notification) {
    // Mark as read if unread
    if (!notification.read_at) {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notification.id)
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    // Navigate to issue if issue_id exists
    // We don't have project_id in the notifications table, so just close for now
    setOpen(false)
  }

  async function markAllRead() {
    if (!userId) return
    const now = new Date().toISOString()
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('recipient_id', userId)
      .is('read_at', null)
    setNotifications(prev => prev.map(n => n.read_at ? n : { ...n, read_at: now }))
    setUnreadCount(0)
  }

  function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next) fetchNotifications()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        className="relative p-1.5 rounded-lg text-[#60646c] hover:text-[#171717] hover:bg-[#f5f5f7] transition-colors"
        aria-label="알림"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-[#dcdee0] rounded-xl shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f3]">
            <span className="text-sm font-semibold text-[#171717]">알림</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#60646c] hover:text-[#171717] transition-colors"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#999999]">
              새로운 알림이 없습니다
            </div>
          ) : (
            <ul>
              {notifications.map(notification => (
                <li key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f0f0f3] last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      {/* Unread blue dot */}
                      <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${
                        notification.read_at ? 'bg-transparent' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#171717] break-words leading-snug">
                          {notification.message}
                        </p>
                        <p className="mt-0.5 text-xs text-[#999999]">
                          {relativeTime(notification.created_at)}
                        </p>
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
