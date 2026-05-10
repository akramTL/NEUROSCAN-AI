import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Eye, EyeOff, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../api/api'

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'transparent', width: '0%' }
  let score = 0
  if (pw.length >= 8)           score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['transparent', '#EF4444', '#F59E0B', '#10B981', '#10B981']
  return { score, label: labels[score] ?? '', color: colors[score] ?? '', width: `${(score / 4) * 100}%` }
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))
  const strength = getPasswordStrength(form.password)
  const mismatch = form.confirm && form.password !== form.confirm

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await api.post('/auth/register', { email: form.email, full_name: form.full_name, password: form.password })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080B14' }}>

      {/* ── Left panel ─────────────────────────────── */}
      <div className="login-left-panel" style={{
        width: '45%', height: '100vh',
        background: 'linear-gradient(135deg, #0D0F1A 0%, #12101F 100%)',
        borderRight: '1px solid rgba(99,102,241,0.15)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: 64,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <motion.div
          animate={{ boxShadow: [
            '0 0 20px rgba(99,102,241,0.3)',
            '0 0 40px rgba(99,102,241,0.6)',
            '0 0 20px rgba(99,102,241,0.3)',
          ]}}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ display: 'inline-flex', marginBottom: 20, borderRadius: '50%', padding: 4 }}
        >
          <Brain size={56} style={{ color: '#818CF8' }} />
        </motion.div>

        <p style={{
          fontSize: 28, fontWeight: 800, margin: 0,
          background: 'linear-gradient(135deg,#818CF8,#A78BFA)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>NeuroScan AI</p>
        <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.7)', marginTop: 8, marginBottom: 0 }}>
          Advanced Alzheimer's detection
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 48 }}>
          {[
            'AI-powered AD / MCI / CN classification',
            'Multimodal — CSV, MRI, and PET scans',
            'Instant results with confidence scores',
          ].map(text => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={16} style={{ color: '#6366F1', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#94A3B8' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(13,17,23,0.6)',
        backdropFilter: 'blur(20px)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
          style={{ maxWidth: 400, width: '100%', padding: '0 32px' }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
            Create account
          </h1>
          <p style={{ fontSize: 14, color: '#475569', marginTop: 4, marginBottom: 32 }}>
            Join NeuroScan AI today
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Full name */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: '#94A3B8', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Full name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{
                  position: 'absolute', left: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569', pointerEvents: 'none',
                }} />
                <input
                  type="text" className="input-field" placeholder="Dr. Jane Smith"
                  value={form.full_name} onChange={set('full_name')}
                  required autoFocus style={{ paddingLeft: 48 }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: '#94A3B8', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569', pointerEvents: 'none',
                }} />
                <input
                  type="email" className="input-field" placeholder="doctor@hospital.com"
                  value={form.email} onChange={set('email')}
                  required style={{ paddingLeft: 48 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: '#94A3B8', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569', pointerEvents: 'none',
                }} />
                <input
                  type={showPw ? 'text' : 'password'} className="input-field"
                  placeholder="At least 8 characters"
                  value={form.password} onChange={set('password')}
                  required minLength={8}
                  style={{ paddingLeft: 48, paddingRight: 48 }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position: 'absolute', right: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: '#475569',
                  display: 'flex', padding: 0,
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{
                    flex: 1, height: 4, borderRadius: 9999,
                    background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 9999,
                      width: strength.width, background: strength.color,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: strength.color, fontWeight: 500, minWidth: 36 }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: '#94A3B8', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569', pointerEvents: 'none',
                }} />
                <input
                  type="password" className="input-field" placeholder="Repeat password"
                  value={form.confirm} onChange={set('confirm')}
                  required style={{ paddingLeft: 48 }}
                />
              </div>
              {mismatch && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <AlertCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#EF4444' }}>Passwords don&apos;t match</span>
                </div>
              )}
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 14, fontSize: 13, color: '#EF4444',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading || !!mismatch}
              className="btn-primary"
              style={{ width: '100%', height: 48, fontSize: 15, justifyContent: 'center', marginTop: 8, letterSpacing: '0.02em' }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 18, height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 1s linear infinite', flexShrink: 0,
                  }} />
                  Creating account…
                </>
              ) : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#475569', marginTop: 24 }}>
            Already have an account?{' '}
            <span
              style={{ color: '#818CF8', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => navigate('/login')}
            >
              Sign in
            </span>
          </p>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) { .login-left-panel { display: none !important; } }
      `}</style>
    </div>
  )
}
