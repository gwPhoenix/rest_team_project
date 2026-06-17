const STEPS = [
  { label: '경험 분석',  desc: 'STAR 방법론으로 경험을 구조화하는 중' },
  { label: '역량 변환',  desc: '직무 핵심 역량으로 변환하는 중' },
  { label: '피드백 생성', desc: '자소서·면접 피드백을 작성하는 중' },
  { label: '질문 생성',  desc: '예상 면접 질문을 생성하는 중' },
]

function StepIcon({ state }) {
  if (state === 'done') return (
    <svg className="pstep-icon done" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="#10B981" />
      <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (state === 'active') return (
    <span className="pstep-icon active">
      <span className="pstep-ring" />
    </span>
  )
  return (
    <svg className="pstep-icon idle" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="#CBD5E1" strokeWidth="1.5" />
    </svg>
  )
}

export default function LoadingOverlay({ step }) {
  const total   = STEPS.length
  const pct     = Math.round((step / total) * 100)

  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="loading-spinner" />
        <h3>AI가 분석 중입니다</h3>

        <div className="loading-pbar-wrap">
          <div className="loading-pbar-bg">
            <div className="loading-pbar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="loading-pbar-pct">{pct}%</span>
        </div>

        <div className="loading-progress">
          {STEPS.map((s, i) => {
            const state = step > i ? 'done' : step === i ? 'active' : 'idle'
            return (
              <div key={i} className={`progress-step ${state}`}>
                <StepIcon state={state} />
                <div className="pstep-text">
                  <span className="pstep-label">{s.label}</span>
                  {state === 'active' && <span className="pstep-desc">{s.desc}</span>}
                </div>
                <span className="pstep-badge">
                  {state === 'done'   ? '완료'    : ''}
                  {state === 'active' ? '진행 중' : ''}
                  {state === 'idle'   ? '대기'    : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
