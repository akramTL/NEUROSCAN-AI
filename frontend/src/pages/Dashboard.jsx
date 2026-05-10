import { useMemo, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Upload, UserPlus, Users, Activity, AlertCircle, Calendar } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { getPatients, getAnalyses } from '../api/api'
import ResultBadge from '../components/ResultBadge'
import StatusBadge from '../components/StatusBadge'
import GlassCard from '../components/GlassCard'
import AnimatedNumber from '../components/AnimatedNumber'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)      return 'just now'
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getInitials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function StatCard({ label, value, subStats, icon, iconGradient, iconGlow, delay }) {
  return (
    <GlassCard delay={delay} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: iconGradient,
        boxShadow: iconGlow,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, color: '#fff', flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: 12, fontWeight: 600, color: '#475569',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        display: 'block', marginBottom: 12,
      }}>{label}</span>
      <p style={{ fontSize: 36, fontWeight: 800, color: '#F1F5F9', margin: '0 0 4px', lineHeight: 1, letterSpacing: '-0.03em' }}>
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </p>
      {subStats && (
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{subStats}</p>
      )}
    </GlassCard>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(13,17,23,0.95)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 14, padding: '10px 14px', fontSize: 13,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: '#94A3B8', margin: '0 0 4px' }}>{label}</p>
      <p style={{ color: '#818CF8', fontWeight: 600, margin: 0 }}>{payload[0].value} analyses</p>
    </div>
  )
}

function DistBar({ value, total, color }) {
  const [width, setWidth] = useState('0%')
  useEffect(() => {
    const t = setTimeout(() => setWidth(total > 0 ? `${(value / total) * 100}%` : '0%'), 50)
    return () => clearTimeout(t)
  }, [value, total])
  return (
    <div className="progress-track" style={{ marginTop: 6, height: 8 }}>
      <div style={{
        height: '100%', borderRadius: 9999, width,
        background: color,
        transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: `0 0 8px ${color}80`,
      }} />
    </div>
  )
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: patients = [], isLoading: loadingPts } = useQuery({ queryKey: ['patients'], queryFn: getPatients })
  const { data: analyses = [], isLoading: loadingAn  } = useQuery({ queryKey: ['analyses'],  queryFn: getAnalyses  })

  const patientMap = useMemo(
    () => Object.fromEntries(patients.map(p => [p.id, `${p.first_name} ${p.last_name}`])),
    [patients]
  )

  const today      = new Date().toISOString().slice(0, 10)
  const inProgress = analyses.filter(a => a.status === 'pending' || a.status === 'processing').length
  const todayCount = analyses.filter(a => a.created_at?.slice(0, 10) === today).length
  const adCount    = analyses.filter(a => a.result === 'AD').length
  const mciCount   = analyses.filter(a => a.result === 'MCI').length
  const cnCount    = analyses.filter(a => a.result === 'CN').length
  const total      = cnCount + mciCount + adCount

  const weekData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().slice(0, 10)
      const count = analyses.filter(a => a.created_at?.slice(0, 10) === key).length
      return { day: DAYS[d.getDay()], count }
    })
  }, [analyses])

  const weekTotal = weekData.reduce((s, d) => s + d.count, 0)

  const recent = useMemo(
    () => [...analyses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8),
    [analyses]
  )

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Row 1: Stat cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <StatCard
          label="Total patients"
          value={loadingPts ? '…' : patients.length}
          subStats={`${patients.length} registered · ${inProgress} active`}
          icon={<Users size={20} />}
          iconGradient="linear-gradient(135deg,#6366F1,#8B5CF6)"
          iconGlow="0 0 20px rgba(99,102,241,0.5)"
          delay={0}
        />
        <StatCard
          label="Total analyses"
          value={loadingAn ? '…' : analyses.length}
          subStats={`${todayCount} today · ${inProgress} in progress`}
          icon={<Activity size={20} />}
          iconGradient="linear-gradient(135deg,#06B6D4,#0891B2)"
          iconGlow="0 0 20px rgba(6,182,212,0.5)"
          delay={0.1}
        />
        <StatCard
          label="AD detected"
          value={loadingAn ? '…' : adCount}
          subStats={`${mciCount} MCI · ${cnCount} CN`}
          icon={<AlertCircle size={20} />}
          iconGradient="linear-gradient(135deg,#EF4444,#DC2626)"
          iconGlow="0 0 20px rgba(239,68,68,0.5)"
          delay={0.2}
        />
      </div>

      {/* ── Row 2: 65/35 ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '65fr 35fr', gap: 20 }}>
        {/* Analytics card */}
        <GlassCard delay={0.3}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>Analytics</span>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 9999, padding: '5px 12px',
              background: 'rgba(255,255,255,0.04)',
              cursor: 'pointer', fontSize: 13,
              color: '#94A3B8', fontFamily: 'inherit',
            }}>
              <Calendar size={13} />
              Weekly
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{
              fontSize: 28, fontWeight: 700,
              background: 'linear-gradient(135deg,#818CF8,#A78BFA)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{weekTotal}</span>
            <span className="stat-change-up">+{weekTotal > 0 ? Math.round((weekTotal / Math.max(analyses.length, 1)) * 100) : 0}% this week</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData} barCategoryGap="30%">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Result distribution */}
          <GlassCard delay={0.4}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 16 }}>Result distribution</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'CN — Normal',   count: cnCount,  pct: total > 0 ? Math.round((cnCount / total) * 100) : 0,  color: '#10B981' },
                { label: 'MCI — Mild',    count: mciCount, pct: total > 0 ? Math.round((mciCount / total) * 100) : 0, color: '#F59E0B' },
                { label: 'AD — Detected', count: adCount,  pct: total > 0 ? Math.round((adCount / total) * 100) : 0,  color: '#EF4444' },
              ].map(({ label, count, pct, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#94A3B8' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
                  </div>
                  <DistBar value={count} total={total} color={color} />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick actions */}
          <GlassCard delay={0.5}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>Quick actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/patients?action=analyze')}>
                <Upload size={15} />
                New analysis
              </button>
              <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/patients?action=add')}>
                <UserPlus size={15} />
                Add patient
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── Recent analyses ──────────────────────────────────── */}
      <GlassCard delay={0.6} style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Recent analyses</p>
          <Link to="/patients" style={{ fontSize: 13, color: '#818CF8', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
        </div>

        {loadingAn ? (
          <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Loading…</p>
        ) : recent.length === 0 ? (
          <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No analyses yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Patient', 'Date', 'Status', 'Result', 'Confidence', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '0 0 10px',
                    fontSize: 12, color: '#475569', fontWeight: 500,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((a, i) => {
                const name = patientMap[a.patient_id] ?? 'Unknown'
                return (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/analysis/${a.id}`)}
                  >
                    <td style={{ padding: '14px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{getInitials(name)}</div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500, color: '#F1F5F9', margin: 0 }}>{name}</p>
                          <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{timeAgo(a.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', fontSize: 13, color: '#94A3B8' }}>
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 8px' }}><StatusBadge status={a.status} /></td>
                    <td style={{ padding: '14px 8px' }}><ResultBadge result={a.result} /></td>
                    <td style={{ padding: '14px 8px' }}>
                      {a.confidence_score != null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-track" style={{ width: 60 }}>
                            <div className="progress-fill-accent" style={{ width: `${(a.confidence_score * 100).toFixed(0)}%` }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{(a.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                      ) : <span style={{ color: '#475569' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 0', textAlign: 'right' }}>
                      <span style={{ fontSize: 13, color: '#818CF8', fontWeight: 500 }}>View →</span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  )
}
