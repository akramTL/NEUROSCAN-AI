import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, RefreshCw, CheckCircle2, AlertCircle, Download, Circle, Loader2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { getAnalysisStatus, getAnalysis, downloadReport } from '../api/api'
import { useToast } from '../context/ToastContext'
import GlassCard from '../components/GlassCard'

// ── Result config ─────────────────────────────────────────────
const RESULT_CONFIG = {
  AD: {
    label: "Alzheimer's Disease Detected",
    sublabel: "The AI model identified biomarkers consistent with Alzheimer's disease.",
    color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: AlertCircle,
    glow: 'rgba(239,68,68,0.3)',
  },
  MCI: {
    label: 'Mild Cognitive Impairment',
    sublabel: 'The AI model identified biomarkers consistent with mild cognitive impairment.',
    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: AlertTriangle,
    glow: 'rgba(245,158,11,0.3)',
  },
  CN: {
    label: 'Cognitively Normal',
    sublabel: 'The AI model did not identify significant biomarkers of cognitive decline.',
    color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle2,
    glow: 'rgba(16,185,129,0.3)',
  },
}

const FEATURE_LABELS = {
  Age: 'Age', sex_encoded: 'Sex', magnetic_field_strength: 'Field Strength', slices_per_volume: 'Slices/Vol',
  age: 'Age', gender_encoded: 'Gender', MMSE: 'MMSE', CDR: 'CDR', eTIV: 'eTIV', nWBV: 'nWBV', ASF: 'ASF',
}

// ── Confidence bar ────────────────────────────────────────────
function ConfidenceSection({ score, isMRI }) {
  const [width, setWidth] = useState('0%')
  useEffect(() => {
    const t = setTimeout(() => setWidth(`${(score * 100).toFixed(1)}%`), 50)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div style={{ marginTop: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>Model confidence</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>{(score * 100).toFixed(1)}%</span>
      </div>
      <div className="progress-track" style={{ height: 10 }}>
        <div className="progress-fill-accent" style={{ width }} />
      </div>
      <p style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
        {isMRI ? 'Based on 3D MRI deep learning analysis' : 'Based on XGBoost biomarker analysis'}
      </p>
    </div>
  )
}

// ── Feature importance ────────────────────────────────────────
function FeatureBar({ pct, delay }) {
  const [width, setWidth] = useState('0%')
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 50 + delay)
    return () => clearTimeout(t)
  }, [pct, delay])
  return (
    <div className="progress-track" style={{ flex: 1, height: 6 }}>
      <div className="progress-fill-accent" style={{ width }} />
    </div>
  )
}

