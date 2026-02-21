import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleLogin = async () => {
    try {
      const { data } = await api.get('/auth/login-url')
      window.location.href = data.url
    } catch (err) {
      console.error('Failed to get login URL:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Salesforce Cloud Icon */}
          <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Apex Test Suite</h1>
          <p className="text-gray-500 mb-8">
            Connect your Salesforce org to run and monitor Apex tests with real-time progress tracking.
          </p>

          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Connect to Salesforce
          </button>

          <p className="mt-6 text-xs text-gray-400">
            Securely authenticates via Salesforce OAuth 2.0
          </p>
        </div>
      </div>
    </div>
  )
}
