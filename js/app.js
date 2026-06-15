// ============================================================
// 메인 앱 컨트롤러 — 라우팅, 인증, 모달, 토스트
// ============================================================

var App = (() => {
  let currentRoute = "/";
  let currentResultsData = null;
  let userDropdownOpen = false;

  // ── 초기화 ──
  function init() {
    AuthService.onAuthStateChanged(handleAuthChange);
    setupApiKeyModal();
    setupUserMenu();
    setupNavLinks();
    window.addEventListener("hashchange", () => handleRoute());
  }

  // ── 인증 상태 처리 ──
  function handleAuthChange(user) {
    const authOverlay = document.getElementById("auth-overlay");
    const appEl = document.getElementById("app");

    if (user) {
      authOverlay.style.display = "none";
      appEl.style.display = "block";
      updateUserUI(user);

      // API 키 미설정 시 안내
      if (!OpenAIService.getApiKey()) {
        setTimeout(() => openApiKeyModal(), 1000);
      }
      handleRoute();
    } else {
      authOverlay.style.display = "flex";
      appEl.style.display = "none";
      setupAuthForm();
    }
  }

  // ── 사용자 UI 업데이트 ──
  function updateUserUI(user) {
    const avatar = document.getElementById("user-avatar");
    const nameEl = document.getElementById("user-name-display");
    const emailEl = document.getElementById("user-email-display");
    if (avatar) avatar.textContent = (user.displayName || user.email || "U")[0].toUpperCase();
    if (nameEl) nameEl.textContent = user.displayName || user.email || "사용자";
    if (emailEl) emailEl.textContent = user.email || "";
  }

  // ── 라우터 ──
  function handleRoute() {
    const hash = window.location.hash || "#/";
    const path = hash.replace("#", "") || "/";
    currentRoute = path;
    updateNavLinks(path);

    const container = document.getElementById("page-container");
    if (!container) return;

    if (path === "/" || path === "") {
      container.innerHTML = InputPage.render();
      InputPage.afterRender();
    } else if (path === "/results") {
      container.innerHTML = ResultsPage.render(currentResultsData);
      ResultsPage.afterRender();
    } else if (path === "/history") {
      container.innerHTML = "<div class='empty-state'><div class='loading-spinner' style='width:32px;height:32px;border-width:2px;margin:0 auto 12px'></div><p>불러오는 중...</p></div>";
      HistoryPage.render().then(html => {
        container.innerHTML = html;
        HistoryPage.afterRender();
      });
    } else {
      navigate("/");
    }
  }

  function navigate(path, data) {
    if (data && path === "/results") currentResultsData = data;
    window.location.hash = "#" + path;
  }

  function updateNavLinks(path) {
    document.querySelectorAll(".nav-link").forEach(link => {
      const nav = link.dataset.nav;
      const active =
        (nav === "input" && (path === "/" || path === "")) ||
        (nav === "history" && path === "/history");
      link.classList.toggle("active", active);
    });
  }

  function setupNavLinks() {
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", e => {
        if (userDropdownOpen) closeUserDropdown();
      });
    });
  }

  // ── Auth 폼 ──
  function setupAuthForm() {
    let isLogin = true;

    const tabLogin = document.getElementById("tab-login");
    const tabSignup = document.getElementById("tab-signup");
    const signupNameGroup = document.getElementById("signup-name-group");
    const submitBtn = document.getElementById("auth-submit-btn");
    const authForm = document.getElementById("auth-form");
    const googleBtn = document.getElementById("google-signin-btn");
    const errorEl = document.getElementById("auth-error");

    if (!authForm) return;

    function setMode(login) {
      isLogin = login;
      tabLogin.classList.toggle("active", login);
      tabSignup.classList.toggle("active", !login);
      signupNameGroup.style.display = login ? "none" : "block";
      submitBtn.textContent = login ? "로그인" : "회원가입";
      errorEl.style.display = "none";
    }

    tabLogin.onclick = () => setMode(true);
    tabSignup.onclick = () => setMode(false);

    authForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-email").value.trim();
      const password = document.getElementById("auth-password").value;
      const name = document.getElementById("auth-name").value.trim();

      if (!email || !password) {
        showAuthError("이메일과 비밀번호를 입력해주세요.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "처리 중...";
      errorEl.style.display = "none";

      try {
        if (isLogin) {
          await AuthService.signInWithEmail(email, password);
        } else {
          if (password.length < 6) throw { message: "비밀번호는 6자 이상이어야 합니다." };
          await AuthService.signUpWithEmail(email, password, name);
        }
      } catch (err) {
        showAuthError(AuthService.getKoreanError(err));
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? "로그인" : "회원가입";
      }
    };

    googleBtn.onclick = async () => {
      googleBtn.disabled = true;
      googleBtn.textContent = "연결 중...";
      try {
        await AuthService.signInWithGoogle();
      } catch (err) {
        showAuthError(AuthService.getKoreanError(err));
        googleBtn.disabled = false;
        googleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#4285F4" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#34A853" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/></svg> Google로 계속하기`;
      }
    };
  }

  function showAuthError(msg) {
    const el = document.getElementById("auth-error");
    if (el) { el.textContent = msg; el.style.display = "block"; }
  }

  // ── 사용자 메뉴 ──
  function setupUserMenu() {
    const avatar = document.getElementById("user-avatar");
    const dropdown = document.getElementById("user-dropdown");
    const logoutBtn = document.getElementById("logout-btn");

    if (avatar) {
      avatar.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdownOpen = !userDropdownOpen;
        dropdown.style.display = userDropdownOpen ? "block" : "none";
      });
    }

    document.addEventListener("click", (e) => {
      if (userDropdownOpen && !e.target.closest(".user-menu")) {
        closeUserDropdown();
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        closeUserDropdown();
        await AuthService.signOut();
        showToast("로그아웃되었습니다.", "success");
      });
    }

    const navApikeyBtn = document.getElementById("nav-apikey-btn");
    if (navApikeyBtn) navApikeyBtn.addEventListener("click", openApiKeyModal);
  }

  function closeUserDropdown() {
    userDropdownOpen = false;
    const d = document.getElementById("user-dropdown");
    if (d) d.style.display = "none";
  }

  // ── API 키 모달 ──
  function setupApiKeyModal() {
    const modal = document.getElementById("apikey-modal");
    const input = document.getElementById("apikey-input");
    const saveBtn = document.getElementById("save-apikey-btn");
    const skipBtn = document.getElementById("skip-apikey-btn");
    const closeBtn = document.getElementById("close-apikey-modal");

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const key = input?.value?.trim();
        if (!key) { showToast("API 키를 입력해주세요.", "error"); return; }
        if (!key.startsWith("sk-")) { showToast("올바른 OpenAI API 키 형식이 아닙니다.", "error"); return; }
        localStorage.setItem("openai_api_key", key);
        closeApiKeyModal();
        showToast("API 키가 저장되었습니다.", "success");
        handleRoute(); // 페이지 새로고침
      });
    }

    if (skipBtn) skipBtn.addEventListener("click", closeApiKeyModal);
    if (closeBtn) closeBtn.addEventListener("click", closeApiKeyModal);

    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeApiKeyModal();
    });
  }

  function openApiKeyModal() {
    const modal = document.getElementById("apikey-modal");
    const input = document.getElementById("apikey-input");
    if (input) input.value = localStorage.getItem("openai_api_key") || "";
    if (modal) modal.style.display = "flex";
  }

  function closeApiKeyModal() {
    const modal = document.getElementById("apikey-modal");
    if (modal) modal.style.display = "none";
  }

  // ── 로딩 ──
  function showLoading(show) {
    const overlay = document.getElementById("loading-overlay");
    if (!overlay) return;
    overlay.style.display = show ? "flex" : "none";
    if (show) {
      document.querySelectorAll(".progress-step").forEach(s => {
        s.classList.remove("active", "done");
      });
      updateLoadingStep(1);
    }
  }

  function updateLoadingStep(step) {
    const steps = document.querySelectorAll(".progress-step");
    steps.forEach((el, i) => {
      el.classList.remove("active", "done");
      if (i + 1 < step) el.classList.add("done");
      else if (i + 1 === step) el.classList.add("active");
    });
    const messages = ["경험을 STAR 방법론으로 분석하고 있습니다...", "직무 역량을 변환하고 있습니다...", "자기소개서와 면접 피드백을 생성하고 있습니다...", "예상 면접 질문을 생성하고 있습니다..."];
    const title = document.getElementById("loading-title");
    const sub = document.getElementById("loading-subtitle");
    if (title) title.textContent = ["경험 분석 중", "역량 변환 중", "피드백 생성 중", "질문 생성 중"][step - 1] || "분석 중";
    if (sub) sub.textContent = messages[step - 1] || "잠시만 기다려 주세요...";
  }

  // ── 토스트 ──
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ""}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("hiding");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  return { init, navigate, showLoading, updateLoadingStep, showToast, openApiKeyModal };
})();

// 앱 시작
document.addEventListener("DOMContentLoaded", () => App.init());
