import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Palette, Bell, SlidersHorizontal, User, Check,
  Monitor, Sparkles, Volume2, Mail, Clock,
  Shield, Building2, Stethoscope, RefreshCw,
  Database, BarChart2,
} from 'lucide-react'

// ── Settings config ────────────────────────────────────────────
export const ACCENT_COLORS = [
  { id: 'indigo',  label: 'Indigo',  primary: '#6366F1', bright: '#818CF8', gradient: 'linear-gradient(135deg,#6366F1,#8B5CF6)' },
  { id: 'violet',  label: 'Violet',  primary: '#8B5CF6', bright: '#A78BFA', gradient: 'linear-gradient(135deg,#8B5CF6,#C084FC)' },
  { id: 'cyan',    label: 'Cyan',    primary: '#06B6D4', bright: '#22D3EE', gradient: 'linear-gradient(135deg,#06B6D4,#0EA5E9)' },
  { id: 'emerald', label: 'Emerald', primary: '#10B981', bright: '#34D399', gradient: 'linear-gradient(135deg,#10B981,#059669)' },
  { id: 'rose',    label: 'Rose',    primary: '#F43F5E', bright: '#FB7185', gradient: 'linear-gradient(135deg,#F43F5E,#E11D48)' },
  { id: 'amber',   label: 'Amber',   primary: '#F59E0B', bright: '#FCD34D', gradient: 'linear-gradient(135deg,#F59E0B,#D97706)' },
]

export const DEFAULT_SETTINGS = {
  accentColor: 'indigo',
  density: 'comfortable',
  reduceMotion: false,
  particles: true,
  analysisComplete: true,
  adPositiveAlert: true,
  soundAlerts: false,
  emailDigest: 'never',
  showFeatureImportance: true,
  autoRefreshInterval: 3,
  resultsPerPage: 10,
  defaultSort: 'newest',
  hospitalName: '',
  specialty: 'Neurology',
  sessionTimeout: 30,
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem('neuroscan_settings')
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch { return { ...DEFAULT_SETTINGS } }
}

function applyCSS(settings) {
  const color = ACCENT_COLORS.find(c => c.id === settings.accentColor) ?? ACCENT_COLORS[0]
  const r = document.documentElement
  r.style.setProperty('--accent', color.primary)
  r.style.setProperty('--accent-bright', color.bright)
  r.style.setProperty('--accent-gradient', color.gradient)
  r.style.setProperty('--accent-solid', color.primary)
  r.style.setProperty('--gradient-accent', color.gradient)
  r.style.setProperty('--gradient-card', color.gradient)
}

export function applySettings(settings) {
  applyCSS(settings)
  localStorage.setItem('neuroscan_settings', JSON.stringify(settings))
}

// ── Primitives ─────────────────────────────────────────────────
function Toggle({ value, onChange, accent, disabled = false }) {
  return (
    <motion.div
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 9999,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: value && !disabled ? accent : 'rgba(255,255,255,0.08)',
        border: `1px solid ${value && !disabled ? accent + '50' : 'rgba(255,255,255,0.1)'}`,
        position: 'relative', flexShrink: 0,
        boxShadow: value && !disabled ? `0 0 12px ${accent}40` : 'none',
        transition: 'background 0.2s, box-shadow 0.2s',
        opacity: disabled ? 0.35 : 1,
      }}
      whileTap={disabled ? {} : { scale: 0.94 }}
    >
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute', top: 2,
          width: 18, height: 18, borderRadius: '50%',
          background: value && !disabled ? '#fff' : '#475569',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      />
    </motion.div>
  )
}

function Segmented({ options, value, onChange, accent }) {
  return (
    <div style={{
      display: 'flex', gap: 3,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: 3,
    }}>
      {options.map(o => {
        const active = value === (o.value ?? o)
        return (
          <motion.button
            key={o.value ?? o}
            type="button"
            onClick={() => onChange(o.value ?? o)}
            style={{
              padding: '4px 10px', borderRadius: 7, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              background: active ? accent : 'transparent',
              color: active ? '#fff' : '#475569',
              boxShadow: active ? `0 0 10px ${accent}40` : 'none',
              transition: 'all 0.15s',
            }}
            whileTap={{ scale: 0.95 }}
          >
            {o.label ?? o}
          </motion.button>
        )
      })}
    </div>
  )
}

function StyledSelect({ options, value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '6px 28px 6px 10px',
        color: '#F1F5F9', fontSize: 12, fontFamily: 'inherit',
        cursor: 'pointer', outline: 'none',
        WebkitAppearance: 'none', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: '#0D1117', color: '#F1F5F9' }}>{o.label}</option>
      ))}
    </select>
  )
}

