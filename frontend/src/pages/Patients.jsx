import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, X, AlertCircle, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPatients, createPatient } from '../api/api'
import ResultBadge from '../components/ResultBadge'
import GlassCard from '../components/GlassCard'
import { useToast } from '../context/ToastContext'

function getInitials(first, last) {
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '?'
}

function daysAgo(dateStr) {
  if (!dateStr) return null
  const d = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1 day ago'
  return `${d} days ago`
}

// ── Add Patient Modal ─────────────────────────────────────────
function AddPatientModal({ onClose }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [form, setForm]       = useState({ first_name: '', last_name: '', date_of_birth: '', gender: '' })
  const [apiError, setApiError] = useState(null)

  const mutation = useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      showToast('Patient added successfully', 'success')
      onClose()
    },
    onError: err => setApiError(err.response?.data?.detail ?? 'Failed to create patient.'),
  })

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        zIndex: 200, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
        style={{
          background: 'rgba(13,17,23,0.95)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 28, padding: 32,
          maxWidth: 440, width: '100%',
          boxShadow: '0 0 0 1px rgba(99,102,241,0.1), 0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>New patient</p>
          <motion.button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#475569',
            }}
            whileHover={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={16} />
          </motion.button>
        </div>

        <form onSubmit={e => { e.preventDefault(); setApiError(null); mutation.mutate(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {apiError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 14, fontSize: 13, color: '#EF4444',
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {apiError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>First name</label>
              <input type="text" className="input-field" placeholder="Jane" required value={form.first_name} onChange={set('first_name')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last name</label>
              <input type="text" className="input-field" placeholder="Doe" required value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date of birth</label>
            <input type="date" className="input-field" required value={form.date_of_birth} onChange={set('date_of_birth')} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gender</label>
            <select className="input-field" required value={form.gender} onChange={set('gender')} style={{ cursor: 'pointer' }}>
              <option value="">Select gender…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Saving…' : 'Save patient'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── Patients page ─────────────────────────────────────────────
export default function Patients() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const params    = new URLSearchParams(location.search)
  const isAnalyze = params.get('action') === 'analyze'

  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(params.get('action') === 'add')

  useEffect(() => {
    if (params.get('action') === 'add') setShowModal(true)
  }, [location.search])

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: getPatients,
  })

  const filtered = useMemo(
    () => patients.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase().trim())
    ),
    [patients, search]
  )

  const handleCardClick = p => navigate(isAnalyze ? `/patients/${p.id}/upload` : `/patients/${p.id}`)

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>Patients</p>
          <p style={{ fontSize: 14, color: '#475569', marginTop: 2, marginBottom: 0 }}>
            {isAnalyze ? '↓ Select a patient to start a new analysis' : `${patients.length} patients total`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
            <input
              type="text" className="input-field" placeholder="Search patients…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 48 }}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={15} />
            Add patient
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading patients…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 0 30px rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Users size={40} style={{ color: '#818CF8' }} />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', margin: '0 0 8px' }}>
            {search ? `No patients matching "${search}"` : 'No patients yet'}
          </p>
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 20px' }}>
            {search ? 'Try a different search.' : 'Add your first patient to get started.'}
          </p>
          {!search && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <UserPlus size={15} />
              Add patient
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map((p, i) => {
            const last = p.analyses?.slice(-1)[0]
            return (
              <GlassCard
                key={p.id}
                delay={i * 0.04}
                onClick={() => handleCardClick(p)}
                style={{ display: 'flex', flexDirection: 'column', padding: 20 }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div className="avatar" style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 14, boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
                    {getInitials(p.first_name, p.last_name)}
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.first_name} {p.last_name}
                  </p>
                  {last?.result && <ResultBadge result={last.result} />}
                </div>

                {/* Details */}
                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 14px' }}>
                  {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}
                  {p.gender ? ` · ${p.gender.replace(/_/g, ' ')}` : ''}
                </p>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 14 }} />

                {/* Bottom row */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                    {last ? `Last analysis: ${daysAgo(last.created_at)}` : 'No analyses yet'}
                  </p>
                  <button
                    className="btn-secondary"
                    style={{ marginLeft: 'auto', padding: '5px 14px', fontSize: 13 }}
                    onClick={e => { e.stopPropagation(); handleCardClick(p) }}
                  >
                    View →
                  </button>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      {showModal && <AddPatientModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
