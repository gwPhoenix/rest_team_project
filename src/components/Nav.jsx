import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AI_MODEL } from '../lib/openai'

export default function Nav() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [dropOpen, setDropOpen] = useState(false)

  const meta        = user?.user_metadata ?? {}
  const rawEmail    = user?.email || ''
  const appProvider = user?.app_metadata?.provider ?? ''
  const isNaver     = rawEmail.endsWith('@oauth.naver') || appProvider === 'custom:naver'
  const provider    = isNaver ? 'naver' : (meta.provider ?? appProvider ?? 'email')
  const email       = rawEmail
  const name     = meta.name || meta.full_name || meta.nickname || email.split('@')[0] || '사용자'
  const avatar   = name.charAt(0).toUpperCase()

  const providerLabel = { kakao: '카카오 로그인', naver: '네이버 로그인', google: '구글 로그인' }[provider] ?? null

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-badge-sm">AI</div>
          <span>취업 코치</span>
        </Link>
        <span className="ai-model-badge">{AI_MODEL}</span>

        <div className="nav-links">
          <Link to="/" className={`nav-link${location.pathname === '/' ? ' active' : ''}`}>분석하기</Link>
          <Link to="/history" className={`nav-link${location.pathname === '/history' ? ' active' : ''}`}>성장 기록</Link>
        </div>

        <div className="nav-actions">
          <div className="user-menu" style={{ position: 'relative' }}>
            <div className="user-avatar" onClick={() => setDropOpen(v => !v)}>{avatar}</div>
            {dropOpen && (
              <div className="user-dropdown">
                <div className="user-info-block">
                  <span className="user-display-name">{name}</span>
                  <span className="user-display-email">{email}</span>
                  {providerLabel && <span className={`user-provider-badge ${provider}`}>{providerLabel}</span>}
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={() => { signOut(); setDropOpen(false) }}>로그아웃</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
