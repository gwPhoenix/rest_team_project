// ============================================================
// 성장 기록 페이지
// ============================================================

var HistoryPage = (() => {
  let analyses = [];

  async function render() {
    analyses = await DBService.getAnalyses();

    if (analyses.length === 0) {
      return `
        <div class="page-hero">
          <div class="page-hero-badge">📈 성장 기록</div>
          <h1>나의 취업 준비 기록</h1>
          <p>분석할수록 성장하는 취업 역량을 기록으로 확인하세요.</p>
        </div>
        <div class="card">
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>아직 분석 기록이 없습니다</h3>
            <p>경험을 입력하고 AI 분석을 시작해보세요.</p>
            <div style="margin-top:20px">
              <a href="#/" class="btn btn-primary">첫 분석 시작하기</a>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="page-hero" style="text-align:left; margin-bottom:24px">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px">
          <div>
            <div class="page-hero-badge">📈 성장 기록</div>
            <h1 style="font-size:24px; margin-top:8px">나의 취업 준비 기록</h1>
            <p>총 <strong>${analyses.length}회</strong> 분석 기록</p>
          </div>
          <a href="#/" class="btn btn-primary">+ 새 분석</a>
        </div>
      </div>

      <div class="history-grid">
        ${analyses.map((a, i) => renderHistoryCard(a, i)).join("")}
      </div>
    `;
  }

  function renderHistoryCard(a, index) {
    const date = a.createdAt
      ? new Date(a.createdAt).toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit" })
      : "";

    const overallScore = getOverallScore(a);
    const preview = a.expAnalysis?.summary || a.experience || "";

    return `
      <div class="history-card" onclick="HistoryPage.viewAnalysis('${escAttr(a.id)}')">
        <div class="history-index">${analyses.length - index}</div>
        <div class="history-info">
          <div class="history-job">${escH(a.jobRole || "직무 미입력")}</div>
          ${a.company ? `<div class="history-company">🏢 ${escH(a.company)}</div>` : ""}
          <div class="history-meta">
            <span class="history-date">🕐 ${date}</span>
            ${overallScore > 0 ? `<span class="history-badge">종합 ${overallScore}점</span>` : ""}
          </div>
          ${preview ? `<div class="history-preview">${escH(preview)}</div>` : ""}
        </div>
        <div class="history-actions" onclick="event.stopPropagation()">
          <button class="btn btn-sm btn-outline" onclick="HistoryPage.viewAnalysis('${escAttr(a.id)}')">보기</button>
          <button class="btn btn-sm btn-danger" onclick="HistoryPage.deleteAnalysis('${escAttr(a.id)}')">삭제</button>
        </div>
      </div>
    `;
  }

  function getOverallScore(a) {
    const scores = [];
    if (a.competencies?.fitScore) scores.push(a.competencies.fitScore);
    if (a.coverFeedback?.scores?.overall) scores.push(a.coverFeedback.scores.overall);
    if (a.interviewFeedback?.scores?.overall) scores.push(a.interviewFeedback.scores.overall);
    if (!scores.length) return 0;
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  }

  async function viewAnalysis(id) {
    const analysis = analyses.find(a => a.id === id) || await DBService.getAnalysis(id);
    if (analysis) {
      App.navigate("/results", analysis);
    } else {
      App.showToast("분석 결과를 찾을 수 없습니다.", "error");
    }
  }

  async function deleteAnalysis(id) {
    if (!confirm("이 분석 기록을 삭제하시겠습니까?")) return;
    await DBService.deleteAnalysis(id);
    App.showToast("삭제되었습니다.", "success");
    // 페이지 새로고침
    App.navigate("/history");
  }

  function afterRender() {}

  function escH(str) {
    return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function escAttr(str) {
    return String(str || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");
  }

  return { render, afterRender, viewAnalysis, deleteAnalysis };
})();