function FeatureImportance({ featureImportance }) {
  if (!featureImportance || Object.keys(featureImportance).length === 0) return null
  const { showFeatureImportance = true } = JSON.parse(localStorage.getItem('neuroscan_settings') || '{}')
  if (!showFeatureImportance) return null

  const isMRI = 'CN' in featureImportance || 'MCI' in featureImportance || 'AD' in featureImportance

  const data = Object.entries(featureImportance)
    .map(([key, value]) => ({ name: FEATURE_LABELS[key] ?? key, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const maxVal = data[0]?.value ?? 1

  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '20px 0 12px' }}>
        {isMRI ? 'Per-class MRI probabilities' : 'What drove this result'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(({ name, value }, i) => {
          const pct = `${((value / maxVal) * 100).toFixed(0)}%`
          return (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 96, fontSize: 13, color: '#94A3B8', textAlign: 'right', flexShrink: 0 }}>{name}</span>
              <FeatureBar pct={pct} delay={i * 80} />
              <span style={{ width: 40, fontSize: 12, color: '#818CF8', fontWeight: 700 }}>{(value * 100).toFixed(0)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Loading state ─────────────────────────────────────────────
const LOADING_STEPS = ['Validating biomarker data', 'Running XGBoost model', 'Computing results']

function AnalysisSpinner({ status }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassCard style={{ maxWidth: 480, width: '100%', padding: 48, textAlign: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 96, height: 96, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.06)',
            borderTopColor: '#6366F1',
            boxShadow: '0 0 30px rgba(99,102,241,0.4)',
            margin: '0 auto',
          }}
        />
        <p style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginTop: 24, marginBottom: 8 }}>Analysing patient data</p>
        <p style={{ fontSize: 14, color: '#475569', marginBottom: 32 }}>Processing biomarkers…</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
          {LOADING_STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {i < step
                ? <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />
                : i === step
                  ? <motion.div animate={{ opacity: [1,0.4,1] }} transition={{ duration: 1, repeat: Infinity }}>
                      <Loader2 size={16} className="spin" style={{ color: '#6366F1', flexShrink: 0 }} />
                    </motion.div>
                  : <Circle size={16} style={{ color: '#475569', flexShrink: 0 }} />
              }
              <span style={{ fontSize: 14, color: i <= step ? '#F1F5F9' : '#475569' }}>{label}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

// ── Failed state ──────────────────────────────────────────────
function AnalysisFailed({ analysis }) {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassCard style={{
        maxWidth: 480, width: '100%', padding: 40, textAlign: 'center',
        border: '1px solid rgba(239,68,68,0.2)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4), 0 0 40px rgba(239,68,68,0.1)',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
        }}>
          <XCircle size={40} style={{ color: '#EF4444' }} />
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#EF4444', margin: '16px 0 0' }}>Analysis failed</p>
        <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 320, margin: '8px auto 24px' }}>
          {analysis?.error_message ?? 'An unexpected error occurred during analysis.'}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {analysis?.patient_id && (
            <button className="btn-primary" onClick={() => navigate(`/patients/${analysis.patient_id}/upload`)}>
              <RefreshCw size={14} />
              Try again
            </button>
          )}
          {analysis?.patient_id && (
            <button className="btn-secondary" onClick={() => navigate(`/patients/${analysis.patient_id}`)}>
              <ArrowLeft size={14} />
              Back
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

// ── Completed result ──────────────────────────────────────────
function ResultCard({ data, analysis }) {
  const { showToast } = useToast()
  const [downloading, setDownloading] = useState(false)
  const cfg = RESULT_CONFIG[data.result]
  if (!cfg) return null
  const Icon = cfg.icon
  const pct  = data.confidence_score

  useEffect(() => {
    showToast(`Result: ${data.result} — ${cfg.label}`, 'info', 'Analysis complete')
  }, [])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await downloadReport(analysis.id)
      const url  = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const a    = document.createElement('a')
      a.href     = url
      a.download = `neuroscan-report-${String(analysis.id).slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      showToast('Failed to generate report', 'error', 'Download error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <GlassCard
        glow
        glowColor={cfg.glow}
        style={{
          padding: 40,
          border: `1px solid ${cfg.color}30`,
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: cfg.bg,
            border: `1px solid ${cfg.color}40`,
            boxShadow: `0 0 40px ${cfg.glow}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
          }}>
            <Icon size={40} style={{ color: cfg.color }} />
          </div>
          <p style={{
            fontSize: 48, fontWeight: 800, color: cfg.color,
            marginTop: 16, marginBottom: 8, lineHeight: 1,
            letterSpacing: '-0.03em',
            textShadow: `0 0 30px ${cfg.color}`,
          }}>{data.result}</p>
          <span className={`badge-${data.result.toLowerCase()}`}>{cfg.label}</span>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

        {pct != null && (
          <ConfidenceSection
            score={pct}
            isMRI={!!(analysis?.feature_importance && ('CN' in analysis.feature_importance || 'MCI' in analysis.feature_importance))}
          />
        )}

        {analysis?.feature_importance && <FeatureImportance featureImportance={analysis.feature_importance} />}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Link to={`/patients/${analysis?.patient_id}`} style={{ flex: 1, textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <ArrowLeft size={15} />
              Back to patient
            </button>
          </Link>
          <button
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', opacity: downloading ? 0.7 : 1 }}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading
              ? <Loader2 size={15} className="spin" />
              : <Download size={15} />}
            {downloading ? 'Generating…' : 'Download Report'}
          </button>
        </div>
      </GlassCard>

      {/* Disclaimer */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: 16,
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.15)',
        borderRadius: 20, marginTop: 16,
        fontSize: 12, color: '#94A3B8',
      }}>
        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1, color: '#F59E0B' }} />
        This result is generated by an AI model and is intended for research purposes only. It does not constitute a medical diagnosis. Please consult a qualified physician.
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Result() {
  const { id } = useParams()

  const { data: status } = useQuery({
    queryKey: ['analysis-status', id],
    queryFn: () => getAnalysisStatus(id),
    refetchInterval: data => {
      if (data?.status === 'completed' || data?.status === 'failed') return false
      const { autoRefreshInterval = 3 } = JSON.parse(localStorage.getItem('neuroscan_settings') || '{}')
      return autoRefreshInterval * 1000
    },
  })

  const { data: analysis } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => getAnalysis(id),
    enabled: status?.status === 'completed' || status?.status === 'failed',
  })

  const currentStatus = status?.status ?? 'pending'

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>Analysis Result</p>
        <p style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', marginTop: 4 }}>ID: {id}</p>
      </div>

      {currentStatus === 'pending' || currentStatus === 'processing' ? (
        <AnalysisSpinner status={currentStatus} />
      ) : currentStatus === 'failed' ? (
        <AnalysisFailed analysis={analysis} />
      ) : (
        <ResultCard data={status} analysis={analysis} />
      )}
    </div>
  )
}
