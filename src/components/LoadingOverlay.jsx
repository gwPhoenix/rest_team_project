const STEPS = ['경험 분석', '역량 변환', '피드백 생성', '질문 생성']

export default function LoadingOverlay({ step }) {
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="loading-spinner" />
        <h3>AI가 분석 중입니다</h3>
        <p>잠시만 기다려 주세요...</p>
        <div className="loading-progress">
          {STEPS.map((label, i) => (
            <div key={i} className={`progress-step${step > i ? ' done' : step === i ? ' active' : ''}`}>
              <div className="pstep-dot" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
