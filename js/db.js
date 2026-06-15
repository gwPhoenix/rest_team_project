// ============================================================
// Firestore CRUD + LocalStorage 폴백
// Firebase 미설정 시 localStorage에 자동으로 저장됩니다.
// ============================================================

var DBService = (() => {
  const LOCAL_KEY = "ai_coach_analyses";

  function isFirebaseReady() {
    return !!(window.db && window.auth && window.auth.currentUser);
  }

  // ── 로컬 스토리지 헬퍼 ──
  function getLocal() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function setLocal(data) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  }

  // ── 저장 ──
  async function saveAnalysis(analysisData) {
    const record = {
      ...analysisData,
      createdAt: new Date().toISOString(),
      id: Date.now().toString(),
    };

    if (isFirebaseReady()) {
      try {
        const uid = window.auth.currentUser.uid;
        const docRef = await window.db
          .collection("users")
          .doc(uid)
          .collection("analyses")
          .add({
            ...record,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        record.id = docRef.id;
        return record;
      } catch (e) {
        console.warn("Firestore 저장 실패, 로컬 저장:", e.message);
      }
    }

    // 로컬 폴백
    const all = getLocal();
    all.unshift(record);
    setLocal(all.slice(0, 50)); // 최대 50개 유지
    return record;
  }

  // ── 목록 조회 ──
  async function getAnalyses() {
    if (isFirebaseReady()) {
      try {
        const uid = window.auth.currentUser.uid;
        const snap = await window.db
          .collection("users")
          .doc(uid)
          .collection("analyses")
          .orderBy("createdAt", "desc")
          .limit(50)
          .get();

        return snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }));
      } catch (e) {
        console.warn("Firestore 조회 실패, 로컬 조회:", e.message);
      }
    }
    return getLocal();
  }

  // ── 단건 조회 ──
  async function getAnalysis(id) {
    if (isFirebaseReady()) {
      try {
        const uid = window.auth.currentUser.uid;
        const doc = await window.db
          .collection("users")
          .doc(uid)
          .collection("analyses")
          .doc(id)
          .get();
        if (doc.exists) {
          return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn("Firestore 단건 조회 실패:", e.message);
      }
    }
    return getLocal().find(a => a.id === id) || null;
  }

  // ── 삭제 ──
  async function deleteAnalysis(id) {
    if (isFirebaseReady()) {
      try {
        const uid = window.auth.currentUser.uid;
        await window.db
          .collection("users")
          .doc(uid)
          .collection("analyses")
          .doc(id)
          .delete();
        return true;
      } catch (e) {
        console.warn("Firestore 삭제 실패, 로컬 삭제:", e.message);
      }
    }
    const all = getLocal().filter(a => a.id !== id);
    setLocal(all);
    return true;
  }

  return { saveAnalysis, getAnalyses, getAnalysis, deleteAnalysis };
})();
