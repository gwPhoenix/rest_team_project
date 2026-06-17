import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem('openai_api_key') || '')
  const fixing = useRef(false)

  function fixNaverProviderBackground(u) {
    if (!u?.email?.endsWith('@oauth.naver')) return
    if (u.app_metadata?.provider === 'naver') return
    if (fixing.current) return
    fixing.current = true
    supabase.functions.invoke('fix-naver-provider')
      .then(() => supabase.auth.refreshSession())
      .then(({ data: { session } }) => { if (session?.user) setUser(session.user) })
      .catch(() => {})
      .finally(() => { fixing.current = false })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)           // 무조건 즉시 로딩 해제
      fixNaverProviderBackground(u)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      fixNaverProviderBackground(u)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithKakao() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL ?? '/'}` },
    })
    if (error) throw error
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL ?? '/'}` },
    })
    if (error) throw error
  }

  async function signInWithNaver() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    window.location.href = `${supabaseUrl}/functions/v1/naver-auth`
  }

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUpWithEmail(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function setApiKey(key) {
    localStorage.setItem('openai_api_key', key)
    setApiKeyState(key)
  }

  return (
    <AuthContext.Provider value={{ user, loading, apiKey, setApiKey, signInWithKakao, signInWithGoogle, signInWithNaver, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
