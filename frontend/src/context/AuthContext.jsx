import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setDoctor(null)
    navigate('/login', { replace: true })
  }, [navigate])

  // On mount: validate stored token via GET /auth/me
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then(r => setDoctor(r.data))
      .catch(() => {
        localStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password })
    const { access_token } = r.data
    localStorage.setItem('token', access_token)
    const me = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    setDoctor(me.data)
    navigate('/', { replace: true })
  }

  return (
    <AuthContext.Provider
      value={{ doctor, login, logout, isAuthenticated: !!doctor, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
