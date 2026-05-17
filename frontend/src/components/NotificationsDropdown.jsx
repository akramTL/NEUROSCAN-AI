import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, BellOff, CheckCheck, Loader2 } from 'lucide-react'
import { getNotifications, markNotificationRead, markAllRead } from '../api/api'

function timeAgo(iso) {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000
  if (secs < 60)   return 'Just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) {
    const h = Math.floor(secs / 3600)
    return `${h}h ago`
  }
  const d = Math.floor(secs / 86400)
  return `${d}d ago`
}

const TYPE_ICON = {
  analysis_complete: { Icon: CheckCircle2, color: '#10B981' },
  analysis_failed:   { Icon: XCircle,       color: '#EF4444' },
  new_patient:       { Icon: CheckCircle2,  color: '#818CF8' },
}

export default function NotificationsDropdown({ onClose }) {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  getNotifications,
    staleTime: 0,
  })

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const markAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const handleClick = (notif) => {
    if (!notif.is_read) markRead.mutate(notif.id)
    onClose()
    if (notif.analysis_id) navigate(`/analysis/${notif.analysis_id}`)
    else if (notif.patient_id) navigate(`/patients/${notif.patient_id}`)
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: -8 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      exit={  { opacity: 0, scale: 0.94, y: -8  }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
        width: 360, zIndex: 500,
        background: 'rgba(13,17,23,0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(99,102,241,0.08)',
        overflow: 'hidden',
        maxHeight: 480,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#818CF8',
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 9999, padding: '1px 7px',
            }}>
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <motion.button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600, color: '#818CF8',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', borderRadius: 8,
              opacity: markAll.isPending ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
            whileHover={{ background: 'rgba(99,102,241,0.1)' }}
            whileTap={{ scale: 0.96 }}
          >
            <CheckCheck size={13} />
            Mark all read
          </motion.button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={22} className="spin" style={{ color: '#6366F1', margin: '0 auto 10px', display: 'block' }} />
            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>Loading…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <BellOff size={28} style={{ color: '#334155', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: '0 0 4px' }}>
              No notifications yet
            </p>
            <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>
              Completed analyses will appear here.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((notif, i) => {
              const { Icon, color } = TYPE_ICON[notif.type] ?? TYPE_ICON.analysis_complete
              const unread = !notif.is_read
              return (
                <motion.button
                  key={notif.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleClick(notif)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < notifications.length - 1
                      ? '1px solid rgba(255,255,255,0.04)'
                      : 'none',
                    background: unread ? 'rgba(99,102,241,0.06)' : 'transparent',
                    borderLeft: unread ? '3px solid #6366F1' : '3px solid transparent',
                    cursor: 'pointer', textAlign: 'left',
                    border: 'none',
                    borderLeft: unread ? '3px solid #6366F1' : '3px solid transparent',
                    fontFamily: 'inherit',
                    transition: 'background 0.15s',
                  }}
                  whileHover={{
                    background: unread
                      ? 'rgba(99,102,241,0.1)'
                      : 'rgba(255,255,255,0.03)',
                  }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 1,
                  }}>
                    <Icon size={15} style={{ color }} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{
                        fontSize: 13, fontWeight: unread ? 700 : 500,
                        color: unread ? '#F1F5F9' : '#94A3B8',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {notif.title}
                      </span>
                      <span style={{ fontSize: 11, color: '#475569', flexShrink: 0 }}>
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 12, color: '#64748B', margin: '2px 0 0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {notif.message}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {unread && (
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#6366F1',
                      boxShadow: '0 0 6px rgba(99,102,241,0.6)',
                      flexShrink: 0, marginTop: 6,
                    }} />
                  )}
                </motion.button>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
