import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const API_URL = 'http://localhost:3000/api'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No hay sesión activa. Inicia sesión primero.')
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 403) {
          throw new Error(data.error || 'No tienes permisos para esta acción')
        }
        if (response.status === 500) {
          throw new Error(data.error || 'Error interno del servidor')
        }
        throw new Error(data.error || `Error ${response.status}`)
      }

      return { data, error: null }
    } catch (err) {
      console.error('Error en request:', err.message)
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return { request, loading, error }
}