import { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/apiConfig'

// ✅ Exportar el contexto para que useAuth.js lo use
export const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [adminProfile, setAdminProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAdminProfile = useCallback(async (token) => {
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setAdminProfile(await response.json())
      } else {
        setAdminProfile(null)
      }
    } catch {
      setAdminProfile(null)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAccessToken(session?.access_token ?? null)
      if (session?.user) {
        fetchAdminProfile(session.access_token)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        setAccessToken(session?.access_token ?? null)
        if (session?.user) {
          await fetchAdminProfile(session.access_token)
        } else {
          setAdminProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchAdminProfile])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setAdminProfile(null)
    setAccessToken(null)
  }, [])

  const value = useMemo(() => ({
    user,
    accessToken,
    adminProfile,
    loading,
    signIn,
    signOut,
    isAdmin: !!adminProfile,
  }), [user, accessToken, adminProfile, loading, signIn, signOut])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}