import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const { checkAuth } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const verify = async () => {
      await checkAuth()
      navigate('/', { replace: true })
    }
    verify()
  }, [checkAuth, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Completing authentication...</p>
        <p className="text-sm text-gray-400 mt-1">Redirecting to dashboard</p>
      </div>
    </div>
  )
}
