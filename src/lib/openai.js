const MODEL = 'solar-pro3'
const BASE_URL = 'https://api.upstage.ai/v1/chat/completions'
export const AI_MODEL = MODEL

function extractJSONObject(text) {
  let start = -1, depth = 0, inString = false, escaped = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (escaped)               { escaped = false; continue }
    if (ch === '\\' && inString) { escaped = true;  continue }
    if (ch === '"')              { inString = !inString; continue }
    if (inString)                continue
    if (ch === '{')              { if (depth++ === 0) start = i }
    else if (ch === '}')         { if (--depth === 0 && start !== -1) return text.slice(start, i + 1) }
  }
  return null
}

// JSON 문자열 값 안에 있는 리터럴 개행문자를 \n 이스케이프로 교체
function fixUnescapedNewlines(text) {
  let result = '', inString = false, escaped = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (escaped)               { escaped = false; result += ch; continue }
    if (ch === '\\' && inString) { escaped = true;  result += ch; continue }
    if (ch === '"')              { inString = !inString; result += ch; continue }
    if (inString && ch === '\n') { result += '\\n'; continue }
    if (inString && ch === '\r') { result += '\\r'; continue }
    result += ch
  }
  return result
}

function safeParseJSON(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()

  // 1차: 그대로 파싱
  try { return JSON.parse(cleaned) } catch (e1) {
    console.error('[1차 실패]', e1.message)
  }

  // 2차: 문자열 내 개행문자 이스케이프 후 파싱
  try { return JSON.parse(fixUnescapedNewlines(cleaned)) } catch (e2) {
    console.error('[2차 실패]', e2.message)
  }

  // 3차: JSON 객체 직접 추출 후 파싱
  const extracted = extractJSONObject(text)
  if (extracted) {
    try { return JSON.parse(extracted) } catch {}
    try { return JSON.parse(fixUnescapedNewlines(extracted)) } catch (e3) {
      console.error('[3차 실패]', e3.message)
    }
  }

  throw new Error('AI 응답 파싱 실패')
}

