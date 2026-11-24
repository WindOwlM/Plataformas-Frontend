import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import InputField from './ui/InputField'
import Button from './ui/Button'
import Alert from './ui/Alert'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const { data, error } = await signIn(email, password)

    if (error) {
      const msg = String(error.message || '')
      setError(
        /invalid login credentials/i.test(msg)
          ? 'Correo o contraseña incorrectos'
          : /email not confirmed/i.test(msg)
            ? 'Este correo aún no está confirmado. Revisa tu bandeja de entrada.'
            : /fetch|network/i.test(msg)
              ? 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.'
              : /rate limit|too many/i.test(msg)
                ? 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
                : 'No se pudo iniciar sesión. Inténtalo de nuevo.'
      )
      console.error('Error al iniciar sesión:', msg)
    } else if (data?.user) {
      navigate('/dashboard')
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InputField
        id="email"
        label="Correo electrónico"
        type="email"
        placeholder="admin@tuempresa.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<Mail className="h-5 w-5 text-gray-500" />}
        required
      />

      <InputField
        id="password"
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<Lock className="h-5 w-5 text-gray-500" />}
        required
      />

      {error && <Alert type="error" message={error} />}

      <Button type="submit" isLoading={isLoading} className="w-full">
        Iniciar sesión
      </Button>
    </form>
  )
}
