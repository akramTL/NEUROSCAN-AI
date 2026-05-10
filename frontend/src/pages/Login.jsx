import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Brain, Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuth()
  const { showToast } = useToast()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  const registered = location.state?.registered

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form.email, form.password)
      // AuthContext.login handles token storage, /auth/me fetch, and navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Login failed. Please try again.'
      setError(msg)
      showToast(msg, 'error', 'Login failed')
      setLoading(false)
    }
  }

  const handleSocial = () => showToast('Social login coming soon', 'info')

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
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: '#475569', marginTop: 4, marginBottom: 32 }}>
            Sign in to your account
          </p>

          {registered && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', marginBottom: 20,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 14, fontSize: 13, color: '#10B981',
            }}>
              <CheckCircle size={15} style={{ flexShrink: 0 }} />
              Account created! Sign in to continue.
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', marginBottom: 20,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 14, fontSize: 13, color: '#EF4444',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  type="email" className="input-field"
                  placeholder="doctor@hospital.com"
                  value={form.email} onChange={set('email')}
                  required autoFocus
                  style={{ paddingLeft: 48 }}
                />
              </div>
            </div>

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
                  placeholder="Your password"
                  value={form.password} onChange={set('password')}
                  required style={{ paddingLeft: 48, paddingRight: 48 }}
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
            </div>

            <button
              type="submit" disabled={loading}
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
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {['f', 'G', 'in', 'X'].map(label => (
              <motion.button
                key={label}
                onClick={handleSocial}
                style={{
                  width: 48, height: 48, borderRadius: 9999,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#94A3B8',
                  fontFamily: 'inherit',
                }}
                whileHover={{
                  borderColor: 'rgba(99,102,241,0.4)',
                  background: 'rgba(99,102,241,0.08)',
                  color: '#818CF8',
                }}
                whileTap={{ scale: 0.95 }}
              >
                {label}
              </motion.button>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#475569', marginTop: 24 }}>
            Don&apos;t have an account?{' '}
            <span
              style={{ color: '#818CF8', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => navigate('/register')}
            >
              Create account
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
