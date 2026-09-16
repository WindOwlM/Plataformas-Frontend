import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Si ya está logueado, redirigir al dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div
            className="mx-auto h-16 w-16 bg-indigo-600 rounded-xl flex items-center justify-center mb-4"
            style={{ boxShadow: '0 0 20px rgba(79, 70, 229, 0.4)' }}
          >
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Panel de Administración
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Gestión de Cuentas de Streaming
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-xl">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Sistema de Gestión de Cuentas v1.0
        </p>
      </div>
    </div>
  )
}