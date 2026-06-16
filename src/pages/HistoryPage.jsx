import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function calcScore(result) {
  const scores = []
  if (result.competencies?.fitScore) scores.push(result.competencies.fitScore)
  if (result.coverFeedback?.scores?.overall) scores.push(result.coverFeedback.scores.overall)
  if (result.interviewFeedback?.scores?.overall) scores.push(result.interviewFeedback.scores.overall)
  if (!scores.length) return null
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function formatDate(isoStr) {
  const d = new Date(isoStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function HistoryPage() {
  const { user } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast('기록을 불러오지 못했습니다.', 'error')
        else setAnalyses(data || [])
        setLoading(false)
      })
  }, [user])

  async function deleteAnalysis(id) {
    if (!window.confirm('이 분석 기록을 삭제할까요?')) return
    const { error } = await supabase.from('analyses').delete().eq('id', id)
    if (error) { toast('삭제에 실패했습니다.', 'error'); return }
    setAnalyses(prev => prev.filter(a => a.id !== id))
    toast('삭제되었습니다.', 'success')
  }

  if (loading) return <div className="page-container"><div className="loading-text">불러오는 중...</div></div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">성장 기록</h1>
        <p className="page-subtitle">지금까지 분석한 {analyses.length}개의 기록입니다.</p>
      </div>

      {analyses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>아직 분석 기록이 없습니다</h3>
          <p>첫 번째 경험을 분석해보세요!</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>분석 시작하기</button>
        </div>
      ) : (
        <div className="history-list">
          {analyses.map((a, i) => {
            const score = calcScore(a.result)
            return (
              <div key={a.id} className="history-card">
                <div className="history-card-header">
                  <div>
                    <span className="history-num">#{analyses.length - i}</span>
                    <span className="history-job">{a.job}</span>
                    {a.company && <span className="history-company"> · {a.company}</span>}
                  </div>
                  {score !== null && (
                    <div className="history-score" style={{ color: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444' }}>
                      {score}점
                    </div>
                  )}
                </div>
                <p className="history-date">{formatDate(a.created_at)}</p>
                <p className="history-preview">{a.experience.substring(0, 100)}...</p>
                <div className="history-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/results', { state: { result: a.result } })}>결과 보기</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteAnalysis(a.id)}>삭제</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
