import { useState } from 'react'
import { API_URL } from '../lib/apiConfig'

const OUTLOOK_DOMAINS = [
  'outlook.com', 'outlook.es', 'outlook.co', 'hotmail.com', 'hotmail.es',
  'live.com', 'live.es', 'msn.com', 'msn.es', 'passport.com',
]

const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com']

function detectProvider(email) {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  if (OUTLOOK_DOMAINS.includes(domain)) return 'outlook'
  if (GMAIL_DOMAINS.includes(domain)) return 'gmail'
  return 'gmail'
}

export function useEmail() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [provider, setProvider] = useState(null)

  const fetchEmails = async (email, fallback = true) => {
    if (!email || !email.includes('@')) {
      setError('Ingresa un correo válido')
      return
    }

    setLoading(true)
    setError(null)
    setEmails([])

    const detected = detectProvider(email)
    setProvider(detected)

    const providersToTry = fallback
      ? (detected === 'outlook' ? ['outlook', 'gmail'] : ['gmail', 'outlook'])
      : [detected]

    const base = API_URL || ''

    for (const prov of providersToTry) {
      try {
        const endpoint = prov === 'outlook' ? '/outlook/outlook/emails' : '/emails'
        const response = await fetch(
          `${base}${endpoint}?email=${encodeURIComponent(email)}&limit=3`,
          { headers: { 'Content-Type': 'application/json' } }
        )

        const data = await response.json()

        if (response.ok && data.success && data.emails && data.emails.length > 0) {
          setEmails(
            data.emails.map((msg) => ({
              id: msg.id,
              from: msg.from,
              to: msg.to,
              date: msg.date,
              body: msg.body,
              provider: prov,
            }))
          )
          setProvider(prov)
          setLoading(false)
          return
        }
      } catch {
        // try next provider
      }
    }

    setError(`No se pudieron obtener correos para ${email}. Asegúrate de que la cuenta esté conectada.`)
    setLoading(false)
  }

  return { emails, loading, error, provider, fetchEmails }
}
