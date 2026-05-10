import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Upload, Brain } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPatient } from '../api/api'
import StatusBadge from '../components/StatusBadge'
import ResultBadge from '../components/ResultBadge'
import GlassCard from '../components/GlassCard'

function getInitials(first, last) {
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '?'
}

function ConfidenceBar({ score }) {
  if (score == null) return null
  const pct = `${(score * 100).toFixed(0)}%`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress-track" style={{ width: 80 }}>
        <div className="progress-fill-accent" style={{ width: pct }} />
      </div>
      <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{pct}</span>
    </div>
  )
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: patient, isLoading, isError } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(255,255,255,0.06)',
          borderTopColor: '#6366F1', borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          boxShadow: '0 0 20px rgba(99,102,241,0.3)',
        }} />
      </div>
    )
  }

  if (isError || !patient) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: '#94A3B8', fontSize: 14 }}>Patient not found.</p>
        <Link to="/patients" style={{ display: 'inline-block', marginTop: 12, color: '#818CF8', fontSize: 13, textDecoration: 'none' }}>
          ← Back to patients
        </Link>
      </div>
    )
  }

  const age = Math.floor((Date.now() - new Date(patient.date_of_birth)) / (365.25 * 24 * 3600 * 1000))
  const sorted = [...(patient.analyses ?? [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  return (
    <div className="page-enter" style={{ maxWidth: 760 }}>
      {/* Back */}
      <Link
        to="/patients"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6366F1', textDecoration: 'none', marginBottom: 20, fontWeight: 500 }}
      >
        <ArrowLeft size={14} style={{ color: '#6366F1' }} />
        All Patients
      </Link>

      {/* Hero card */}
      <GlassCard style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0,
          boxShadow: '0 0 24px rgba(99,102,241,0.5)',
        }}>
          {getInitials(patient.first_name, patient.last_name)}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
            {patient.first_name} {patient.last_name}
          </p>
          <p style={{ fontSize: 14, color: '#475569', margin: '4px 0 0' }}>
            {new Date(patient.date_of_birth).toLocaleDateString()} · {patient.gender?.replace(/_/g, ' ') ?? '—'} · {age} years
          </p>
        </div>

        <button
          className="btn-primary"
          style={{ flexShrink: 0 }}
          onClick={() => navigate(`/patients/${id}/upload`)}
        >
          <Upload size={15} />
          New analysis
        </button>
      </GlassCard>

      {/* Analysis history label */}
      <p style={{
        fontSize: 14, fontWeight: 700, color: '#F1F5F9',
        margin: '0 0 16px',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>Analysis history</p>

      {/* Analyses */}
      {sorted.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 0 40px rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Brain size={28} style={{ color: '#818CF8' }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9', margin: '0 0 8px' }}>No analyses yet</p>
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 20px' }}>Upload patient data to start the first analysis.</p>
          <button className="btn-primary" onClick={() => navigate(`/patients/${id}/upload`)}>
            <Upload size={15} />
            Start analysis
          </button>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sorted.map((a, i) => (
            <Link key={a.id} to={`/analysis/${a.id}`} style={{ textDecoration: 'none' }}>
              <GlassCard
                delay={i * 0.05}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 120px 120px 1fr auto',
                  alignItems: 'center', gap: 16, padding: '16px 20px',
                }}
              >
                {/* Date */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', margin: 0 }}>
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                  <p style={{ fontSize: 12, color: '#475569', margin: '2px 0 0' }}>
                    {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <StatusBadge status={a.status} />
                <ResultBadge result={a.result} />
                <ConfidenceBar score={a.confidence_score} />

                <span style={{ fontSize: 13, color: '#818CF8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  View details →
                </span>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
