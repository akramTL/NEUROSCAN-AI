import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, FileText, Brain, Scan, CheckCircle, CheckCircle2, X, AlertCircle, Upload as UploadIcon, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPatient, uploadFiles } from '../api/api'
import { useToast } from '../context/ToastContext'
import GlassCard from '../components/GlassCard'

// ── CSV cell sanitizer ────────────────────────────────────────
function sanitizeCell(raw) {
  const stripped = String(raw ?? '').replace(/^[=+\-@]+/, '')
  return stripped.length > 100 ? stripped.slice(0, 100) + '…' : stripped
}

function parseCSVPreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const lines = e.target.result.split('\n').filter(Boolean)
      if (!lines.length) { resolve({ headers: [], rows: [] }); return }
      const headers = lines[0].split(',').map(h => sanitizeCell(h.replace(/['"]/g, '')))
      const rows = lines.slice(1, 6).map(line => {
        const vals = line.split(',').map(v => sanitizeCell(v.trim().replace(/['"]/g, '')))
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
      })
      resolve({ headers, rows })
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const EXPECTED_COLS = ['subject_id', 'age', 'gender', 'MMSE', 'CDR', 'eTIV', 'nWBV', 'ASF']

// ── Stepper ───────────────────────────────────────────────────
function Stepper({ csvDone, mriDone, petDone }) {
  const steps = [
    { label: 'CSV Biomarkers', done: csvDone },
    { label: 'MRI Scan', done: mriDone },
    { label: 'PET Scan', done: petDone },
  ]
  return (
    <GlassCard style={{ padding: '20px 32px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        {steps.map((step, i) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                ...(step.done
                  ? {
                      background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                      color: '#fff',
                      boxShadow: '0 0 16px rgba(99,102,241,0.5)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#475569',
                    }
                ),
              }}>
                {step.done ? <CheckCircle size={16} color="#fff" /> : i + 1}
              </div>
              <span style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.06)', alignSelf: 'center', marginBottom: 18, margin: '0 8px 18px 8px' }} />
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

// ── Drop zone ─────────────────────────────────────────────────
function DropZone({ label, icon: Icon, accept, file, onDrop, onRemove, pills }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: files => files[0] && onDrop(files[0]),
    accept, maxFiles: 1, multiple: false,
  })

  if (file) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: 16,
        background: 'rgba(16,185,129,0.06)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 20,
        boxShadow: '0 0 20px rgba(16,185,129,0.1)',
      }}>
        <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
          <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button type="button" onClick={onRemove} style={{
          width: 32, height: 32, borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#475569',
        }}>
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      style={{
        background: isDragActive ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
        border: `2px dashed ${isDragActive ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 20, minHeight: 160, cursor: 'pointer', padding: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.2s',
        boxShadow: isDragActive ? '0 0 30px rgba(99,102,241,0.2)' : 'none',
      }}
    >
      <input {...getInputProps()} />
      <Icon size={32} style={{ color: '#6366F1' }} />
      <p style={{ fontSize: 15, fontWeight: 500, color: '#F1F5F9', margin: 0 }}>
        {isDragActive ? 'Drop it here…' : `Drop your ${label} here`}
      </p>
      <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>or click to browse</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {pills.map(p => (
          <span key={p} style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: '#818CF8',
            borderRadius: 9999, fontSize: 11, padding: '2px 10px', fontFamily: 'monospace',
          }}>{p}</span>
        ))}
      </div>
    </div>
  )
}

// ── Main Upload page ──────────────────────────────────────────
export default function Upload() {
  const { id: patientId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [csvFile, setCsvFile]     = useState(null)
  const [mriFile, setMriFile]     = useState(null)
  const [petFile, setPetFile]     = useState(null)
  const [csvPreview, setCsvPreview] = useState(null)
  const [missingCols, setMissingCols] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => getPatient(patientId),
  })

  const handleCsvDrop = useCallback(async file => {
    setCsvFile(file)
    setCsvPreview(null)
    setMissingCols([])
    try {
      const preview = await parseCSVPreview(file)
      setCsvPreview(preview)
      setMissingCols(EXPECTED_COLS.filter(c => !preview.headers.includes(c)))
    } catch { /* non-fatal */ }
  }, [])

  const handleSubmit = async () => {
    if (!csvFile) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await uploadFiles(patientId, { csvFile, mriFile, petFile })
      showToast('Analysis submitted successfully', 'success')
      navigate(`/analysis/${result.analysis_id}`)
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Upload failed. Please check the files and try again.'
      setSubmitError(msg)
      showToast(msg, 'error', 'Upload failed')
      setSubmitting(false)
    }
  }

  return (
    <div className="page-enter" style={{ maxWidth: 680 }}>
      {/* Back */}
      <Link
        to={`/patients/${patientId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6366F1', textDecoration: 'none', marginBottom: 20, fontWeight: 500 }}
      >
        <ArrowLeft size={14} />
        {patient ? `${patient.first_name} ${patient.last_name}` : 'Back to patient'}
      </Link>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>New Analysis</p>
        <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Upload patient data files to start an AI-powered analysis.</p>
      </div>

      <Stepper csvDone={!!csvFile} mriDone={!!mriFile} petDone={!!petFile} />

      {/* ── Step 1: CSV ──────────────────────────────────────── */}
      <GlassCard style={{ marginBottom: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FileText size={17} style={{ color: '#818CF8' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#F1F5F9', margin: 0, flex: 1 }}>Patient biomarker data</p>
          <span style={{
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#F59E0B',
            borderRadius: 9999, fontSize: 11, padding: '3px 10px', fontWeight: 500,
          }}>Required</span>
        </div>

        <DropZone
          label="CSV file" icon={FileText} pills={['.csv']}
          accept={{ 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] }}
          file={csvFile} onDrop={handleCsvDrop}
          onRemove={() => { setCsvFile(null); setCsvPreview(null); setMissingCols([]) }}
        />

        {/* Helper */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '12px 16px', marginTop: 12 }}>
          <span style={{ fontSize: 13, color: '#475569' }}>Expected columns: </span>
          {EXPECTED_COLS.map(c => (
            <span key={c} style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#818CF8',
              fontFamily: 'monospace', fontSize: 11, padding: '2px 6px',
              borderRadius: 8, display: 'inline-block', margin: 2,
            }}>{c}</span>
          ))}
        </div>

        {missingCols.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 14px',
            background: 'rgba(245,158,11,0.08)',
            borderLeft: '3px solid #F59E0B',
            borderRadius: 14, marginTop: 12,
          }}>
            <AlertCircle size={14} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#F59E0B' }}>
              Missing columns: <strong>{missingCols.join(', ')}</strong>. Analysis may have limited accuracy.
            </span>
          </div>
        )}

        {csvPreview && csvPreview.headers.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', marginBottom: 10 }}>Preview</p>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'rgba(99,102,241,0.06)' }}>
                    {csvPreview.headers.map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: EXPECTED_COLS.includes(h) ? '#818CF8' : '#94A3B8', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.rows.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      {csvPreview.headers.map(h => (
                        <td key={h} style={{ padding: '7px 12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ padding: '6px 12px', fontSize: 11, color: '#475569', borderTop: '1px solid rgba(255,255,255,0.04)', margin: 0 }}>
                Showing first {csvPreview.rows.length} row{csvPreview.rows.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── Step 2: MRI ──────────────────────────────────────── */}
      <GlassCard style={{ marginBottom: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Brain size={17} style={{ color: '#818CF8' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#F1F5F9', margin: 0, flex: 1 }}>MRI scan</p>
          <span style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: '#818CF8',
            borderRadius: 9999, fontSize: 11, padding: '3px 10px', fontWeight: 500,
          }}>Optional</span>
        </div>
        <DropZone
          label="MRI scan" icon={Brain} pills={['.nii', '.nii.gz', '.dcm']}
          accept={{ 'application/octet-stream': ['.nii', '.dcm'], 'application/gzip': ['.gz'] }}
          file={mriFile} onDrop={setMriFile} onRemove={() => setMriFile(null)}
        />
      </GlassCard>

      {/* ── Step 3: PET ──────────────────────────────────────── */}
      <GlassCard style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Scan size={17} style={{ color: '#818CF8' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#F1F5F9', margin: 0, flex: 1 }}>PET scan</p>
          <span style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: '#818CF8',
            borderRadius: 9999, fontSize: 11, padding: '3px 10px', fontWeight: 500,
          }}>Optional</span>
        </div>
        <DropZone
          label="PET scan" icon={Scan} pills={['.nii', '.nii.gz', '.dcm']}
          accept={{ 'application/octet-stream': ['.nii', '.dcm'], 'application/gzip': ['.gz'] }}
          file={petFile} onDrop={setPetFile} onRemove={() => setPetFile(null)}
        />
      </GlassCard>

      {/* Submit error */}
      {submitError && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '12px 16px', marginBottom: 16,
          background: 'rgba(239,68,68,0.08)',
          borderLeft: '3px solid #EF4444',
          borderRadius: 14,
        }}>
          <AlertCircle size={15} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: '#EF4444' }}>{submitError}</span>
        </div>
      )}

      {/* Nav bar */}
      <GlassCard style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
          {[csvFile, mriFile, petFile].filter(Boolean).length} file{[csvFile, mriFile, petFile].filter(Boolean).length !== 1 ? 's' : ''} selected
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={() => navigate(`/patients/${patientId}`)}>
            <ArrowLeft size={15} />
            Back
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!csvFile || submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="spin" />
                Analysing…
              </>
            ) : (
              <>
                <UploadIcon size={15} />
                Submit
              </>
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
