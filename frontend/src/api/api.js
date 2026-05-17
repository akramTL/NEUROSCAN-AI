import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
})

// Attach JWT from localStorage to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 response: clear session and redirect to login
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Patients ────────────────────────────────────────────────────────────────

export const getPatients = () =>
  api.get('/patients/').then(r => r.data)

export const createPatient = (data) =>
  api.post('/patients/', data).then(r => r.data)

export const getPatient = (id) =>
  api.get(`/patients/${id}`).then(r => r.data)

export const updatePatient = (id, data) =>
  api.put(`/patients/${id}`, data).then(r => r.data)

// ── Uploads ─────────────────────────────────────────────────────────────────

export const uploadFiles = (patientId, { csvFile, mriFile, petFile }) => {
  const form = new FormData()
  form.append('csv_file', csvFile)
  if (mriFile) form.append('mri_file', mriFile)
  if (petFile) form.append('pet_file', petFile)
  return api
    .post(`/patients/${patientId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data)
}

export const getPatientUploads = (patientId) =>
  api.get(`/patients/${patientId}/uploads`).then(r => r.data)

// ── Analysis ────────────────────────────────────────────────────────────────

export const getAnalyses = (params) =>
  api.get('/analysis/', { params }).then(r => r.data)

export const getAnalysisStatus = (analysisId) =>
  api.get(`/analysis/${analysisId}/status`).then(r => r.data)

export const getAnalysis = (analysisId) =>
  api.get(`/analysis/${analysisId}`).then(r => r.data)

export const downloadReport = (analysisId) =>
  api.get(`/analysis/${analysisId}/report`, { responseType: 'blob' }).then(r => r.data)

// ── Notifications ────────────────────────────────────────────────────────────

export const getNotifications = () =>
  api.get('/notifications/').then(r => r.data)

export const getUnreadCount = () =>
  api.get('/notifications/unread-count').then(r => r.data)

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`).then(r => r.data)

export const markAllRead = () =>
  api.patch('/notifications/read-all').then(r => r.data)

export default api