function StyledInput({ value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="text" value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${focused ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 10, padding: '7px 12px',
        color: '#F1F5F9', fontSize: 13, fontFamily: 'inherit',
        outline: 'none', width: 192, transition: 'border-color 0.2s',
      }}
    />
  )
}

function SettingRow({ icon: Icon, title, description, children, accent, badge }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: `${accent}18`, border: `1px solid ${accent}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} style={{ color: accent }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', margin: 0 }}>{title}</p>
            {badge && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 5, padding: '1px 5px', letterSpacing: '0.04em',
              }}>{badge}</span>
            )}
          </div>
          {description && (
            <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0', lineHeight: 1.5 }}>{description}</p>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function SectionHeading({ children }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 800, color: '#334155',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      margin: '20px 0 4px',
    }}>{children}</p>
  )
}

// ── Tab: Appearance ────────────────────────────────────────────
function AppearanceTab({ s, set, accent, colorObj }) {
  return (
    <div>
      <SectionHeading>Accent Color</SectionHeading>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '12px 0 4px' }}>
        {ACCENT_COLORS.map(c => (
          <motion.button
            key={c.id}
            type="button"
            onClick={() => set('accentColor', c.id)}
            title={c.label}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: c.gradient,
              border: s.accentColor === c.id ? '3px solid rgba(255,255,255,0.9)' : '3px solid transparent',
              cursor: 'pointer', padding: 0,
              boxShadow: s.accentColor === c.id ? `0 0 20px ${c.primary}70` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'box-shadow 0.2s, border 0.2s',
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.88 }}
          >
            {s.accentColor === c.id && <Check size={16} color="#fff" strokeWidth={3} />}
          </motion.button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#475569', marginTop: 6, marginBottom: 0 }}>
        Selected: <span style={{ color: accent, fontWeight: 700 }}>{colorObj.label}</span>
        {' '}— preview updates live
      </p>

      <SectionHeading>UI Density</SectionHeading>
      <div style={{ display: 'flex', gap: 10, padding: '12px 0 4px' }}>
        {[
          { id: 'comfortable', label: 'Comfortable', desc: 'More breathing room', gaps: [4, 4, 4] },
          { id: 'compact',     label: 'Compact',     desc: 'More content visible', gaps: [2, 2, 2] },
        ].map(d => (
          <motion.button
            key={d.id}
            type="button"
            onClick={() => set('density', d.id)}
            style={{
              flex: 1, padding: '14px 12px', borderRadius: 14,
              background: s.density === d.id ? `${accent}18` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${s.density === d.id ? accent + '45' : 'rgba(255,255,255,0.06)'}`,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
              boxShadow: s.density === d.id ? `0 0 16px ${accent}18` : 'none',
              transition: 'all 0.2s',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: d.id === 'compact' ? 2 : 5, marginBottom: 9 }}>
              {[24, 16, 20].map((w, i) => (
                <div key={i} style={{ height: 3, width: w, borderRadius: 9999, background: s.density === d.id ? accent : '#334155', transition: 'background 0.2s' }} />
              ))}
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: s.density === d.id ? accent : '#64748B', margin: 0, transition: 'color 0.2s' }}>{d.label}</p>
            <p style={{ fontSize: 11, color: '#334155', margin: '2px 0 0' }}>{d.desc}</p>
          </motion.button>
        ))}
      </div>

      <SectionHeading>Motion & Effects</SectionHeading>
      <SettingRow icon={Monitor} title="Reduce animations" description="Minimize motion for accessibility or performance" accent={accent}>
        <Toggle value={s.reduceMotion} onChange={v => set('reduceMotion', v)} accent={accent} />
      </SettingRow>
      <SettingRow icon={Sparkles} title="Particle background" description="Animated floating dots and connection lines behind the UI" accent={accent}>
        <Toggle value={s.particles} onChange={v => set('particles', v)} accent={accent} />
      </SettingRow>
    </div>
  )
}

