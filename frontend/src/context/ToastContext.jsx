import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', title = null) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, title, exiting: false }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220)
    }, 4000)
  }, [])

  const dismiss = useCallback(id => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}

const BORDER_COLOR = { success: '#10B981', error: '#EF4444', info: '#6366F1', warning: '#F59E0B' }
const ICON_COLOR   = { success: '#10B981', error: '#EF4444', info: '#818CF8', warning: '#F59E0B' }

function ToastIcon({ type }) {
  const color = ICON_COLOR[type] ?? '#818CF8'
  if (type === 'success') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  if (type === 'error')   return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
  if (type === 'warning') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}

function Toast({ toast, onDismiss }) {
  const borderColor = BORDER_COLOR[toast.type] ?? '#6366F1'
  return (
    <div
      style={{
        minWidth: 300, maxWidth: 380, padding: '14px 16px',
        background: 'rgba(13,17,23,0.95)',
        border: `1px solid ${borderColor}30`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 16,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${borderColor}20`,
        display: 'flex', alignItems: 'flex-start', gap: 12,
        transform: toast.exiting ? 'translateX(120%)' : 'translateX(0)',
        opacity: toast.exiting ? 0 : 1,
        transition: toast.exiting ? 'transform 200ms ease-in, opacity 200ms ease-in' : 'transform 250ms ease-out',
      }}
    >
      <ToastIcon type={toast.type} />
      <div style={{ flex: 1 }}>
        {toast.title && <p style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', margin: 0 }}>{toast.title}</p>}
        <p style={{ fontSize: 13, color: toast.title ? '#94A3B8' : '#F1F5F9', margin: 0 }}>{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#475569', display: 'flex', alignItems: 'center' }}
        onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
        onMouseLeave={e => e.currentTarget.style.color = '#475569'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}
