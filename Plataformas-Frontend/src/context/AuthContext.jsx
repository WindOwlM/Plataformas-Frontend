import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/apiConfig'

// ✅ Exportar el contexto para que useAuth.js lo use
export const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [adminProfile, setAdminProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAdminProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
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
      if (session?.user) {
        fetchAdminProfile()
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchAdminProfile()
        } else {
          setAdminProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchAdminProfile])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setAdminProfile(null)
  }

  const value = {
    user,
    adminProfile,
    loading,
    signIn,
    signOut,
    isAdmin: !!adminProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}