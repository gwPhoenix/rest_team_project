// ============================================================
// Firebase 설정 — Firebase 콘솔에서 발급받은 값을 입력하세요.
// 1. https://console.firebase.google.com 에서 프로젝트 생성
// 2. 프로젝트 설정 > 웹 앱 추가 > Firebase SDK 코드 복사
// 3. 아래 YOUR_... 값을 실제 값으로 교체하세요.
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// OpenAI API 키 설정 방법:
// - 앱 실행 후 우측 상단 설정(⚙️) 버튼 클릭
// - 본인의 OpenAI API 키 입력
// - 키는 브라우저 localStorage에만 저장됩니다.

// 직무 목록
const JOB_ROLES = [
  "소프트웨어 개발자",
  "프론트엔드 개발자",
  "백엔드 개발자",
  "데이터 분석가",
  "데이터 사이언티스트",
  "서비스 기획자",
  "PM/PO",
  "UX/UI 디자이너",
  "마케터",
  "기술 영업",
  "컨설턴트",
  "인사/HR",
  "재무/회계",
  "영업 관리",
  "운영/CS",
  "연구개발(R&D)",
  "기타"
];

// Firebase 초기화 — placeholder 값이면 로컬 모드로 동작
const firebaseConfigured = !FIREBASE_CONFIG.apiKey.includes("YOUR_");

if (firebaseConfigured) {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    console.log("Firebase initialized (cloud mode)");
  } catch (e) {
    console.warn("Firebase 초기화 실패:", e.message);
    window.db = null;
    window.auth = null;
  }
} else {
  console.info("Firebase 미설정 → 로컬 모드로 동작합니다. (데이터는 브라우저에 저장)");
  window.db = null;
  window.auth = null;
}
