import { useState } from 'react'

const API_URL = import.meta.env.API_URL || 'https://plataformas-backend.onrender.com'
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY 

const OUTLOOK_DOMAINS = [
  'outlook.com', 'outlook.es', 'outlook.co', 'hotmail.com', 'hotmail.es',
  'live.com', 'live.es', 'msn.com', 'msn.es', 'passport.com'
]

const GMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com'
]

function detectProvider(email) {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  
  if (OUTLOOK_DOMAINS.includes(domain)) return 'outlook'
  if (GMAIL_DOMAINS.includes(domain)) return 'gmail'
  
  // Fallback: si no reconoce, intenta Gmail primero (más común)
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

    for (const prov of providersToTry) {
      try {
        const endpoint = prov === 'outlook' ? '/outlook/outlook/emails' : '/emails'
        const response = await fetch(
          `${API_URL}${endpoint}?email=${encodeURIComponent(email)}&limit=2`,
          {
            headers: {
            //   'x-api-key': API_KEY,
              'Content-Type': 'application/json',
            },
          }
        )

        const data = await response.json()

        if (response.ok && data.success && data.emails && data.emails.length > 0) {
          const simplified = data.emails.map((msg) => ({
            id: msg.id,
            from: msg.from,
            date: msg.date,
            body: msg.body,
            provider: prov,
          }))
          setEmails(simplified)
          setProvider(prov)
          setLoading(false)
          return // Éxito, salimos
        }
      } catch (err) {
        console.log(`Falló ${prov}:`, err.message)
        // Continúa al siguiente provider
      }
    }

    // Si ninguno funcionó
    setError(`No se pudieron obtener correos para ${email}. Asegúrate de que la cuenta esté conectada.`)
    setLoading(false)
  }

  return { emails, loading, error, provider, fetchEmails }
}