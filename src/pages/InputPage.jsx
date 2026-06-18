import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { analyzeAll } from '../lib/openai'
import { supabase } from '../lib/supabase'
import LoadingOverlay from '../components/LoadingOverlay'

const JOB_ROLES = [
  '소프트웨어 개발자', '프론트엔드 개발자', '백엔드 개발자',
  '데이터 분석가', '데이터 사이언티스트', '서비스 기획자',
  'PM/PO', 'UX/UI 디자이너', '마케터', '기술 영업',
  '컨설턴트', '인사/HR', '재무/회계', '영업 관리',
  '운영/CS', '연구개발(R&D)', '기타',
]
const DRAFT_KEY = 'ai_coach_draft'

export default function InputPage() {
  const { user, apiKey } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  const [job,               setJob]               = useState('')
  const [company,           setCompany]           = useState('')
  const [exp,               setExp]               = useState('')
  const [interviewQuestion, setInterviewQuestion] = useState('')
  const [interview,         setInterview]         = useState('')
  const [loading,           setLoading]           = useState(false)
  const [step,              setStep]              = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const d = JSON.parse(saved)
        setJob(d.job || ''); setCompany(d.company || '')
        setExp(d.exp || d.cover || '')
        setInterviewQuestion(d.interviewQuestion || '')
        setInterview(d.interview || '')
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ job, company, exp, interviewQuestion, interview }))
  }, [job, company, exp, interviewQuestion, interview])

  async function startAnalysis() {
    if (!job) { toast('직무를 선택해주세요.', 'warning'); return }
    if (exp.trim().length < 30) { toast('경험을 30자 이상 입력해주세요.', 'warning'); return }
    if (!apiKey) { toast('API 키가 설정되지 않았습니다. 관리자에게 문의하세요.', 'warning'); return }

    setLoading(true); setStep(0)
    try {
      const result = await analyzeAll(
        apiKey,
        { jobRole: job, company, experience: exp, coverLetter: exp, interviewAnswer: interview, interviewQuestion },
        s => setStep(s - 1)
      )

      if (user) {
        await supabase.from('analyses').insert({
          user_id:    user.id,
          job,
          company:    company || null,
          experience: exp,
          result,
        })
      }

      localStorage.removeItem(DRAFT_KEY)
      navigate('/results', { state: { result } })
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <LoadingOverlay step={step} />}

      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">경험을 직무 역량으로</h1>
          <p className="page-subtitle">경험을 입력하면 AI가 STAR 분석, 역량 변환, 면접 피드백까지 한번에 분석해드립니다.</p>
        </div>

        <div className="input-form">
          {/* 직무 선택 */}
          <div className="form-section">
            <h2 className="section-title">지원 정보</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">지원 직무 <span className="required">*</span></label>
                <select className="form-input" value={job} onChange={e => setJob(e.target.value)}>
                  <option value="">직무를 선택하세요</option>
                  {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">지원 기업</label>
                <input className="form-input" type="text" placeholder="기업명을 입력하세요" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
            </div>
          </div>

          {/* 경험 및 자기소개서 입력 */}
          <div className="form-section">
            <h2 className="section-title">경험 및 자기소개서 <span className="required">*</span></h2>
            <p className="section-desc">경험이나 자기소개서 내용을 자유롭게 입력하세요. AI가 STAR 분석, 역량 변환, 자기소개서 피드백을 각각 분리하여 코칭해드립니다.</p>
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="경험 또는 자기소개서 내용을 입력해주세요 (최소 30자)&#10;예: 팀 프로젝트에서 프론트엔드를 담당하여 React로 대시보드를 개발했습니다..."
                value={exp}
                onChange={e => setExp(e.target.value)}
                maxLength={2000}
                rows={8}
              />
              <div className={`char-count${exp.length > 1800 ? ' warn' : ''}`}>{exp.length} / 2000</div>
            </div>
          </div>

          {/* 면접 질문 */}
          <div className="form-section">
            <h2 className="section-title">면접 질문 <span className="optional">(선택)</span></h2>
            <p className="section-desc">면접에서 받은 질문을 입력하세요. AI가 질문 의도를 파악하여 답변 피드백에 반영합니다.</p>
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="면접 질문을 입력하세요...&#10;예: 본인의 강점과 약점을 말해주세요."
                value={interviewQuestion}
                onChange={e => setInterviewQuestion(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <div className={`char-count${interviewQuestion.length > 450 ? ' warn' : ''}`}>{interviewQuestion.length} / 500</div>
            </div>
          </div>

          {/* 면접 답변 */}
          <div className="form-section">
            <h2 className="section-title">면접 답변 <span className="optional">(선택)</span></h2>
            <p className="section-desc">면접에서 준비한 답변이 있으면 입력하세요. AI가 논리성, 전달력, 개선점을 피드백합니다.</p>
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="면접 답변을 입력하세요..."
                value={interview}
                onChange={e => setInterview(e.target.value)}
                maxLength={1500}
                rows={4}
              />
              <div className={`char-count${interview.length > 1350 ? ' warn' : ''}`}>{interview.length} / 1500</div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary btn-lg btn-full" onClick={startAnalysis} disabled={loading}>
              {loading ? '분석 중...' : '🚀 AI 분석 시작'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
