import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Upload from './pages/Upload'
import Result from './pages/Result'
import Analyses from './pages/Analyses'
import Login from './pages/Login'
import Register from './pages/Register'

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080B14' }}>
        <div style={{
          width: 48, height: 48,
          border: '3px solid rgba(255,255,255,0.06)',
          borderTopColor: '#6366F1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          boxShadow: '0 0 20px rgba(99,102,241,0.4)',
        }} />
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:id" element={<PatientDetail />} />
              <Route path="patients/:id/upload" element={<Upload />} />
              <Route path="analyses" element={<Analyses />} />
              <Route path="analysis/:id" element={<Result />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  )
}
