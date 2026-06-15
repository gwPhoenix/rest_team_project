// ============================================================
// OpenAI API 통합 — 경험 분석, 역량 변환, 피드백 생성
// ============================================================

var OpenAIService = (() => {
  const MODEL = "gpt-4o-mini";
  const BASE_URL = "https://api.openai.com/v1/chat/completions";

  function getApiKey() {
    return localStorage.getItem("openai_api_key") || "";
  }

  async function callAPI(messages, jsonMode = true) {
    const key = getApiKey();
    if (!key) throw new Error("OpenAI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.");

    const body = {
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 3000,
    };
    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `API 오류 (${res.status})`;
      if (res.status === 401) throw new Error("API 키가 올바르지 않습니다. 설정에서 키를 확인해주세요.");
      if (res.status === 429) throw new Error("API 사용량 초과 또는 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
      throw new Error(msg);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI 응답이 비어있습니다.");

    if (jsonMode) {
      try {
        return JSON.parse(content);
      } catch {
        throw new Error("AI 응답 파싱 실패: " + content.substring(0, 100));
      }
    }
    return content;
  }

  // 메인 통합 분석 함수
  async function analyzeAll({ jobRole, company, experience, coverLetter, interviewAnswer }, onStep) {

    onStep && onStep(1); // 경험 분석 중

    const expAnalysis = await analyzeExperience({ jobRole, company, experience });

    onStep && onStep(2); // 역량 변환 중

    const competencies = await transformCompetencies({ jobRole, experience, expSummary: expAnalysis });

    onStep && onStep(3); // 피드백 생성 중

    const [coverFeedback, interviewFeedback] = await Promise.all([
      coverLetter ? analyzeCoverLetter({ jobRole, company, coverLetter, expSummary: expAnalysis }) : Promise.resolve(null),
      interviewAnswer ? analyzeInterview({ jobRole, company, interviewAnswer, expSummary: expAnalysis }) : Promise.resolve(null),
    ]);

    onStep && onStep(4); // 질문 생성 중

    const questions = await generateQuestions({ jobRole, company, expSummary: expAnalysis, competencies });

    const missions = generateMissions({ coverFeedback, interviewFeedback, competencies });

    return {
      jobRole,
      company,
      experience,
      coverLetter,
      interviewAnswer,
      expAnalysis,
      competencies,
      coverFeedback,
      interviewFeedback,
      questions,
      missions,
    };
  }

  // 1. 경험 분석 (STAR)
  async function analyzeExperience({ jobRole, company, experience }) {
    const messages = [
      {
        role: "system",
        content: `당신은 취업 전문 코치입니다. 사용자의 경험을 STAR 방법론(Situation/Task/Action/Result)으로 분석하고 직무 관점에서 핵심을 추출해주세요. 반드시 JSON 형식으로 응답하세요.`,
      },
      {
        role: "user",
        content: `지원 직무: ${jobRole}
지원 기업: ${company || "미입력"}
경험 내용:
${experience}

위 경험을 분석하여 다음 JSON 형식으로 응답해주세요:
{
  "summary": "경험 전체 요약 (2-3문장)",
  "situation": "상황/배경 설명 (1-2문장)",
  "task": "맡은 역할과 과제 (1-2문장)",
  "action": "구체적인 행동과 방법 (2-3문장)",
  "result": "결과와 성과 (1-2문장)",
  "learning": "배운 점과 성장 (1-2문장)",
  "keywords": ["핵심 키워드1", "핵심 키워드2", "핵심 키워드3"]
}`,
      },
    ];
    return callAPI(messages);
  }

  // 2. 직무 역량 변환
  async function transformCompetencies({ jobRole, experience, expSummary }) {
    const messages = [
      {
        role: "system",
        content: `당신은 취업 전문 코치입니다. 지원자의 경험을 선택한 직무의 핵심 역량과 연결하여 재해석해주세요. 반드시 JSON 형식으로 응답하세요.`,
      },
      {
        role: "user",
        content: `지원 직무: ${jobRole}
경험 요약: ${expSummary.summary}
핵심 행동: ${expSummary.action}
결과: ${expSummary.result}

이 경험을 ${jobRole} 직무 관점에서 역량으로 변환하여 JSON으로 응답해주세요:
{
  "competencies": [
    {
      "name": "역량 이름",
      "description": "경험과 역량의 연결 설명 (1-2문장)",
      "evidence": "구체적인 근거 (경험에서 뽑은 증거)",
      "relevance": "high|medium|low"
    }
  ],
  "overallFit": "전반적인 직무 적합성 설명 (2-3문장)",
  "fitScore": 75
}
역량은 ${jobRole}에서 실제로 중요한 3-5개를 선정해주세요.`,
      },
    ];
    return callAPI(messages);
  }

  // 3. 자기소개서 피드백
  async function analyzeCoverLetter({ jobRole, company, coverLetter, expSummary }) {
    const messages = [
      {
        role: "system",
        content: `당신은 취업 전문 HR 코치입니다. 자기소개서를 직무 관점에서 객관적으로 분석하고 구체적인 개선안을 제시해주세요. 반드시 JSON 형식으로 응답하세요.`,
      },
      {
        role: "user",
        content: `지원 직무: ${jobRole}
지원 기업: ${company || "미입력"}
경험 요약: ${expSummary.summary}

자기소개서:
${coverLetter}

다음 JSON 형식으로 분석해주세요:
{
  "scores": {
    "logic": 75,
    "specificity": 80,
    "jobFit": 70,
    "overall": 75
  },
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "suggestions": [
    {
      "original": "개선이 필요한 기존 문장 또는 부분",
      "improved": "개선된 문장 또는 내용",
      "reason": "개선 이유"
    }
  ],
  "summary": "전반적인 평가 (2-3문장)"
}
각 점수는 0-100 사이로 평가해주세요.`,
      },
    ];
    return callAPI(messages);
  }

  // 4. 면접 답변 분석
  async function analyzeInterview({ jobRole, company, interviewAnswer, expSummary }) {
    const messages = [
      {
        role: "system",
        content: `당신은 취업 전문 면접 코치입니다. 면접 답변을 논리성, 구체성, 직무 적합성 관점에서 분석하고 개선 방향을 제시해주세요. 반드시 JSON 형식으로 응답하세요.`,
      },
      {
        role: "user",
        content: `지원 직무: ${jobRole}
지원 기업: ${company || "미입력"}
경험 요약: ${expSummary.summary}

면접 답변:
${interviewAnswer}

다음 JSON 형식으로 분석해주세요:
{
  "scores": {
    "logic": 75,
    "specificity": 70,
    "jobFit": 80,
    "communication": 75,
    "overall": 75
  },
  "feedback": "전반적인 피드백 (2-3문장)",
  "goodPoints": ["잘한 점1", "잘한 점2"],
  "improvements": ["개선점1", "개선점2", "개선점3"],
  "improvedAnswer": "개선된 답변 예시 (전체 답변을 개선하여 작성)",
  "followUpQuestions": ["꼬리 질문1", "꼬리 질문2"]
}
각 점수는 0-100 사이로 평가해주세요.`,
      },
    ];
    return callAPI(messages);
  }

  // 5. 예상 면접 질문 생성
  async function generateQuestions({ jobRole, company, expSummary, competencies }) {
    const messages = [
      {
        role: "system",
        content: `당신은 채용 전문가입니다. 지원자의 경험과 역량을 바탕으로 실제 면접에서 나올 법한 질문을 생성해주세요. 반드시 JSON 형식으로 응답하세요.`,
      },
      {
        role: "user",
        content: `지원 직무: ${jobRole}
지원 기업: ${company || "일반 기업"}
경험 요약: ${expSummary.summary}
핵심 역량: ${competencies.competencies.map(c => c.name).join(", ")}

다음 JSON 형식으로 예상 면접 질문을 생성해주세요:
{
  "basicQuestions": [
    {
      "question": "질문 내용",
      "intent": "질문 의도 (면접관이 무엇을 보려는지)",
      "tip": "답변 팁"
    }
  ],
  "followUpQuestions": [
    {
      "question": "꼬리 질문 내용",
      "trigger": "어떤 답변에서 나올 수 있는 질문인지"
    }
  ],
  "competencyQuestions": [
    {
      "competency": "역량 이름",
      "question": "해당 역량 확인 질문"
    }
  ]
}
기본 질문 5개, 꼬리 질문 4개, 역량 질문 3개를 생성해주세요.`,
      },
    ];
    return callAPI(messages);
  }

  // 6. 성장 미션 생성 (로컬 로직)
  function generateMissions({ coverFeedback, interviewFeedback, competencies }) {
    const missions = [];

    if (coverFeedback && coverFeedback.scores.overall < 80) {
      const weak = coverFeedback.weaknesses[0] || "자기소개서 완성도";
      missions.push({
        icon: "✍️",
        title: "자기소개서 개선",
        description: `${weak} 부분을 집중적으로 보완하세요. AI 피드백의 개선 제안을 참고하여 수정해보세요.`,
      });
    }

    if (interviewFeedback) {
      const lowestScore = Object.entries(interviewFeedback.scores)
        .filter(([k]) => k !== "overall")
        .sort((a, b) => a[1] - b[1])[0];
      if (lowestScore) {
        const scoreNames = { logic: "논리성", specificity: "구체성", jobFit: "직무 적합성", communication: "전달력" };
        missions.push({
          icon: "🎤",
          title: `면접 답변 ${scoreNames[lowestScore[0]] || lowestScore[0]} 향상`,
          description: `${scoreNames[lowestScore[0]]} 점수가 낮습니다. 개선된 답변 예시를 참고하여 연습해보세요.`,
        });
      }
    }

    if (competencies && competencies.fitScore < 75) {
      missions.push({
        icon: "📚",
        title: "직무 역량 강화",
        description: `${competencies.competencies.filter(c => c.relevance !== "high").map(c => c.name).join(", ")} 역량을 보강할 경험을 쌓아보세요.`,
      });
    }

    missions.push({
      icon: "🔁",
      title: "모의 면접 반복 연습",
      description: "생성된 예상 질문으로 매일 1-2개씩 답변을 작성하고 개선해나가세요.",
    });

    if (missions.length < 3) {
      missions.push({
        icon: "🏢",
        title: "기업 리서치 심화",
        description: "지원 기업의 최신 뉴스, 사업 방향, 경쟁사 비교를 통해 면접에서 차별화된 답변을 준비하세요.",
      });
    }

    return missions.slice(0, 4);
  }

  return { analyzeAll, getApiKey };
})();
