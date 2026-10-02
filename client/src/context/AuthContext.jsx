import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    if (!supabase) { setLoading(false); return undefined }
    supabase.auth.getSession().then(({ data }) => { if (mounted) { setSession(data.session); setLoading(false) } })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    loading,
    isConfigured: isSupabaseConfigured,
    async signUp({ name, email, password }) {
      if (!supabase) throw new Error('Supabase Auth is not configured for this preview.')
      return supabase.auth.signUp({ email, password, options: { data: { name } } })
    },
    async signIn({ email, password }) {
      if (!supabase) throw new Error('Supabase Auth is not configured for this preview.')
      return supabase.auth.signInWithPassword({ email, password })
    },
    async signInWithGoogle() {
      if (!supabase) throw new Error('Google Auth is not configured for this preview.')
      return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    },
    async signOut() {
      if (!supabase) return { error: null }
      return supabase.auth.signOut()
    },
  }), [loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
