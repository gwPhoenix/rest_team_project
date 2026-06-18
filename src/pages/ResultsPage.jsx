import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { analyzeInterview } from '../lib/openai'

const TABS = [
  { id: 'exp',       label: '경험 분석' },
  { id: 'comp',      label: '역량 변환' },
  { id: 'cover',     label: '자소서 피드백' },
  { id: 'interview', label: '면접 피드백' },
  { id: 'questions', label: '예상 질문' },
  { id: 'missions',  label: '성장 미션' },
]

function ScoreBar({ label, score }) {
  return (
    <div className="score-item">
      <div className="score-header">
        <span>{label}</span>
        <span className="score-num">{score}</span>
      </div>
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${score}%`, background: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444' }} />
      </div>
    </div>
  )
}

function ExpTab({ data }) {
  return (
    <div className="tab-content">
      <div className="result-card">
        <h3>경험 요약</h3>
        <p>{data.summary}</p>
        <div className="keyword-list">
          {data.keywords?.map((k, i) => <span key={i} className="keyword-tag">{k}</span>)}
        </div>
      </div>
      <div className="star-grid">
        {[
          { label: '상황 (Situation)', value: data.situation },
          { label: '과제 (Task)',      value: data.task },
          { label: '행동 (Action)',    value: data.action },
          { label: '결과 (Result)',    value: data.result },
        ].map(s => (
          <div key={s.label} className="star-card">
            <h4>{s.label}</h4>
            <p>{s.value}</p>
          </div>
        ))}
      </div>
      {data.learning && (
        <div className="result-card">
          <h3>배운 점</h3>
          <p>{data.learning}</p>
        </div>
      )}
    </div>
  )
}

function CompTab({ data }) {
  const relevanceColor = { high: '#10B981', medium: '#F59E0B', low: '#EF4444' }
  const relevanceLabel = { high: '높음', medium: '보통', low: '낮음' }
  return (
    <div className="tab-content">
      <div className="result-card fit-card">
        <div className="fit-score-wrap">
          <div className="fit-score-circle">
            <span className="fit-score-num">{data.fitScore}</span>
            <span className="fit-score-label">/ 100</span>
          </div>
          <div>
            <h3>전반적 직무 적합성</h3>
            <p>{data.overallFit}</p>
          </div>
        </div>
      </div>
      <div className="comp-list">
        {data.competencies?.map((c, i) => (
          <div key={i} className="comp-card">
            <div className="comp-header">
              <span className="comp-name">{c.name}</span>
              <span className="comp-relevance" style={{ color: relevanceColor[c.relevance] }}>
                관련도 {relevanceLabel[c.relevance]}
              </span>
            </div>
            <p className="comp-desc">{c.description}</p>
            <p className="comp-evidence">💡 {c.evidence}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function InterviewInputSection({ onSubmit, loading }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  return (
    <div className="tab-content">
      <div className="result-card">
        <h3>면접 피드백 받기</h3>
        <p style={{ color: 'var(--txt-2)', marginBottom: 20, fontSize: 14 }}>
          면접 질문과 답변을 입력하면 AI가 논리성, 전달력, 개선점을 피드백합니다.
        </p>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">면접 질문 <span style={{ color: 'var(--txt-3)', fontSize: 12, fontWeight: 500 }}>(선택)</span></label>
          <textarea
            className="form-textarea"
            placeholder="면접에서 받은 질문을 입력하세요...&#10;예: 본인의 강점과 약점을 말해주세요."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className={`char-count${question.length > 450 ? ' warn' : ''}`}>{question.length} / 500</div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">면접 답변 <span style={{ color: 'var(--red)', fontSize: 13, fontWeight: 800 }}>*</span></label>
          <textarea
            className="form-textarea"
            placeholder="면접 답변을 입력하세요..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            maxLength={1500}
            rows={6}
          />
          <div className={`char-count${answer.length > 1350 ? ' warn' : ''}`}>{answer.length} / 1500</div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => onSubmit({ question, answer })}
          disabled={loading || answer.trim().length < 10}
        >
          {loading ? '분석 중...' : '면접 피드백 받기'}
        </button>
      </div>
    </div>
  )
}

function FeedbackTab({ data, type }) {
  if (!data) return (
    <div className="tab-content">
      <div className="empty-state">
        <p>자기소개서를 입력하면 피드백을 받을 수 있습니다.</p>
        <Link to="/" className="btn btn-primary">입력 페이지로</Link>
      </div>
    </div>
  )

  const scoreLabels = type === 'cover'
    ? { logic: '논리성', specificity: '구체성', jobFit: '직무 적합성', overall: '종합' }
    : { logic: '논리성', specificity: '구체성', jobFit: '직무 적합성', communication: '전달력', overall: '종합' }

  return (
    <div className="tab-content">
      <div className="result-card">
        <h3>점수</h3>
        {Object.entries(data.scores).map(([k, v]) => (
          <ScoreBar key={k} label={scoreLabels[k] || k} score={v} />
        ))}
      </div>
      {type === 'cover' && (
        <>
          <div className="feedback-cols">
            <div className="result-card">
              <h3>강점</h3>
              <ul>{data.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="result-card">
              <h3>개선점</h3>
              <ul>{data.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          </div>
          {data.suggestions?.map((s, i) => (
            <div key={i} className="result-card suggestion-card">
              <h4>개선 제안 {i + 1}</h4>
              <div className="suggestion-before"><span>원문</span><p>{s.original}</p></div>
              <div className="suggestion-after"><span>개선</span><p>{s.improved}</p></div>
              <p className="suggestion-reason">이유: {s.reason}</p>
            </div>
          ))}
        </>
      )}
      {type === 'interview' && (
        <>
          <div className="result-card"><h3>총평</h3><p>{data.feedback}</p></div>
          <div className="feedback-cols">
            <div className="result-card">
              <h3>잘한 점</h3>
              <ul>{data.goodPoints?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="result-card">
              <h3>개선점</h3>
              <ul>{data.improvements?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          </div>
          {data.improvedAnswer && (
            <div className="result-card">
              <h3>개선된 답변 예시</h3>
              <p className="improved-answer">{data.improvedAnswer}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function QuestionsTab({ data }) {
  return (
    <div className="tab-content">
      {data.basicQuestions?.length > 0 && (
        <div className="result-card">
          <h3>기본 질문</h3>
          {data.basicQuestions.map((q, i) => (
            <div key={i} className="question-item">
              <p className="question-text">Q{i + 1}. {q.question}</p>
              <p className="question-intent">💡 {q.intent}</p>
              <p className="question-tip">📌 {q.tip}</p>
            </div>
          ))}
        </div>
      )}
      {data.competencyQuestions?.length > 0 && (
        <div className="result-card">
          <h3>역량 검증 질문</h3>
          {data.competencyQuestions.map((q, i) => (
            <div key={i} className="question-item">
              <span className="competency-badge">{q.competency}</span>
              <p className="question-text">{q.question}</p>
            </div>
          ))}
        </div>
      )}
      {data.followUpQuestions?.length > 0 && (
        <div className="result-card">
          <h3>꼬리 질문</h3>
          {data.followUpQuestions.map((q, i) => (
            <div key={i} className="question-item">
              <p className="question-text">↳ {q.question}</p>
              <p className="question-intent">🎯 {q.trigger}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MissionsTab({ data }) {
  return (
    <div className="tab-content">
      <div className="missions-grid">
        {data.map((m, i) => (
          <div key={i} className="mission-card">
            <div className="mission-icon">{m.icon}</div>
            <h3>{m.title}</h3>
            <p>{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { apiKey } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('exp')
  const [result, setResult] = useState(location.state?.result)
  const [interviewLoading, setInterviewLoading] = useState(false)

  async function submitInterview({ question, answer }) {
    if (!apiKey) { toast('API 키가 설정되지 않았습니다. 관리자에게 문의하세요.', 'warning'); return }
    setInterviewLoading(true)
    try {
      const feedback = await analyzeInterview(apiKey, {
        jobRole: result.jobRole,
        company: result.company,
        interviewAnswer: answer,
        interviewQuestion: question || undefined,
        expSummary: result.expAnalysis,
      })
      setResult(prev => ({ ...prev, interviewFeedback: feedback }))
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setInterviewLoading(false)
    }
  }

  if (!result) return (
    <div className="page-container">
      <div className="empty-state">
        <p>분석 결과가 없습니다. 먼저 분석을 진행해주세요.</p>
        <Link to="/" className="btn btn-primary">분석하러 가기</Link>
      </div>
    </div>
  )

  const { expAnalysis, competencies, coverFeedback, interviewFeedback, questions, missions, jobRole, company } = result

  return (
    <div className="page-container">
      <div className="result-header">
        <div>
          <h1 className="page-title">분석 결과</h1>
          <p className="page-subtitle">{jobRole}{company ? ` · ${company}` : ''}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>다시 분석하기</button>
      </div>

      <div className="tabs-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'exp'       && <ExpTab data={expAnalysis} />}
      {activeTab === 'comp'      && <CompTab data={competencies} />}
      {activeTab === 'cover'     && <FeedbackTab data={coverFeedback} type="cover" />}
      {activeTab === 'interview' && (
        interviewFeedback
          ? <FeedbackTab data={interviewFeedback} type="interview" />
          : <InterviewInputSection onSubmit={submitInterview} loading={interviewLoading} />
      )}
      {activeTab === 'questions' && <QuestionsTab data={questions} />}
      {activeTab === 'missions'  && <MissionsTab data={missions} />}
    </div>
  )
}
