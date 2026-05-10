import { useState, useRef, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Brain, LayoutDashboard, Users, Upload,
  BarChart2, Bell, Search, Zap,
  LogOut, User, Settings, ChevronDown, Shield,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { getAnalyses } from '../api/api'
import ParticleBackground from './ParticleBackground'
import GlowOrbs from './GlowOrbs'
import SettingsModal, { loadSettings, applySettings } from './SettingsModal'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard', exact: true  },
  { to: '/patients', icon: Users,           label: 'Patients',  exact: false },
  { to: '/patients', icon: Upload,          label: 'Upload',    exact: false, href: '/patients?action=analyze' },
  { to: '/analysis', icon: BarChart2,       label: 'Analyses',  exact: false },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getInitials(fullName) {
  if (!fullName) return 'DR'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ProfileDropdown({ doctor, initials, firstName, onLogout, onClose, onSettings }) {
  const items = [
    {
      icon: User,
      label: 'Profile',
      sublabel: doctor?.email ?? '',
      onClick: () => { onClose() },
    },
    {
      icon: Shield,
      label: 'Security',
      sublabel: 'Password & sessions',
      onClick: () => { onClose() },
    },
    {
      icon: Settings,
      label: 'Settings',
      sublabel: 'Preferences & appearance',
      onClick: () => { onClose(); onSettings?.() },
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -8 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
        width: 260, zIndex: 500,
        background: 'rgba(13,17,23,0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(99,102,241,0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
          boxShadow: '0 0 16px rgba(99,102,241,0.4)',
        }}>
          {initials}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Dr.&nbsp;{firstName}
          </p>
          <p style={{ fontSize: 12, color: '#475569', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {doctor?.email ?? 'doctor@hospital.com'}
          </p>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '8px 0' }}>
        {items.map(({ icon: Icon, label, sublabel, onClick }) => (
          <motion.button
            key={label}
            onClick={onClick}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', border: 'none', background: 'none',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            }}
            whileHover={{ background: 'rgba(255,255,255,0.04)' }}
            whileTap={{ scale: 0.98 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={14} style={{ color: '#818CF8' }} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', margin: 0 }}>{label}</p>
              {sublabel && <p style={{ fontSize: 11, color: '#475569', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sublabel}</p>}
            </div>
          </motion.button>
        ))}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

      {/* Logout */}
      <div style={{ padding: '8px 0 8px' }}>
        <motion.button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', border: 'none', background: 'none',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          }}
          whileHover={{ background: 'rgba(239,68,68,0.08)' }}
          whileTap={{ scale: 0.98 }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <LogOut size={14} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', margin: 0 }}>Sign out</p>
            <p style={{ fontSize: 11, color: '#475569', margin: '1px 0 0' }}>End your session</p>
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function Layout() {
  const { doctor, logout } = useAuth()
  const location   = useLocation()
  const navigate   = useNavigate()
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(loadSettings)
  const profileRef = useRef(null)

  // Apply saved settings on mount (accent color, etc.)
  useEffect(() => {
    applySettings(loadSettings())
  }, [])

  const { data: analyses = [] } = useQuery({
    queryKey: ['analyses'],
    queryFn: getAnalyses,
    staleTime: 30_000,
  })

  const pendingCount = analyses.filter(
    a => a.status === 'pending' || a.status === 'processing'
  ).length

  const isActive = ({ to, exact }) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  const initials  = getInitials(doctor?.full_name)
  const nameParts = doctor?.full_name?.trim().split(/\s+/) ?? []
  const firstName = nameParts.find(p => !p.match(/^Dr\.?$/i)) ?? nameParts[0] ?? 'Doctor'

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [profileOpen])

  // Close profile on Escape
  useEffect(() => {
    if (!profileOpen) return
    function handleKey(e) {
      if (e.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [profileOpen])

  const handleLogout = () => {
    setProfileOpen(false)
    logout()
  }

  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings)
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#080B14',
      position: 'relative',
    }}>
      <GlowOrbs />
      {settings.particles && <ParticleBackground />}

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="desktop-sidebar" style={{
        position: 'fixed', left: 0, top: 0,
        width: 72, height: '100vh', zIndex: 100,
        background: 'rgba(13,17,23,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '20px 0',
      }}>
        {/* Logo */}
        <motion.div
          onClick={() => navigate('/')}
          style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 28, cursor: 'pointer',
          }}
          animate={{ boxShadow: [
            '0 0 20px rgba(99,102,241,0.4)',
            '0 0 40px rgba(99,102,241,0.7)',
            '0 0 20px rgba(99,102,241,0.4)',
          ]}}
          transition={{ duration: 2.5, repeat: Infinity }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Brain size={22} color="#fff" />
        </motion.div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {NAV.map(({ to, href, icon: Icon, label, exact }, i) => {
            const active = isActive({ to, exact })
            return (
              <motion.button
                key={label}
                title={label}
                onClick={() => navigate(href ?? to)}
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  border: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: active ? '#818CF8' : '#475569',
                  position: 'relative',
                }}
                whileHover={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 12,
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.4)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={19} strokeWidth={1.8} style={{ position: 'relative', zIndex: 1 }} />
              </motion.button>
            )
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Sidebar avatar — also opens settings */}
        <motion.div
          onClick={() => { setProfileOpen(false); setSettingsOpen(true) }}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
            marginBottom: 16, cursor: 'pointer', userSelect: 'none',
            boxShadow: '0 0 16px rgba(99,102,241,0.4)',
          }}
          title="Settings"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {initials}
        </motion.div>
      </aside>

      {/* ── Content ──────────────────────────────────── */}
      <div className="main-content-area" style={{
        marginLeft: 72, flex: 1, minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 1,
      }}>
        {/* Top bar */}
        <header style={{
          padding: '20px 32px 0 32px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28, flexShrink: 0,
        }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', margin: 0, lineHeight: 1.3 }}>
              {getGreeting()},{' '}
              <span style={{
                background: 'linear-gradient(135deg,#818CF8,#A78BFA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Dr.&nbsp;{firstName}
              </span>
              {' '}👋
            </p>
            <p style={{ fontSize: 13, color: '#475569', marginTop: 2, marginBottom: 0, fontWeight: 400 }}>
              {settings.hospitalName
                ? settings.hospitalName
                : 'Your AI diagnostics platform'}
            </p>
          </motion.div>

          {/* Search pill */}
          <div className="topbar-center" style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: 9999, padding: '10px 20px',
            width: 280, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Search size={15} style={{ color: '#475569', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search patients..."
              style={{
                border: 'none', background: 'transparent',
                outline: 'none', fontSize: 13, flex: 1,
                color: '#F1F5F9', fontFamily: 'inherit', fontWeight: 400,
              }}
            />
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.button
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
              whileHover={{ background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={16} style={{ color: '#94A3B8' }} />
              {pendingCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#EF4444',
                    boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                  }}
                />
              )}
            </motion.button>

            <motion.div
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 9999, padding: '6px 14px',
                fontSize: 12, fontWeight: 600, color: '#818CF8',
              }}
              animate={{ boxShadow: [
                '0 0 8px rgba(99,102,241,0.2)',
                '0 0 16px rgba(99,102,241,0.4)',
                '0 0 8px rgba(99,102,241,0.2)',
              ]}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap size={12} />
              AI Active
            </motion.div>

            {/* Profile button + dropdown */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <motion.button
                onClick={() => setProfileOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: profileOpen ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                  border: profileOpen ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 9999, padding: '4px 10px 4px 4px',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                whileHover={{ background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)' }}
                whileTap={{ scale: 0.97 }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 0 10px rgba(99,102,241,0.4)',
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>
                  Dr.&nbsp;{firstName}
                </span>
                <motion.div
                  animate={{ rotate: profileOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} style={{ color: '#475569' }} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <ProfileDropdown
                    doctor={doctor}
                    initials={initials}
                    firstName={firstName}
                    onLogout={handleLogout}
                    onClose={() => setProfileOpen(false)}
                    onSettings={() => setSettingsOpen(true)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '0 32px 32px 32px', flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav style={{
        display: 'none', position: 'fixed',
        bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(13,17,23,0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 0',
      }} className="mobile-tab-bar">
        {NAV.map(({ to, href, icon: Icon, label, exact }) => {
          const active = isActive({ to, exact })
          return (
            <button key={label}
              onClick={() => navigate(href ?? to)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4,
                border: 'none', background: 'none',
                cursor: 'pointer', padding: '6px 0',
                color: active ? '#818CF8' : '#475569',
                fontFamily: 'inherit',
              }}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Settings modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
      />

      <style>{`
        @media (max-width: 768px) {
          .mobile-tab-bar { display: flex !important; }
          .desktop-sidebar { display: none !important; }
          .main-content-area { margin-left: 0 !important; padding-bottom: 80px; }
          .topbar-center { display: none !important; }
        }
      `}</style>
    </div>
  )
}
