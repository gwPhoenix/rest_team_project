import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem('openai_api_key') || '')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null

      // 네이버 첫 로그인 시 provider_token으로 실제 이메일 저장
      if (
        event === 'SIGNED_IN' &&
        session?.provider_token &&
        u?.app_metadata?.provider === 'custom:naver' &&
        !u?.user_metadata?.naver_email
      ) {
        try {
          const res = await fetch('https://openapi.naver.com/v1/nid/me', {
            headers: { Authorization: `Bearer ${session.provider_token}` },
          })
          const { response: profile } = await res.json()
          if (profile?.email) {
            await supabase.auth.updateUser({ data: { naver_email: profile.email } })
            const { data: { session: refreshed } } = await supabase.auth.refreshSession()
            setUser(refreshed?.user ?? null)
            return
          }
        } catch {}
      }

      setUser(u)
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'custom:naver',
      options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL ?? '/'}` },
    })
    if (error) throw error
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
