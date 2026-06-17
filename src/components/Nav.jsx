import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Nav({ onApiKeyClick }) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [dropOpen, setDropOpen] = useState(false)

  const meta     = user?.user_metadata ?? {}
  const provider = meta.provider ?? user?.app_metadata?.provider ?? 'email'
  const rawEmail = user?.email || ''
  const email    = provider === 'naver' ? (meta.naver_email || rawEmail) : rawEmail
  const name     = meta.name || meta.full_name || email.split('@')[0] || '사용자'
  const avatar   = name.charAt(0).toUpperCase()

  const providerLabel = { kakao: '카카오 로그인', naver: '네이버 로그인', google: '구글 로그인' }[provider] ?? null

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-badge-sm">AI</div>
          <span>취업 코치</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link${location.pathname === '/' ? ' active' : ''}`}>분석하기</Link>
          <Link to="/history" className={`nav-link${location.pathname === '/history' ? ' active' : ''}`}>성장 기록</Link>
        </div>

        <div className="nav-actions">
          <button className="btn btn-ghost btn-icon" onClick={onApiKeyClick} title="API 키 설정">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M5.64 5.64A10 10 0 0 0 18.36 18.36"/>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
            </svg>
          </button>

          <div className="user-menu" style={{ position: 'relative' }}>
            <div className="user-avatar" onClick={() => setDropOpen(v => !v)}>{avatar}</div>
            {dropOpen && (
              <div className="user-dropdown">
                <div className="user-info-block">
                  <span className="user-display-name">{name}</span>
                  <span className="user-display-email">{email}</span>
                  {providerLabel && <span className="user-provider-badge">{providerLabel}</span>}
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