async function callAPI(apiKey, messages, jsonMode = true) {
  if (!apiKey) throw new Error('Solar AI(Upstage) API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.')

  const body = { model: MODEL, messages, temperature: 0.3, max_tokens: 4096 }

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (res.status === 401) throw new Error('API 키가 올바르지 않습니다. 설정에서 키를 확인해주세요.')
    if (res.status === 429) throw new Error('API 사용량 초과. 잠시 후 다시 시도해주세요.')
    throw new Error(err?.error?.message || `API 오류 (${res.status})`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('AI 응답이 비어있습니다.')

  if (jsonMode) {
    try { return safeParseJSON(content) }
    catch (e) {
      console.error('[Solar AI] 파싱 실패')
      console.error('응답 길이:', content?.length)
      console.error('마지막 200자:', content?.slice(-200))
      console.error('Parse 에러:', e.message)
      throw new Error('AI 응답 파싱 실패')
    }
  }
  return content
}

async function analyzeExperience(apiKey, { jobRole, company, experience }) {
  return callAPI(apiKey, [
    { role: 'system', content: '당신은 취업 전문 코치입니다. 경험을 STAR 방법론으로 분석하고 반드시 JSON 형식으로 응답하세요.' },
    { role: 'user', content: `지원 직무: ${jobRole}\n지원 기업: ${company || '미입력'}\n경험:\n${experience}\n\n다음 JSON으로 응답:\n{"summary":"요약(2-3문장)","situation":"상황","task":"역할","action":"행동(2-3문장)","result":"결과","learning":"배운점","keywords":["키워드1","키워드2","키워드3"]}` },
  ])
}

async function transformCompetencies(apiKey, { jobRole, expSummary }) {
  return callAPI(apiKey, [
    { role: 'system', content: '당신은 취업 전문 코치입니다. 경험을 직무 역량으로 변환하고 반드시 JSON 형식으로 응답하세요.' },
    { role: 'user', content: `지원 직무: ${jobRole}\n경험 요약: ${expSummary.summary}\n행동: ${expSummary.action}\n결과: ${expSummary.result}\n\n다음 JSON으로 응답:\n{"competencies":[{"name":"역량명","description":"설명","evidence":"근거","relevance":"high|medium|low"}],"overallFit":"적합성 설명","fitScore":75}\n역량 3-5개 선정.` },
  ])
}

async function analyzeCoverLetter(apiKey, { jobRole, company, coverLetter, expSummary }) {
  return callAPI(apiKey, [
    { role: 'system', content: '당신은 HR 전문 코치입니다. 자기소개서를 분석하고 반드시 JSON 형식으로 응답하세요.' },
    { role: 'user', content: `지원 직무: ${jobRole}\n기업: ${company || '미입력'}\n경험 요약: ${expSummary.summary}\n\n자기소개서:\n${coverLetter}\n\n다음 JSON으로 응답:\n{"scores":{"logic":75,"specificity":80,"jobFit":70,"overall":75},"strengths":["강점1","강점2"],"weaknesses":["약점1"],"suggestions":[{"original":"기존문장","improved":"개선문장","reason":"이유"}],"summary":"전반 평가"}` },
  ])
}

export async function analyzeInterview(apiKey, { jobRole, company, interviewAnswer, interviewQuestion, expSummary }) {
  return callAPI(apiKey, [
    { role: 'system', content: '당신은 면접 전문 코치입니다. 면접 답변을 분석하고 반드시 JSON 형식으로 응답하세요.' },
    { role: 'user', content: `지원 직무: ${jobRole}\n기업: ${company || '미입력'}\n경험 요약: ${expSummary.summary}${interviewQuestion ? `\n\n면접 질문:\n${interviewQuestion}` : ''}\n\n면접 답변:\n${interviewAnswer}\n\n다음 JSON으로 응답:\n{"scores":{"logic":75,"specificity":70,"jobFit":80,"communication":75,"overall":75},"feedback":"전반 피드백","goodPoints":["잘한점"],"improvements":["개선점"],"improvedAnswer":"개선된 답변 예시","followUpQuestions":["꼬리질문1","꼬리질문2"]}` },
  ])
}

async function generateQuestions(apiKey, { jobRole, company, expSummary, competencies }) {
  return callAPI(apiKey, [
    { role: 'system', content: '당신은 채용 전문가입니다. 예상 면접 질문을 생성하고 반드시 JSON 형식으로 응답하세요.' },
    { role: 'user', content: `지원 직무: ${jobRole}\n기업: ${company || '일반 기업'}\n경험 요약: ${expSummary.summary}\n핵심 역량: ${competencies.competencies.map(c => c.name).join(', ')}\n\n다음 JSON으로 응답:\n{"basicQuestions":[{"question":"질문","intent":"의도","tip":"팁"}],"followUpQuestions":[{"question":"꼬리질문","trigger":"트리거"}],"competencyQuestions":[{"competency":"역량","question":"질문"}]}\n기본5개, 꼬리4개, 역량3개.` },
  ])
}

function generateMissions({ coverFeedback, interviewFeedback, competencies }) {
  const missions = []

  if (coverFeedback && coverFeedback.scores.overall < 80) {
    const weak = coverFeedback.weaknesses[0] || '자기소개서 완성도'
    missions.push({ icon: '✍️', title: '자기소개서 개선', description: `${weak} 부분을 집중 보완하세요. AI 피드백의 개선 제안을 참고하여 수정해보세요.` })
  }

  if (interviewFeedback) {
    const lowestScore = Object.entries(interviewFeedback.scores)
      .filter(([k]) => k !== 'overall')
      .sort((a, b) => a[1] - b[1])[0]
    if (lowestScore) {
      const scoreNames = { logic: '논리성', specificity: '구체성', jobFit: '직무 적합성', communication: '전달력' }
      missions.push({ icon: '🎤', title: `면접 답변 ${scoreNames[lowestScore[0]] || lowestScore[0]} 향상`, description: `${scoreNames[lowestScore[0]]} 점수가 낮습니다. 개선된 답변 예시를 참고하여 연습해보세요.` })
    }
  }

  if (competencies && competencies.fitScore < 75) {
    missions.push({ icon: '📚', title: '직무 역량 강화', description: `${competencies.competencies.filter(c => c.relevance !== 'high').map(c => c.name).join(', ')} 역량을 보강할 경험을 쌓아보세요.` })
  }

  missions.push({ icon: '🔁', title: '모의 면접 반복 연습', description: '생성된 예상 질문으로 매일 1-2개씩 답변을 작성하고 개선해나가세요.' })

  if (missions.length < 3) {
    missions.push({ icon: '🏢', title: '기업 리서치 심화', description: '지원 기업의 최신 뉴스, 사업 방향, 경쟁사 비교를 통해 차별화된 답변을 준비하세요.' })
  }

  return missions.slice(0, 4)
}

export async function analyzeAll(apiKey, { jobRole, company, experience, coverLetter, interviewAnswer, interviewQuestion }, onStep) {
  onStep?.(1)
  const expAnalysis = await analyzeExperience(apiKey, { jobRole, company, experience })

  onStep?.(2)
  const competencies = await transformCompetencies(apiKey, { jobRole, expSummary: expAnalysis })

  onStep?.(3)
  const [coverFeedback, interviewFeedback] = await Promise.all([
    coverLetter ? analyzeCoverLetter(apiKey, { jobRole, company, coverLetter, expSummary: expAnalysis }) : Promise.resolve(null),
    interviewAnswer ? analyzeInterview(apiKey, { jobRole, company, interviewAnswer, interviewQuestion, expSummary: expAnalysis }) : Promise.resolve(null),
  ])

  onStep?.(4)
  const questions = await generateQuestions(apiKey, { jobRole, company, expSummary: expAnalysis, competencies })
  const missions = generateMissions({ coverFeedback, interviewFeedback, competencies })

  return { jobRole, company, experience, coverLetter, interviewAnswer, expAnalysis, competencies, coverFeedback, interviewFeedback, questions, missions }
}
