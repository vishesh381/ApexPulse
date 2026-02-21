import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)
const HEARTBEAT_INTERVAL = 10 * 60 * 1000 // 10 minutes — keeps backend session alive
const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000 // 2 hours

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('sf_authenticated') === 'true'
  )
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sf_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const lastActivityRef = useRef(Date.now())
  const heartbeatRef = useRef(null)
  const inactivityRef = useRef(null)

  const setAuthState = useCallback((authenticated, userData) => {
    setIsAuthenticated(authenticated)
    setUser(userData)
    if (authenticated) {
      localStorage.setItem('sf_authenticated', 'true')
      if (userData) localStorage.setItem('sf_user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('sf_authenticated')
      localStorage.removeItem('sf_user')
    }
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/status')
      if (data.connected) {
        try {
          const userRes = await api.get('/auth/user-info')
          setAuthState(true, userRes.data)
        } catch {
          setAuthState(true, user) // keep cached user
        }
      } else {
        setAuthState(false, null)
      }
    } catch {
      setAuthState(false, null)
    } finally {
      setLoading(false)
    }
  }, [setAuthState])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    setAuthState(false, null)
    stopTimers()
  }, [setAuthState])

  // Track user activity
  const onActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // Check inactivity — auto-logout after 2 hours of no interaction
  const checkInactivity = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current
    if (elapsed >= INACTIVITY_TIMEOUT && isAuthenticated) {
      logout()
    }
  }, [isAuthenticated, logout])

  // Heartbeat — tells backend the user is still active
  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await api.post('/auth/heartbeat')
      if (!data.connected) {
        // Backend session expired (e.g., refresh token revoked)
        setAuthState(false, null)
      }
    } catch {
      // Don't force logout on network blips — backend has its own timer
    }
  }, [isAuthenticated, setAuthState])

  const stopTimers = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    if (inactivityRef.current) clearInterval(inactivityRef.current)
  }, [])

  // On mount: verify with backend
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Activity listeners + timers when authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, onActivity))

    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)
    inactivityRef.current = setInterval(checkInactivity, 60 * 1000)

    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity))
      stopTimers()
    }
  }, [isAuthenticated, onActivity, sendHeartbeat, checkInactivity, stopTimers])

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
