import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/apiConfig'
import { useAuth } from './useAuth'
import { registrarError } from '../lib/errorLog'

// mensaje: lo que ve la persona. detalle: lo técnico, solo para el registro de errores
function errorConDetalle(mensaje, detalle) {
  const err = new Error(mensaje)
  err.detalle = detalle || ''
  return err
}

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

      let response
      try {
        response = await fetch(`${API_URL}${endpoint}`, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...headers,
          },
        })
      } catch (e) {
        throw errorConDetalle(
          'No se pudo conectar con el servidor. Revisa tu internet o que el backend esté encendido.',
          e?.message,
        )
      }

      let data = null
      try {
        data = await response.json()
      } catch {
        data = {}
        if (response.ok) throw errorConDetalle('El servidor respondió algo inesperado. Inténtalo de nuevo.', `HTTP ${response.status} sin JSON`)
      }

      if (!response.ok) {
        const detalle = [`HTTP ${response.status}`, data.detalle].filter(Boolean).join(' — ')
        if (response.status === 403) {
          throw errorConDetalle(data.error || 'No tienes permiso para hacer esta acción.', detalle)
        }
        if (response.status >= 500) {
          throw errorConDetalle(data.error || 'Algo falló en el servidor. Inténtalo de nuevo.', detalle)
        }
        throw errorConDetalle(data.error || 'No se pudo completar la acción. Inténtalo de nuevo.', detalle)
      }

      return { data, error: null }
    } catch (err) {
      const metodo = (fetchOptions.method || 'GET').toUpperCase()
      registrarError({ mensaje: err.message, detalle: err.detalle, origen: `${metodo} ${endpoint}` })
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
