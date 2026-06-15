// ============================================================
// Firebase Auth 관리 + 로컬 폴백 인증
// ============================================================

var AuthService = (() => {
  let currentUser = null;
  let onAuthChangeCallback = null;

  function isFirebaseReady() {
    return !!(window.auth);
  }

  // ── 로컬 세션 관리 (Firebase 미설정 시) ──
  const LOCAL_USER_KEY = "ai_coach_user";

  function getLocalUser() {
    try { return JSON.parse(localStorage.getItem(LOCAL_USER_KEY)); } catch { return null; }
  }
  function setLocalUser(user) {
    if (user) localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(LOCAL_USER_KEY);
  }

  // ── 인증 상태 감지 ──
  function onAuthStateChanged(callback) {
    onAuthChangeCallback = callback;

    if (isFirebaseReady()) {
      window.auth.onAuthStateChanged(firebaseUser => {
        if (firebaseUser) {
          currentUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split("@")[0],
            photoURL: firebaseUser.photoURL,
          };
        } else {
          currentUser = null;
        }
        callback(currentUser);
      });
    } else {
      // 로컬 폴백
      currentUser = getLocalUser();
      callback(currentUser);
    }
  }

  // ── 이메일/비밀번호 로그인 ──
  async function signInWithEmail(email, password) {
    if (isFirebaseReady()) {
      const cred = await window.auth.signInWithEmailAndPassword(email, password);
      return cred.user;
    }
    // 로컬 폴백: 간단한 모의 인증
    const stored = JSON.parse(localStorage.getItem("ai_coach_users") || "{}");
    const user = stored[email];
    if (!user) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    if (user.password !== password) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    const u = { uid: email, email, displayName: user.name || email.split("@")[0] };
    setLocalUser(u);
    currentUser = u;
    onAuthChangeCallback && onAuthChangeCallback(u);
    return u;
  }

  // ── 이메일/비밀번호 회원가입 ──
  async function signUpWithEmail(email, password, name) {
    if (isFirebaseReady()) {
      const cred = await window.auth.createUserWithEmailAndPassword(email, password);
      if (name) await cred.user.updateProfile({ displayName: name });
      return cred.user;
    }
    // 로컬 폴백
    const stored = JSON.parse(localStorage.getItem("ai_coach_users") || "{}");
    if (stored[email]) throw new Error("이미 사용 중인 이메일입니다.");
    stored[email] = { password, name: name || email.split("@")[0] };
    localStorage.setItem("ai_coach_users", JSON.stringify(stored));
    const u = { uid: email, email, displayName: name || email.split("@")[0] };
    setLocalUser(u);
    currentUser = u;
    onAuthChangeCallback && onAuthChangeCallback(u);
    return u;
  }

  // ── Google 로그인 ──
  async function signInWithGoogle() {
    if (!isFirebaseReady()) {
      throw new Error("Google 로그인은 Firebase 설정이 필요합니다.");
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await window.auth.signInWithPopup(provider);
    return cred.user;
  }

  // ── 로그아웃 ──
  async function signOut() {
    if (isFirebaseReady()) {
      await window.auth.signOut();
    } else {
      setLocalUser(null);
      currentUser = null;
      onAuthChangeCallback && onAuthChangeCallback(null);
    }
  }

  // ── 현재 사용자 ──
  function getCurrentUser() { return currentUser; }

  // ── Firebase 오류 메시지 한국어 변환 ──
  function getKoreanError(error) {
    const map = {
      "auth/user-not-found": "이메일 또는 비밀번호가 올바르지 않습니다.",
      "auth/wrong-password": "이메일 또는 비밀번호가 올바르지 않습니다.",
      "auth/email-already-in-use": "이미 사용 중인 이메일입니다.",
      "auth/weak-password": "비밀번호는 6자 이상이어야 합니다.",
      "auth/invalid-email": "이메일 형식이 올바르지 않습니다.",
      "auth/too-many-requests": "잠시 후 다시 시도해주세요.",
      "auth/popup-closed-by-user": "로그인 창이 닫혔습니다.",
      "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
    };
    return map[error.code] || error.message || "오류가 발생했습니다.";
  }

  return { onAuthStateChanged, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, getCurrentUser, getKoreanError };
})();
