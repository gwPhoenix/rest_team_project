// ============================================================
// AI 분석 결과 페이지
// ============================================================

var ResultsPage = (() => {
  let data = null;

  function render(analysisData) {
    data = analysisData;
    if (!data) return `<div class="empty-state"><div class="empty-icon">📭</div><h3>분석 결과가 없습니다</h3><p><a href="#/">분석 페이지로 이동</a>하여 경험을 입력해주세요.</p></div>`;

    const date = data.createdAt ? new Date(data.createdAt).toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric" }) : "";

    return `
      <div class="results-header">
        <div class="results-title">
          <h2>${escH(data.jobRole)} 분석 결과</h2>
          <p>${data.company ? `${escH(data.company)} · ` : ""}${date}</p>
        </div>
        <div class="results-meta">
          <button class="btn btn-outline btn-sm" onclick="ResultsPage.saveAndDownload()">💾 저장</button>
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('/')">← 다시 분석</button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button class="tab-btn active" data-tab="experience" onclick="ResultsPage.switchTab('experience', this)">경험 분석</button>
        <button class="tab-btn" data-tab="competency" onclick="ResultsPage.switchTab('competency', this)">역량 변환</button>
        ${data.coverFeedback ? `<button class="tab-btn" data-tab="coverletter" onclick="ResultsPage.switchTab('coverletter', this)">자기소개서</button>` : ""}
        ${data.interviewFeedback ? `<button class="tab-btn" data-tab="interview" onclick="ResultsPage.switchTab('interview', this)">면접 피드백</button>` : ""}
        <button class="tab-btn" data-tab="questions" onclick="ResultsPage.switchTab('questions', this)">예상 질문</button>
        <button class="tab-btn" data-tab="missions" onclick="ResultsPage.switchTab('missions', this)">성장 미션</button>
      </div>

      <!-- Tab: 경험 분석 -->
      <div class="tab-content active" id="tab-experience">
        ${renderExperienceTab()}
      </div>

      <!-- Tab: 역량 변환 -->
      <div class="tab-content" id="tab-competency">
        ${renderCompetencyTab()}
      </div>

      <!-- Tab: 자기소개서 -->
      ${data.coverFeedback ? `
      <div class="tab-content" id="tab-coverletter">
        ${renderCoverLetterTab()}
      </div>` : ""}

      <!-- Tab: 면접 피드백 -->
      ${data.interviewFeedback ? `
      <div class="tab-content" id="tab-interview">
        ${renderInterviewTab()}
      </div>` : ""}

      <!-- Tab: 예상 질문 -->
      <div class="tab-content" id="tab-questions">
        ${renderQuestionsTab()}
      </div>

      <!-- Tab: 성장 미션 -->
      <div class="tab-content" id="tab-missions">
        ${renderMissionsTab()}
      </div>
    `;
  }

  // ── 경험 분석 탭 ──
  function renderExperienceTab() {
    const e = data.expAnalysis || {};
    return `
      <div class="results-grid">
        <!-- 경험 요약 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon blue">🔍</div>
              <h3>경험 분석 요약</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="info-box blue mb-3">
              ${escH(e.summary || "")}
            </div>
            ${e.keywords ? `
            <div class="flex gap-2" style="flex-wrap:wrap">
              ${e.keywords.map(k => `<span class="tag blue">${escH(k)}</span>`).join("")}
            </div>` : ""}
          </div>
        </div>

        <!-- STAR 분석 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon green">⭐</div>
              <h3>STAR 분석</h3>
            </div>
            <span class="tag gray text-xs">Situation · Task · Action · Result</span>
          </div>
          <div class="card-body">
            <div class="star-grid">
              <div class="star-item">
                <div class="star-badge S">S</div>
                <div class="text-xs text-muted mb-2 font-semibold">상황 (Situation)</div>
                <div class="text-sm">${escH(e.situation || "-")}</div>
              </div>
              <div class="star-item">
                <div class="star-badge T">T</div>
                <div class="text-xs text-muted mb-2 font-semibold">과제 (Task)</div>
                <div class="text-sm">${escH(e.task || "-")}</div>
              </div>
              <div class="star-item">
                <div class="star-badge A">A</div>
                <div class="text-xs text-muted mb-2 font-semibold">행동 (Action)</div>
                <div class="text-sm">${escH(e.action || "-")}</div>
              </div>
              <div class="star-item">
                <div class="star-badge R">R</div>
                <div class="text-xs text-muted mb-2 font-semibold">결과 (Result)</div>
                <div class="text-sm">${escH(e.result || "-")}</div>
              </div>
            </div>
            ${e.learning ? `
            <div class="info-box green mt-3">
              <strong>💡 배운 점:</strong> ${escH(e.learning)}
            </div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  // ── 역량 변환 탭 ──
  function renderCompetencyTab() {
    const c = data.competencies || {};
    const comps = c.competencies || [];
    return `
      <div class="results-grid">
        <!-- 직무 적합도 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon blue">📊</div>
              <h3>${escH(data.jobRole)} 직무 적합도</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="flex items-center gap-4 mb-3">
              <div class="score-ring-container">
                <div class="score-value">${c.fitScore || 0}</div>
                <div class="score-label">종합 점수</div>
              </div>
              <div style="flex:1">
                <div class="info-box blue">${escH(c.overallFit || "")}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 역량 목록 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon green">💪</div>
              <h3>추출된 직무 역량</h3>
            </div>
            <span class="tag green text-xs">${comps.length}개 역량 발견</span>
          </div>
          <div class="card-body">
            <div class="competency-list">
              ${comps.map((comp, i) => `
              <div class="competency-item">
                <div class="competency-rank">${i + 1}</div>
                <div class="competency-content">
                  <div class="competency-name">${escH(comp.name)}</div>
                  <div class="competency-desc">${escH(comp.description)}</div>
                  ${comp.evidence ? `<div class="text-xs text-muted mt-2">근거: ${escH(comp.evidence)}</div>` : ""}
                </div>
                <span class="competency-badge ${comp.relevance}">${relLabel(comp.relevance)}</span>
              </div>`).join("")}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── 자기소개서 탭 ──
  function renderCoverLetterTab() {
    const f = data.coverFeedback || {};
    const s = f.scores || {};
    const sug = f.suggestions || [];
    return `
      <div class="results-grid">
        <!-- 점수 분석 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon blue">📊</div>
              <h3>자기소개서 점수 분석</h3>
            </div>
            <div class="score-value" style="font-size:28px; color:var(--primary)">${s.overall || 0}<span style="font-size:14px; color:var(--text-muted)">점</span></div>
          </div>
          <div class="card-body">
            <div class="score-bars">
              ${scorebar("논리성", s.logic || 0, "blue")}
              ${scorebar("구체성", s.specificity || 0, "green")}
              ${scorebar("직무 적합성", s.jobFit || 0, "blue")}
            </div>
            ${f.summary ? `<div class="info-box blue mt-3">${escH(f.summary)}</div>` : ""}
          </div>
        </div>

        <!-- 강점 / 약점 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon green">💬</div>
              <h3>강점 · 약점 분석</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="feedback-section">
              <div class="feedback-section-title">
                <div class="indicator green"></div>
                강점
              </div>
              <ul class="feedback-list green">
                ${(f.strengths || []).map(s => `<li>${escH(s)}</li>`).join("")}
              </ul>
            </div>
            <div class="feedback-section mt-4">
              <div class="feedback-section-title">
                <div class="indicator red"></div>
                개선 필요
              </div>
              <ul class="feedback-list red">
                ${(f.weaknesses || []).map(w => `<li>${escH(w)}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>

        <!-- 개선 제안 -->
        ${sug.length ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon yellow">✏️</div>
              <h3>개선 문장 제안</h3>
            </div>
          </div>
          <div class="card-body">
            ${sug.map((s, i) => `
            <div class="mb-3 ${i > 0 ? "mt-4" : ""}">
              <div class="section-label"><span>개선 ${i+1}</span></div>
              <div style="padding:12px; background:var(--danger-light); border-radius:8px; font-size:13px; color:#991B1B; margin-bottom:8px">
                <span style="font-weight:600">기존:</span> ${escH(s.original || "")}
              </div>
              <div style="padding:12px; background:var(--accent-light); border-radius:8px; font-size:13px; color:#065F46; margin-bottom:8px">
                <span style="font-weight:600">개선:</span> ${escH(s.improved || "")}
              </div>
              <div style="font-size:12px; color:var(--text-muted)">${escH(s.reason || "")}</div>
            </div>`).join('<div class="divider"></div>')}
          </div>
        </div>` : ""}
      </div>
    `;
  }

  // ── 면접 피드백 탭 ──
  function renderInterviewTab() {
    const f = data.interviewFeedback || {};
    const s = f.scores || {};
    return `
      <div class="results-grid">
        <!-- 점수 분석 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon blue">🎤</div>
              <h3>면접 답변 점수 분석</h3>
            </div>
            <div class="score-value" style="font-size:28px; color:var(--primary)">${s.overall || 0}<span style="font-size:14px; color:var(--text-muted)">점</span></div>
          </div>
          <div class="card-body">
            <div class="score-bars">
              ${scorebar("논리성", s.logic || 0, "blue")}
              ${scorebar("구체성", s.specificity || 0, "green")}
              ${scorebar("직무 적합성", s.jobFit || 0, "blue")}
              ${scorebar("전달력", s.communication || 0, "yellow")}
            </div>
            ${f.feedback ? `<div class="info-box blue mt-3">${escH(f.feedback)}</div>` : ""}
          </div>
        </div>

        <!-- 잘한 점 / 개선점 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon green">💬</div>
              <h3>피드백 분석</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="feedback-section">
              <div class="feedback-section-title">
                <div class="indicator green"></div>
                잘한 점
              </div>
              <ul class="feedback-list green">
                ${(f.goodPoints || []).map(p => `<li>${escH(p)}</li>`).join("")}
              </ul>
            </div>
            <div class="feedback-section mt-4">
              <div class="feedback-section-title">
                <div class="indicator red"></div>
                개선 방향
              </div>
              <ul class="feedback-list red">
                ${(f.improvements || []).map(imp => `<li>${escH(imp)}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>

        <!-- 개선 답변 예시 -->
        ${f.improvedAnswer ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon yellow">✨</div>
              <h3>AI 개선 답변 예시</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="info-box green" style="white-space:pre-line; line-height:1.8">${escH(f.improvedAnswer)}</div>
          </div>
        </div>` : ""}

        <!-- 꼬리 질문 예고 -->
        ${(f.followUpQuestions || []).length ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon red">❓</div>
              <h3>이 답변에서 나올 꼬리 질문</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="question-list">
              ${(f.followUpQuestions || []).map((q, i) => `
              <div class="question-item">
                <div class="question-num followup">Q</div>
                <div class="question-text">${escH(q)}</div>
              </div>`).join("")}
            </div>
          </div>
        </div>` : ""}
      </div>
    `;
  }

  // ── 예상 질문 탭 ──
  function renderQuestionsTab() {
    const q = data.questions || {};
    const basic = q.basicQuestions || [];
    const followup = q.followUpQuestions || [];
    const competencyQ = q.competencyQuestions || [];
    return `
      <div class="results-grid">
        <!-- 기본 질문 -->
        ${basic.length ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon blue">💬</div>
              <h3>기본 예상 질문</h3>
            </div>
            <span class="tag blue">${basic.length}개</span>
          </div>
          <div class="card-body">
            <div class="question-list">
              ${basic.map((item, i) => `
              <div class="question-item" style="flex-direction:column; gap:8px">
                <div class="flex items-center gap-3">
                  <div class="question-num basic">Q${i+1}</div>
                  <div class="question-text font-semibold">${escH(item.question || item)}</div>
                </div>
                ${item.intent ? `<div class="text-xs text-muted" style="padding-left:40px">💡 의도: ${escH(item.intent)}</div>` : ""}
                ${item.tip ? `<div class="text-xs text-primary" style="padding-left:40px">📌 팁: ${escH(item.tip)}</div>` : ""}
              </div>`).join("")}
            </div>
          </div>
        </div>` : ""}

        <!-- 꼬리 질문 -->
        ${followup.length ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon green">🔗</div>
              <h3>꼬리 질문</h3>
            </div>
            <span class="tag green">${followup.length}개</span>
          </div>
          <div class="card-body">
            <div class="question-list">
              ${followup.map((item, i) => `
              <div class="question-item" style="flex-direction:column; gap:6px">
                <div class="flex items-center gap-3">
                  <div class="question-num followup">↪</div>
                  <div class="question-text">${escH(item.question || item)}</div>
                </div>
                ${item.trigger ? `<div class="text-xs text-muted" style="padding-left:40px">언제: ${escH(item.trigger)}</div>` : ""}
              </div>`).join("")}
            </div>
          </div>
        </div>` : ""}

        <!-- 역량 질문 -->
        ${competencyQ.length ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon yellow">🎯</div>
              <h3>역량 확인 질문</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="question-list">
              ${competencyQ.map((item, i) => `
              <div class="question-item">
                <div class="question-num basic" style="background:var(--warning-light); color:var(--warning); font-size:10px">${escH(item.competency || "").substring(0,3)}</div>
                <div class="question-text">${escH(item.question || item)}</div>
              </div>`).join("")}
            </div>
          </div>
        </div>` : ""}
      </div>
    `;
  }

  // ── 성장 미션 탭 ──
  function renderMissionsTab() {
    const missions = data.missions || [];
    return `
      <div class="results-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon green">🚀</div>
              <h3>맞춤 성장 미션</h3>
            </div>
            <span class="tag green">${missions.length}개 미션</span>
          </div>
          <div class="card-body">
            <div class="info-box blue mb-4">분석 결과를 바탕으로 지금 당장 실천할 수 있는 성장 미션입니다.</div>
            <div class="mission-list">
              ${missions.map((m, i) => `
              <div class="mission-item">
                <div class="mission-icon">${m.icon || "📌"}</div>
                <div class="mission-content">
                  <div class="mission-title">미션 ${i+1}: ${escH(m.title)}</div>
                  <div class="mission-desc">${escH(m.description)}</div>
                </div>
              </div>`).join("")}
            </div>
          </div>
        </div>

        <!-- 다음 단계 -->
        <div class="card" style="background:linear-gradient(135deg,var(--primary-light),#F0F9FF); border-color:rgba(37,99,235,0.2)">
          <div class="card-body" style="text-align:center; padding:32px">
            <div style="font-size:32px; margin-bottom:12px">🎯</div>
            <h3 style="font-size:16px; font-weight:700; margin-bottom:8px">다음 단계</h3>
            <p style="font-size:13px; color:var(--text-secondary); margin-bottom:20px">
              더 많은 경험을 추가하고 다른 직무로도 분석해보세요.<br>
              성장 기록에서 이전 분석과 비교해볼 수 있습니다.
            </p>
            <div class="flex gap-3 justify-between" style="flex-wrap:wrap">
              <button class="btn btn-primary" onclick="App.navigate('/')">새 분석 시작</button>
              <button class="btn btn-outline" onclick="App.navigate('/history')">성장 기록 보기</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── 탭 전환 ──
  function switchTab(tabId, btn) {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.add("active");
    if (btn) btn.classList.add("active");
  }

  // ── 저장 ──
  async function saveAndDownload() {
    if (!data) return;
    App.showToast("분석 결과가 저장되었습니다.", "success");
  }

  // ── 유틸리티 ──
  function escH(str) {
    return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\n/g,"<br>");
  }

  function scorebar(label, val, color) {
    return `
    <div class="score-bar-item">
      <div class="score-bar-header">
        <span class="score-bar-label">${label}</span>
        <span class="score-bar-value">${val}점</span>
      </div>
      <div class="score-bar-track">
        <div class="score-bar-fill ${color}" style="width:${val}%"></div>
      </div>
    </div>`;
  }

  function relLabel(rel) {
    return { high: "높음", medium: "보통", low: "낮음" }[rel] || rel;
  }

  function afterRender() {
    // 점수 바 애니메이션
    setTimeout(() => {
      document.querySelectorAll(".score-bar-fill").forEach(el => {
        const w = el.style.width;
        el.style.width = "0";
        requestAnimationFrame(() => { el.style.width = w; });
      });
    }, 100);
  }

  return { render, afterRender, switchTab, saveAndDownload };
})();
