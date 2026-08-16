import { useState } from 'react'

const API_URL = import.meta.env.API_URL || 'https://plataformas-backend.onrender.com'
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY 

export function useOutlook() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchEmails = async (email) => {
    if (!email || !email.includes('@')) {
      setError('Ingresa un correo válido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${API_URL}/outlook/emails?email=${encodeURIComponent(email)}&limit=2`,
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al obtener correos de Outlook')
      }

      const simplified = data.emails.map((msg) => ({
        id: msg.id,
        from: msg.from,
        date: msg.date,
        body: msg.body,
      }))

      setEmails(simplified)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { emails, loading, error, fetchEmails }
}