import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/apiConfig'
import { useAuth } from './useAuth'

export function useApi() {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const pending = useRef(0)

  const request = useCallback(async (endpoint, options = {}) => {
    const { silent = false, headers, ...fetchOptions } = options

    if (!silent) {
      pending.current += 1
      setLoading(true)
    }
    setError(null)

    try {
      const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token

      if (!token) {
        throw new Error('No hay sesión activa. Inicia sesión primero.')
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
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
      if (!silent) {
        pending.current = Math.max(0, pending.current - 1)
        if (pending.current === 0) setLoading(false)
      }
    }
  }, [accessToken])

  return { request, loading, error }
}
