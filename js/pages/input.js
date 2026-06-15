// ============================================================
// 취업 정보 입력 페이지
// ============================================================

var InputPage = (() => {
  let selectedJob = "";

  function render() {
    const hasApiKey = !!OpenAIService.getApiKey();

    return `
      <div class="page-hero">
        <div class="page-hero-badge">✨ AI 취업 코치</div>
        <h1>경험을 직무 역량으로 변환하세요</h1>
        <p>AI가 당신의 경험을 분석하여 자기소개서와 면접 역량을 키워드립니다.</p>
      </div>

      ${!hasApiKey ? `
      <div class="no-apikey-warning">
        <span>⚠️</span>
        <p>OpenAI API 키가 설정되지 않았습니다. 우측 상단 <strong>설정(⚙️)</strong> 버튼에서 API 키를 입력해주세요.</p>
        <button class="btn btn-sm btn-outline" onclick="App.openApiKeyModal()">설정하기</button>
      </div>
      ` : ""}

      <div class="input-grid">

        <!-- 지원 정보 카드 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon blue">🎯</div>
              <h3>지원 정보 입력</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">지원 직무 <span class="required">*</span></label>
              <select class="form-select" id="job-role-select">
                <option value="">직무를 선택하세요</option>
                ${JOB_ROLES.map(j => `<option value="${j}">${j}</option>`).join("")}
              </select>
              <span class="form-hint">또는 아래에서 빠르게 선택하세요</span>
              <div class="job-tags" id="job-tags">
                ${["소프트웨어 개발자", "서비스 기획자", "PM/PO", "마케터", "데이터 분석가", "UX/UI 디자이너", "기술 영업", "컨설턴트"].map(j =>
                  `<button class="job-tag" data-job="${j}" onclick="InputPage.selectJobTag(this)">${j}</button>`
                ).join("")}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">지원 기업</label>
              <input class="form-input" type="text" id="company-input" placeholder="예: 카카오, 네이버, 삼성전자 (선택 사항)">
            </div>
          </div>
        </div>

        <!-- 경험 입력 카드 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon green">📝</div>
              <h3>경험 입력 <span class="required" style="font-size:12px; color: var(--danger)">*필수</span></h3>
            </div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">경험 내용</label>
              <textarea class="form-textarea tall" id="experience-input"
                placeholder="경험을 자유롭게 작성해주세요.&#10;&#10;예시:&#10;- 학교 축제 준비위원회에서 스폰서십 담당으로 활동&#10;- 총 15개 기업에 직접 연락하여 500만원 후원금 유치&#10;- 협상 전략 수립 및 계약서 작성 경험&#10;&#10;프로젝트, 인턴, 대외활동, 아르바이트, 공모전 등 어떤 경험이든 OK"></textarea>
              <span class="form-counter"><span id="exp-count">0</span>/1000</span>
            </div>
          </div>
        </div>

        <!-- 자기소개서 입력 카드 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon yellow">📄</div>
              <h3>자기소개서 입력 <span style="font-size:12px; color: var(--text-muted); font-weight:400">(선택)</span></h3>
            </div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">자기소개서</label>
              <textarea class="form-textarea tall" id="coverletter-input"
                placeholder="현재 작성 중이거나 완성된 자기소개서를 붙여넣으세요.&#10;AI가 강점, 약점, 개선 방향을 분석해드립니다.&#10;(없으면 비워두어도 됩니다)"></textarea>
              <span class="form-counter"><span id="cl-count">0</span>/2000</span>
            </div>
          </div>
        </div>

        <!-- 면접 답변 입력 카드 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon red">🎤</div>
              <h3>면접 답변 입력 <span style="font-size:12px; color: var(--text-muted); font-weight:400">(선택)</span></h3>
            </div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">면접 답변</label>
              <textarea class="form-textarea tall" id="interview-input"
                placeholder="면접에서 준비한 답변을 입력해주세요.&#10;예: &quot;자기소개를 해주세요&quot;, &quot;지원 동기를 말씀해 주세요&quot; 등&#10;AI가 논리성, 구체성, 직무 적합성을 평가해드립니다.&#10;(없으면 비워두어도 됩니다)"></textarea>
              <span class="form-counter"><span id="ia-count">0</span>/1500</span>
            </div>
          </div>
        </div>

        <!-- 분석 시작 버튼 -->
        <div class="analyze-section">
          <button class="btn btn-primary btn-lg" id="analyze-btn" onclick="InputPage.startAnalysis()">
            ✨ AI 분석 시작하기
          </button>
          <p>경험 + 직무 선택만으로도 분석이 가능합니다.</p>
        </div>

      </div>
    `;
  }

  function afterRender() {
    // 글자 수 카운터
    setupCounter("experience-input", "exp-count", 1000);
    setupCounter("coverletter-input", "cl-count", 2000);
    setupCounter("interview-input", "ia-count", 1500);

    // 직무 선택 동기화
    document.getElementById("job-role-select").addEventListener("change", e => {
      selectedJob = e.target.value;
      syncJobTags(selectedJob);
    });

    // 이전에 선택한 직무 복원
    if (selectedJob) {
      const sel = document.getElementById("job-role-select");
      if (sel) sel.value = selectedJob;
      syncJobTags(selectedJob);
    }

    // 임시저장 복원
    restoreDraft();
  }

  function setupCounter(textareaId, countId, maxLen) {
    const ta = document.getElementById(textareaId);
    const cnt = document.getElementById(countId);
    if (!ta || !cnt) return;
    function update() {
      const len = ta.value.length;
      cnt.textContent = len;
      cnt.style.color = len > maxLen * 0.9 ? "var(--warning)" : "";
    }
    ta.addEventListener("input", () => { update(); saveDraft(); });
    update();
  }

  function syncJobTags(job) {
    document.querySelectorAll(".job-tag").forEach(t => {
      t.classList.toggle("selected", t.dataset.job === job);
    });
  }

  function selectJobTag(el) {
    selectedJob = el.dataset.job;
    document.querySelectorAll(".job-tag").forEach(t => t.classList.remove("selected"));
    el.classList.add("selected");
    const sel = document.getElementById("job-role-select");
    if (sel) sel.value = selectedJob;
    saveDraft();
  }

  function saveDraft() {
    const draft = {
      jobRole: selectedJob || (document.getElementById("job-role-select")?.value || ""),
      company: document.getElementById("company-input")?.value || "",
      experience: document.getElementById("experience-input")?.value || "",
      coverLetter: document.getElementById("coverletter-input")?.value || "",
      interviewAnswer: document.getElementById("interview-input")?.value || "",
    };
    localStorage.setItem("ai_coach_draft", JSON.stringify(draft));
  }

  function restoreDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem("ai_coach_draft") || "{}");
      if (draft.jobRole) {
        selectedJob = draft.jobRole;
        const sel = document.getElementById("job-role-select");
        if (sel) sel.value = selectedJob;
        syncJobTags(selectedJob);
      }
      if (draft.company) setVal("company-input", draft.company);
      if (draft.experience) setVal("experience-input", draft.experience);
      if (draft.coverLetter) setVal("coverletter-input", draft.coverLetter);
      if (draft.interviewAnswer) setVal("interview-input", draft.interviewAnswer);
      ["exp-count","cl-count","ia-count"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const taMap = {"exp-count":"experience-input","cl-count":"coverletter-input","ia-count":"interview-input"};
          const ta = document.getElementById(taMap[id]);
          if (ta) el.textContent = ta.value.length;
        }
      });
    } catch {}
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  async function startAnalysis() {
    const jobRole = selectedJob || document.getElementById("job-role-select")?.value || "";
    const company = document.getElementById("company-input")?.value?.trim() || "";
    const experience = document.getElementById("experience-input")?.value?.trim() || "";
    const coverLetter = document.getElementById("coverletter-input")?.value?.trim() || "";
    const interviewAnswer = document.getElementById("interview-input")?.value?.trim() || "";

    // 유효성 검사
    if (!jobRole) { App.showToast("지원 직무를 선택해주세요.", "error"); return; }
    if (!experience) { App.showToast("경험 내용을 입력해주세요.", "error"); return; }
    if (experience.length < 30) { App.showToast("경험을 30자 이상 입력해주세요.", "error"); return; }
    if (!OpenAIService.getApiKey()) {
      App.showToast("API 키를 먼저 설정해주세요.", "error");
      App.openApiKeyModal();
      return;
    }

    App.showLoading(true);

    try {
      const result = await OpenAIService.analyzeAll(
        { jobRole, company, experience, coverLetter, interviewAnswer },
        (step) => App.updateLoadingStep(step)
      );

      // 저장
      const saved = await DBService.saveAnalysis(result);
      result.id = saved.id;

      // 임시저장 삭제
      localStorage.removeItem("ai_coach_draft");

      App.showLoading(false);
      App.navigate("/results", result);
    } catch (err) {
      App.showLoading(false);
      App.showToast(err.message || "분석 중 오류가 발생했습니다.", "error");
    }
  }

  return { render, afterRender, selectJobTag, startAnalysis };
})();
