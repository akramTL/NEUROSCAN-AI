import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart2, ExternalLink, AlertCircle, Loader2, Search, Upload } from 'lucide-react'
import { getAnalyses, getPatients } from '../api/api'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'
import ResultBadge from '../components/ResultBadge'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function Initials({ first, last }) {
  const letters = ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '?'
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(99,102,241,0.15)',
      border: '1px solid rgba(99,102,241,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#818CF8',
    }}>
      {letters}
    </div>
  )
}

const COL = '2fr 1.1fr 90px 100px 120px 72px'

function TableHeader() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: COL,
      padding: '11px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
    }}>
      {['Patient', 'Date', 'Diagnosis', 'Confidence', 'Status', ''].map(h => (
        <span key={h} style={{
          fontSize: 10, fontWeight: 700, color: '#475569',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {h}
        </span>
      ))}
    </div>
  )
}

function TableRow({ analysis, patient, index, total }) {
  const name = patient
    ? `${patient.first_name} ${patient.last_name}`
    : 'Unknown patient'
  const date = fmtDate(analysis.completed_at || analysis.created_at)
  const conf = analysis.confidence_score != null
    ? `${(analysis.confidence_score * 100).toFixed(1)}%`
    : '—'
  const isLast = index === total - 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'grid', gridTemplateColumns: COL,
        padding: '13px 20px',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
        alignItems: 'center',
      }}
      whileHover={{ background: 'rgba(255,255,255,0.025)' }}
    >
      {/* Patient */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Initials first={patient?.first_name} last={patient?.last_name} />
        <span style={{
          fontSize: 13, fontWeight: 600, color: '#F1F5F9',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </span>
      </div>

      {/* Date */}
      <span style={{ fontSize: 13, color: '#94A3B8' }}>{date}</span>

      {/* Diagnosis badge */}
      <div><ResultBadge result={analysis.result} /></div>

      {/* Confidence */}
      <span style={{
        fontSize: 13, fontFamily: 'monospace',
        color: analysis.confidence_score != null ? '#F1F5F9' : '#475569',
        fontWeight: analysis.confidence_score != null ? 600 : 400,
      }}>
        {conf}
      </span>

      {/* Status badge */}
      <div><StatusBadge status={analysis.status} /></div>

      {/* View link */}
      <div>
        <Link
          to={`/analysis/${analysis.id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, color: '#818CF8',
            textDecoration: 'none',
            padding: '5px 11px', borderRadius: 8,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.2)'
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.1)'
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
          }}
        >
          <ExternalLink size={11} />
          View
        </Link>
      </div>
    </motion.div>
  )
}

export default function Analyses() {
  const [search, setSearch] = useState('')

  const { data: analyses = [], isLoading: loadingA, isError } = useQuery({
    queryKey: ['analyses'],
    queryFn: getAnalyses,
    staleTime: 30_000,
  })

  const { data: patients = [], isLoading: loadingP } = useQuery({
    queryKey: ['patients'],
    queryFn: getPatients,
    staleTime: 60_000,
  })

  const patientMap = useMemo(() => {
    const map = {}
    for (const p of patients) map[p.id] = p
    return map
  }, [patients])

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...analyses]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .filter(a => {
        if (!term) return true
        const p = patientMap[a.patient_id]
        const name = p ? `${p.first_name} ${p.last_name}`.toLowerCase() : ''
        return (
          name.includes(term) ||
          (a.result ?? '').toLowerCase().includes(term) ||
          a.status.includes(term)
        )
      })
  }, [analyses, patientMap, search])

  const loading = loadingA || loadingP

  // ── Error state ────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="page-enter">
        <PageHeader count={0} search={search} onSearch={setSearch} />
        <GlassCard style={{ padding: 56, textAlign: 'center' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', margin: '0 auto 14px', display: 'block' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: '0 0 8px' }}>
            Failed to load analyses
          </p>
          <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
            Check your network connection or try refreshing the page.
          </p>
        </GlassCard>
      </div>
    )
  }

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader count={0} search={search} onSearch={setSearch} showCount={false} />
        <GlassCard style={{ padding: 72, textAlign: 'center' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.06)',
              borderTopColor: '#6366F1',
              boxShadow: '0 0 24px rgba(99,102,241,0.4)',
              margin: '0 auto 20px',
            }}
          />
          <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>Loading analyses…</p>
        </GlassCard>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="page-enter">
        <PageHeader count={analyses.length} search={search} onSearch={setSearch} />
        <GlassCard style={{ padding: 72, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            {search
              ? <Search size={28} style={{ color: '#475569' }} />
              : <BarChart2 size={28} style={{ color: '#475569' }} />}
          </div>
          {search ? (
            <>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: '0 0 8px' }}>
                No results for "{search}"
              </p>
              <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                Try a different patient name, diagnosis, or status.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: '0 0 8px' }}>
                No analyses yet
              </p>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 24px' }}>
                Upload a patient scan to get started.
              </p>
              <Link to="/patients" style={{ textDecoration: 'none' }}>
                <button className="btn-primary">
                  <Upload size={14} />
                  Go to Patients
                </button>
              </Link>
            </>
          )}
        </GlassCard>
      </div>
    )
  }

  // ── Table ──────────────────────────────────────────────────────
  return (
    <div className="page-enter">
      <PageHeader count={analyses.length} search={search} onSearch={setSearch} />
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <TableHeader />
        {rows.map((analysis, i) => (
          <TableRow
            key={analysis.id}
            analysis={analysis}
            patient={patientMap[analysis.patient_id]}
            index={i}
            total={rows.length}
          />
        ))}
      </GlassCard>
    </div>
  )
}

// ── Page header (shared across states) ────────────────────────────────────────
function PageHeader({ count, search, onSearch, showCount = true }) {
  return (
    <div style={{
      marginBottom: 28,
      display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
            Analyses
          </p>
          {showCount && count > 0 && (
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#818CF8',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 9999, padding: '2px 10px',
            }}>
              {count}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: '#475569', marginTop: 4, marginBottom: 0 }}>
          All patient analyses across your practice
        </p>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 9999, padding: '8px 16px', width: 260,
      }}>
        <Search size={14} style={{ color: '#475569', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by patient, result, status…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          style={{
            border: 'none', background: 'transparent', outline: 'none',
            fontSize: 13, flex: 1, color: '#F1F5F9', fontFamily: 'inherit',
          }}
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >
            <span style={{ fontSize: 16, color: '#475569', lineHeight: 1 }}>×</span>
          </button>
        )}
      </div>
    </div>
  )
}
