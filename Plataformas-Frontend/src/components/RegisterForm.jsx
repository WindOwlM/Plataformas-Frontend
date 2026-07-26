import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'   // ← CAMBIAR AQUÍ
import InputField from './ui/InputField'
import Button from './ui/Button'
import Alert from './ui/Alert'

// ... resto igual

export default function RegisterForm({ onToggleLogin }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)

    const { error } = await signUp(email, password, nombre)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setIsLoading(false)
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">¡Registro exitoso!</h3>
        <p className="text-gray-400">
          Revisa tu correo electrónico para confirmar tu cuenta.
        </p>
        <Button onClick={onToggleLogin} variant="secondary">
          Ir al login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InputField
        id="nombre"
        label="Nombre completo"
        placeholder="Tu nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />

      <InputField
        id="email"
        label="Correo electrónico"
        type="email"
        placeholder="admin@tuempresa.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <InputField
        id="password"
        label="Contraseña"
        type="password"
        placeholder="Mínimo 6 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <InputField
        id="confirmPassword"
        label="Confirmar contraseña"
        type="password"
        placeholder="Repite tu contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      {error && <Alert type="error" message={error} />}

      <Button type="submit" isLoading={isLoading}>
        Crear Cuenta
      </Button>

      <p className="text-center text-sm text-gray-400">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={onToggleLogin}
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Inicia sesión
        </button>
      </p>
    </form>
  )
}