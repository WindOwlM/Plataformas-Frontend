import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(79,70,229,0.35)]">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Panel de administración
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Gestión de cuentas de streaming
          </p>
        </div>

        <div className="bg-gray-800/60 rounded-2xl p-8 border border-gray-700 shadow-xl">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-gray-500">
          Sistema de gestión de cuentas v1.0
        </p>
      </div>
    </div>
  )
}
