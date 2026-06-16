import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ApiKeyModal({ onClose }) {
  const { apiKey, setApiKey } = useAuth()
  const toast = useToast()
  const [value, setValue] = useState(apiKey)

  function save() {
    if (!value.startsWith('sk-')) {
      toast('올바른 API 키 형식이 아닙니다. (sk-로 시작)', 'error')
      return
    }
    setApiKey(value.trim())
    toast('API 키가 저장되었습니다.', 'success')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>OpenAI API 키 설정</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="modal-desc">
          AI 코칭 기능을 사용하려면 OpenAI API 키가 필요합니다.<br />
          API 키는 브라우저 로컬에만 저장되며 외부로 전송되지 않습니다.
        </p>
        <div className="form-group">
          <label className="form-label">OpenAI API 키</label>
          <input
            className="form-input"
            type="password"
            placeholder="sk-..."
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
          />
          <small className="form-hint">
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
              OpenAI 플랫폼
            </a>에서 API 키를 발급받을 수 있습니다.
          </small>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={save}>저장하기</button>
          <button className="btn btn-ghost" onClick={onClose}>나중에 설정</button>
        </div>
      </div>
    </div>
  )
}