// ── Tab: Notifications ─────────────────────────────────────────
function NotificationsTab({ s, set, accent }) {
  return (
    <div>
      <SectionHeading>In-App Alerts</SectionHeading>
      <SettingRow icon={Bell} title="Analysis complete" description="Show a notification toast when a scan finishes" accent={accent}>
        <Toggle value={s.analysisComplete} onChange={v => set('analysisComplete', v)} accent={accent} />
      </SettingRow>
      <SettingRow icon={Shield} title="High-risk AD alert" description="Show a bold warning banner when the result is Alzheimer's" accent={accent}>
        <Toggle value={s.adPositiveAlert} onChange={v => set('adPositiveAlert', v)} accent={accent} />
      </SettingRow>
      <SettingRow icon={Volume2} title="Sound effects" description="Play a chime when analysis results are ready" accent={accent}>
        <Toggle value={s.soundAlerts} onChange={v => set('soundAlerts', v)} accent={accent} />
      </SettingRow>

      <SectionHeading>Email Preferences</SectionHeading>
      <SettingRow icon={Mail} title="Email digest" description="Periodic summary of patient analyses sent to your inbox" accent={accent}>
        <StyledSelect
          value={s.emailDigest}
          onChange={v => set('emailDigest', v)}
          options={[
            { value: 'never',   label: 'Never' },
            { value: 'daily',   label: 'Daily' },
            { value: 'weekly',  label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
      </SettingRow>

      <div style={{
        marginTop: 20, padding: 14,
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.12)',
        borderRadius: 14, fontSize: 11, color: '#64748B', lineHeight: 1.6,
      }}>
        <span style={{ color: accent, fontWeight: 700 }}>Note:</span> Email delivery requires server-side configuration. Preferences are saved locally to your browser.
      </div>
    </div>
  )
}

// ── Tab: Diagnostics ───────────────────────────────────────────
function DiagnosticsTab({ s, set, accent }) {
  return (
    <div>
      <SectionHeading>Result Display</SectionHeading>
      <SettingRow icon={BarChart2} title="Feature importance chart" description="Show which biomarkers drove the AI's decision on the result page" accent={accent}>
        <Toggle value={s.showFeatureImportance} onChange={v => set('showFeatureImportance', v)} accent={accent} />
      </SettingRow>
      <SettingRow icon={Database} title="Results per page" description="How many analyses to show per page in the list view" accent={accent}>
        <Segmented
          value={s.resultsPerPage}
          onChange={v => set('resultsPerPage', Number(v))}
          options={[
            { value: 5,  label: '5' },
            { value: 10, label: '10' },
            { value: 20, label: '20' },
          ]}
          accent={accent}
        />
      </SettingRow>
      <SettingRow icon={SlidersHorizontal} title="Default sort order" description="How analyses are sorted when you open the list" accent={accent}>
        <StyledSelect
          value={s.defaultSort}
          onChange={v => set('defaultSort', v)}
          options={[
            { value: 'newest',  label: 'Newest first' },
            { value: 'oldest',  label: 'Oldest first' },
            { value: 'status',  label: 'By status' },
            { value: 'patient', label: 'By patient name' },
          ]}
        />
      </SettingRow>

      <SectionHeading>Processing</SectionHeading>
      <SettingRow icon={RefreshCw} title="Auto-refresh interval" description="How often to poll the server for pending analysis results" accent={accent}>
        <Segmented
          value={s.autoRefreshInterval}
          onChange={v => set('autoRefreshInterval', Number(v))}
          options={[
            { value: 3,  label: '3s' },
            { value: 5,  label: '5s' },
            { value: 10, label: '10s' },
            { value: 30, label: '30s' },
          ]}
          accent={accent}
        />
      </SettingRow>
    </div>
  )
}

// ── Tab: Account ───────────────────────────────────────────────
function AccountTab({ s, set, accent }) {
  return (
    <div>
      <SectionHeading>Practice Information</SectionHeading>
      <SettingRow icon={Building2} title="Hospital / Clinic" description="Displayed on generated reports and your profile" accent={accent}>
        <StyledInput value={s.hospitalName} onChange={v => set('hospitalName', v)} placeholder="e.g. City General Hospital" />
      </SettingRow>
      <SettingRow icon={Stethoscope} title="Medical specialty" description="Your primary clinical specialty" accent={accent}>
        <StyledSelect
          value={s.specialty}
          onChange={v => set('specialty', v)}
          options={[
            { value: 'Neurology',        label: 'Neurology' },
            { value: 'Psychiatry',       label: 'Psychiatry' },
            { value: 'Geriatrics',       label: 'Geriatrics' },
            { value: 'Radiology',        label: 'Radiology' },
            { value: 'Neuropsychology',  label: 'Neuropsychology' },
            { value: 'Research',         label: 'Research / Academia' },
            { value: 'General',          label: 'General Practice' },
          ]}
        />
      </SettingRow>

      <SectionHeading>Security</SectionHeading>
      <SettingRow icon={Clock} title="Session timeout" description="Automatically sign out after a period of inactivity" accent={accent}>
        <Segmented
          value={s.sessionTimeout}
          onChange={v => set('sessionTimeout', Number(v))}
          options={[
            { value: 15, label: '15m' },
            { value: 30, label: '30m' },
            { value: 60, label: '1h' },
            { value: 0,  label: 'Never' },
          ]}
          accent={accent}
        />
      </SettingRow>
      <SettingRow icon={Shield} title="Two-factor authentication" description="Add an extra layer of security to your account" accent={accent} badge="Soon">
        <Toggle value={false} onChange={() => {}} accent={accent} disabled />
      </SettingRow>

      <SectionHeading>Data & Privacy</SectionHeading>
      <SettingRow icon={Database} title="Export my data" description="Download all your patient analyses and results as CSV" accent={accent} badge="Soon">
        <motion.button
          disabled
          style={{
            padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            color: '#334155', cursor: 'not-allowed', fontFamily: 'inherit',
          }}
        >
          Export
        </motion.button>
      </SettingRow>
    </div>
  )
}

// ── Tabs config ────────────────────────────────────────────────
const TABS = [
  { id: 'appearance',    label: 'Appearance',   icon: Palette          },
  { id: 'notifications', label: 'Notifications', icon: Bell             },
  { id: 'diagnostics',   label: 'Diagnostics',   icon: SlidersHorizontal },
  { id: 'account',       label: 'Account',       icon: User             },
]

// ── Main modal ─────────────────────────────────────────────────
export default function SettingsModal({ isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('appearance')
  const [s, setS] = useState(loadSettings)
  const [saved, setSaved] = useState(false)

  const colorObj = ACCENT_COLORS.find(c => c.id === s.accentColor) ?? ACCENT_COLORS[0]
  const accent   = colorObj.primary

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setS(loadSettings())
      setActiveTab('appearance')
      setSaved(false)
    }
  }, [isOpen])

  // Live accent-color preview
  useEffect(() => {
    if (!isOpen) return
    applyCSS(s)
  }, [s.accentColor, isOpen])

  const set = (key, value) => setS(prev => ({ ...prev, [key]: value }))

  const handleSave = () => {
    applySettings(s)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onSave?.(s)
  }

  const handleClose = () => {
    applyCSS(loadSettings()) // revert any unsaved accent preview
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return
    const h = e => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 900,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="settings-panel"
            initial={{ opacity: 0, scale: 0.93, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 18 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 901,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24, pointerEvents: 'none',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 840,
                background: 'rgba(7,9,17,0.99)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 28,
                boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.9), 0 0 80px ${accent}12`,
                overflow: 'hidden', pointerEvents: 'all',
                display: 'flex', flexDirection: 'column',
                maxHeight: 'min(640px, 90vh)',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${accent}20`,
                    border: `1px solid ${accent}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 16px ${accent}25`,
                  }}>
                    <SlidersHorizontal size={16} style={{ color: accent }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>Settings</p>
                    <p style={{ fontSize: 11, color: '#475569', margin: '1px 0 0' }}>Customize your NeuroScan AI experience</p>
                  </div>
                </div>
                <motion.button
                  onClick={handleClose}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#94A3B8',
                  }}
                  whileHover={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', borderColor: 'rgba(239,68,68,0.25)' }}
                  whileTap={{ scale: 0.94 }}
                >
                  <X size={15} />
                </motion.button>
              </div>

              {/* Body */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                {/* Left tab list */}
                <div style={{
                  width: 192, flexShrink: 0,
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  padding: '12px 10px',
                  display: 'flex', flexDirection: 'column', gap: 3,
                  background: 'rgba(255,255,255,0.01)',
                }}>
                  {TABS.map(tab => {
                    const active = activeTab === tab.id
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', borderRadius: 12,
                          border: `1px solid ${active ? accent + '35' : 'transparent'}`,
                          background: active ? `${accent}15` : 'transparent',
                          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          color: active ? accent : '#475569',
                          boxShadow: active ? `0 0 14px ${accent}15` : 'none',
                          transition: 'all 0.15s',
                        }}
                        whileHover={{ background: `${accent}0D`, color: colorObj.bright }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <tab.icon size={15} strokeWidth={1.8} />
                        <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Right content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 16px' }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.12 }}
                    >
                      {activeTab === 'appearance'    && <AppearanceTab    s={s} set={set} accent={accent} colorObj={colorObj} />}
                      {activeTab === 'notifications'  && <NotificationsTab  s={s} set={set} accent={accent} />}
                      {activeTab === 'diagnostics'    && <DiagnosticsTab    s={s} set={set} accent={accent} />}
                      {activeTab === 'account'        && <AccountTab        s={s} set={set} accent={accent} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
                background: 'rgba(255,255,255,0.01)',
              }}>
                <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>
                  Stored locally in your browser · Never sent to the server
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button
                    onClick={handleClose}
                    style={{
                      padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer', color: '#94A3B8', fontFamily: 'inherit',
                    }}
                    whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSave}
                    style={{
                      padding: '7px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: saved ? 'rgba(16,185,129,0.18)' : colorObj.gradient,
                      border: `1px solid ${saved ? 'rgba(16,185,129,0.35)' : accent + '40'}`,
                      cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
                      boxShadow: `0 4px 16px ${saved ? 'rgba(16,185,129,0.25)' : accent + '35'}`,
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'background 0.3s, border 0.3s, box-shadow 0.3s',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {saved ? <><Check size={13} />Saved!</> : 'Save changes'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
