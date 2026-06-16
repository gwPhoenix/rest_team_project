import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const { signInWithKakao } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  async function handleKakao() {
    setLoading(true)
    try {
      await signInWithKakao()
    } catch (err) {
      toast('로그인에 실패했습니다: ' + err.message, 'error')
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-badge">AI</div>
          <h1>AI 취업 코치</h1>
          <p>경험을 직무 역량으로 변환하는 AI 취업 코치</p>
        </div>

        <div className="auth-features">
          <div className="auth-feature"><span>🎯</span><span>STAR 경험 분석</span></div>
          <div className="auth-feature"><span>💼</span><span>직무 역량 변환</span></div>
          <div className="auth-feature"><span>📝</span><span>자기소개서 피드백</span></div>
          <div className="auth-feature"><span>🎤</span><span>면접 답변 코칭</span></div>
        </div>

        <button
          className="btn btn-kakao btn-full"
          onClick={handleKakao}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.712 1.523 5.1 3.85 6.6l-.98 3.6 4.19-2.76c.94.18 1.92.28 2.94.28 5.523 0 10-3.477 10-7.72C24 6.477 19.523 3 12 3z"/>
          </svg>
          {loading ? '로그인 중...' : '카카오로 시작하기'}
        </button>

        <p className="auth-notice">로그인하면 분석 기록이 자동 저장됩니다.</p>
      </div>
    </div>
  )
}
