import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for auth errors and server errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on auth failure
      if (window.location.pathname !== '/login' && window.location.pathname !== '/auth/callback') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
