import { useState } from 'react'
import { useNavigate } from 'react-router-dom'  // ← NUEVO
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
      setError(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : error.message
      )
    } else if (data?.user) {
      navigate('/dashboard')
    }

    setIsLoading(false)
  }

  const emailIcon = (
    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  )

  const passwordIcon = (
    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InputField
        id="email"
        label="Correo electrónico"
        type="email"
        placeholder="admin@tuempresa.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={emailIcon}
        required
      />

      <InputField
        id="password"
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={passwordIcon}
        required
      />

      {error && <Alert type="error" message={error} />}

      <Button type="submit" isLoading={isLoading}>
        Iniciar Sesión
      </Button>
    </form>
  )
}