# AI 자기소개서·면접 코치

사용자의 경험을 직무 역량으로 변환하여 자기소개서 작성과 면접 준비를 돕는 AI 취업 코칭 서비스

## 실행 방법

### 1. Firebase 설정 (로그인 + 데이터 저장)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 새 프로젝트 생성
2. **Authentication** → 이메일/비밀번호, Google 로그인 활성화
3. **Firestore Database** → 데이터베이스 생성 (테스트 모드)
4. **프로젝트 설정** → 웹 앱 추가 → SDK 코드 복사
5. `js/config.js` 파일에서 `FIREBASE_CONFIG` 값을 실제 값으로 교체

> Firebase 미설정 시 **로컬 모드**로 동작합니다 (브라우저에 저장).

### 2. OpenAI API 키 설정

1. [OpenAI 플랫폼](https://platform.openai.com/api-keys)에서 API 키 발급
2. 앱 실행 후 우측 상단 **설정(⚙️)** 버튼 클릭
3. API 키 입력 및 저장

### 3. GitHub Pages 배포

```bash
git clone https://github.com/gwPhoenix/rest_team_project.git
cd rest_team_project
git push origin main
```

GitHub 레포지토리 → Settings → Pages → Source: main 브랜치 선택

## 주요 기능

| 기능 | 설명 |
|------|------|
| **경험 분석** | STAR 방법론으로 경험 자동 분석 |
| **직무 역량 변환** | 경험을 선택 직무 관점에서 재해석 |
| **자기소개서 피드백** | 강점/약점/개선 문장 제안 |
| **면접 답변 분석** | 논리성·구체성·직무 적합성 평가 |
| **예상 질문 생성** | 기본 질문 + 꼬리 질문 생성 |
| **성장 미션** | 개인 맞춤 개선 과제 제공 |
| **성장 기록** | 분석 이력 저장 및 조회 |

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (SPA)
- **Auth & DB**: Firebase Authentication + Firestore
- **AI**: OpenAI API (gpt-4o-mini)
- **Deploy**: GitHub Pages

## 디자인 가이드

| 항목 | 값 |
|------|-----|
| 메인 컬러 | `#2563EB` |
| 보조 컬러 | `#F8FAFC` |
| 강조 컬러 | `#10B981` |
| 폰트 | Noto Sans KR |
