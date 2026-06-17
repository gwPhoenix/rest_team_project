import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const { signInWithKakao, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const toast = useToast()

  const [tab,      setTab]      = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  async function handleEmail(e) {
    e.preventDefault()
    if (!email || !password) { toast('이메일과 비밀번호를 입력해주세요.', 'warning'); return }
    if (password.length < 6)  { toast('비밀번호는 6자 이상이어야 합니다.', 'warning'); return }

    setLoading(true)
    try {
      if (tab === 'login') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
        setDone(true)
      }
    } catch (err) {
      const msg = err.message?.includes('Invalid login') ? '이메일 또는 비밀번호가 올바르지 않습니다.'
                : err.message?.includes('already registered') ? '이미 가입된 이메일입니다.'
                : err.message || '오류가 발생했습니다.'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleKakao() {
    setLoading(true)
    try {
      await signInWithKakao()
    } catch (err) {
      toast('카카오 로그인 실패: ' + err.message, 'error')
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      toast('구글 로그인 실패: ' + err.message, 'error')
      setLoading(false)
    }
  }

  if (done) return (
    <div className="auth-overlay">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ marginBottom: 8 }}>이메일을 확인해주세요</h2>
        <p style={{ color: 'var(--txt-2)', marginBottom: 24 }}>
          <strong>{email}</strong>로 인증 링크를 보냈습니다.<br />
          링크를 클릭하면 로그인됩니다.
        </p>
        <button className="btn btn-ghost btn-full" onClick={() => setDone(false)}>다시 시도</button>
      </div>
    </div>
  )

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-badge">AI</div>
          <h1>AI 취업 코치</h1>
          <p>경험을 직무 역량으로 변환하는 AI 취업 코치</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>로그인</button>
          <button className={`auth-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => setTab('signup')}>회원가입</button>
        </div>

        <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input className="form-input" type="email" placeholder="이메일을 입력하세요" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input className="form-input" type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? '처리 중...' : tab === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="auth-divider"><span>또는</span></div>

        <div className="social-buttons">
          <button className="btn btn-kakao btn-full" onClick={handleKakao} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.712 1.523 5.1 3.85 6.6l-.98 3.6 4.19-2.76c.94.18 1.92.28 2.94.28 5.523 0 10-3.477 10-7.72C24 6.477 19.523 3 12 3z"/>
            </svg>
            카카오로 계속하기
          </button>

          <button className="btn btn-google btn-full" onClick={handleGoogle} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            구글로 계속하기
          </button>
        </div>
      </div>
    </div>
  )
}
