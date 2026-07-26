import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ✅ Exportar el contexto para que useAuth.js lo use
export const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [adminProfile, setAdminProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAdminProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('administrador')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error) setAdminProfile(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchAdminProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchAdminProfile(session.user.id)
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

  async function signUp(email, password, nombre) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) return { error: authError }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('administrador')
        .insert([
          {
            id: authData.user.id,
            nombre,
            rol: 'admin',
            created_at: new Date().toISOString(),
          },
        ])

      if (profileError) {
        console.error('Error creando perfil:', profileError)
      }
    }

    return { data: authData, error: null }
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
    signUp,
    signOut,
    isAdmin: !!adminProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}