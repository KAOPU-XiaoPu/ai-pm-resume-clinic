import { readFileSync } from 'node:fs'

const envText = readFileSync(
  new URL('../.env.local', import.meta.url),
  'utf8',
)
const apiKey =
  envText.match(/VITE_AIHUBMIX_API_KEY=(.+)/)?.[1]?.trim() ??
  envText.match(/VITE_OPENROUTER_API_KEY=(.+)/)?.[1]?.trim()

if (!apiKey) {
  throw new Error('Missing AIHubMix API key')
}

const sampleFile = readFileSync(
  new URL('../src/data/exampleResumes.ts', import.meta.url),
  'utf8',
)
const startToken = 'export const teacherSampleResume = `'
const startIndex = sampleFile.indexOf(startToken)
const endIndex = sampleFile.lastIndexOf('`')

if (startIndex === -1 || endIndex === -1) {
  throw new Error('Failed to load sample resume')
}

const markdown = sampleFile.slice(startIndex + startToken.length, endIndex)
const model = process.env.MODEL?.trim() || 'gemini-3.1-flash-lite-preview'
const url = 'https://aihubmix.com/v1/chat/completions'
const maxTokens = 6000

const reviewSchema = {
  name: 'ai_pm_resume_review',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      overallScore: { type: 'integer', minimum: 0, maximum: 100 },
      overallVerdict: { type: 'string' },
      overallSummary: { type: 'string' },
      sections: {
        type: 'object',
        properties: {
          personal_info: createSectionSchema(),
          personal_strengths: createSectionSchema(),
          work_experience: createSectionSchema(),
          project_experience: createSectionSchema(),
        },
        required: [
          'personal_info',
          'personal_strengths',
          'work_experience',
          'project_experience',
        ],
        additionalProperties: false,
      },
    },
    required: ['overallScore', 'overallVerdict', 'overallSummary', 'sections'],
    additionalProperties: false,
  },
}

const optimizeSchema = {
  name: 'ai_pm_resume_optimize',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      optimizedMarkdown: { type: 'string' },
    },
    required: ['optimizedMarkdown'],
    additionalProperties: false,
  },
}

function createSectionSchema() {
  return {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pass', 'issue', 'missing'] },
      summary: { type: 'string' },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            reason: { type: 'string' },
            fix: { type: 'string' },
            severity: { type: 'string', enum: ['high', 'medium', 'low'] },
            evidenceSnippets: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 2,
            },
          },
          required: ['title', 'reason', 'fix', 'severity', 'evidenceSnippets'],
          additionalProperties: false,
        },
      },
    },
    required: ['status', 'summary', 'issues'],
    additionalProperties: false,
  }
}

function extractMessageText(content) {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        return String(item?.text ?? '')
      })
      .join('')
  }

  return ''
}

function parseChoiceJson(data) {
  const raw = extractMessageText(data?.choices?.[0]?.message?.content).trim()
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim() ?? raw
  const start = fenced.indexOf('{')
  const end = fenced.lastIndexOf('}')

  if (start === -1 || end === -1) {
    throw new Error(`Non-JSON response: ${raw.slice(0, 300)}`)
  }

  return JSON.parse(fenced.slice(start, end + 1))
}

async function callProvider(payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'ai-pm-resume-clinic-smoke',
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  let data = null

  try {
    data = JSON.parse(text)
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${data?.error?.message || data?.message || text}`,
    )
  }

  return data
}

function isProviderReturnedError(error) {
  const message = error instanceof Error ? error.message : String(error)
  return /provider returned error/i.test(message)
}

async function callWithOptionalLooseJson({
  payload,
  loosePayload,
}) {
  try {
    return await callProvider(payload)
  } catch (error) {
    if (!isProviderReturnedError(error)) {
      throw error
    }

    return await callProvider(loosePayload)
  }
}

function getIssueCount(report) {
  return Object.values(report.sections).reduce(
    (sum, section) => sum + section.issues.length,
    0,
  )
}

function getTokenLimitPayload() {
  if (/^gpt-/i.test(model)) {
    return {
      max_completion_tokens: maxTokens,
    }
  }

  return {
    max_tokens: maxTokens,
  }
}

async function run() {
  const reviewSystemPrompt = `你是一位严格、专业、非常懂 AI 产品经理求职简历的老师。
你必须只关注以下4个模块：个人信息、个人优势、工作经历、项目经历。
只在确实存在问题时给 issue；如果模块没有明显问题，issues 必须为空数组。
必须严格返回 JSON。title 必须短，适合右侧卡片展示。evidenceSnippets 尽量引用原简历精确短片段。不得杜撰事实。`

  const reviewUserPrompt = `请批改这份 AI 产品经理简历 Markdown，并按要求返回结构化 JSON：

${markdown}`

  console.log(`STEP 1 review:start ${model}`)
  const review1 = parseChoiceJson(
    await callWithOptionalLooseJson({
      payload: {
        model,
        temperature: 0.2,
        stream: false,
        ...getTokenLimitPayload(),
        messages: [
          { role: 'system', content: reviewSystemPrompt },
          { role: 'user', content: reviewUserPrompt },
        ],
        response_format: { type: 'json_schema', json_schema: reviewSchema },
      },
      loosePayload: {
        model,
        temperature: 0.2,
        stream: false,
        ...getTokenLimitPayload(),
        messages: [
          {
            role: 'system',
            content: `${reviewSystemPrompt}\n如果结构化参数不兼容或被 provider 拒绝，也必须只返回 JSON 对象，不要输出代码块。`,
          },
          { role: 'user', content: reviewUserPrompt },
        ],
      },
    }),
  )

  console.log(
    'STEP 1 review:ok',
    JSON.stringify({
      score: review1.overallScore,
      verdict: review1.overallVerdict,
      issueCount: getIssueCount(review1),
    }),
  )

  const optimizeSystemPrompt = `你是一位资深 AI 产品经理简历优化顾问。
根据批改问题直接修改原始 Markdown 简历，不得杜撰经历、项目、数据或结果。
保留 Markdown 结构，只返回 JSON，字段为 optimizedMarkdown。`

  const optimizeUserPrompt = `请根据以下批改问题直接优化简历 Markdown。

【简历原文】
${markdown}

【批改结果】
${JSON.stringify(review1, null, 2)}`

  console.log(`STEP 2 optimize:start ${model}`)
  const optimize = parseChoiceJson(
    await callWithOptionalLooseJson({
      payload: {
        model,
        temperature: 0.25,
        stream: false,
        ...getTokenLimitPayload(),
        messages: [
          { role: 'system', content: optimizeSystemPrompt },
          { role: 'user', content: optimizeUserPrompt },
        ],
        response_format: { type: 'json_schema', json_schema: optimizeSchema },
      },
      loosePayload: {
        model,
        temperature: 0.25,
        stream: false,
        ...getTokenLimitPayload(),
        messages: [
          {
            role: 'system',
            content: `${optimizeSystemPrompt}\n如果结构化参数不兼容或被 provider 拒绝，也必须只返回一个 JSON 对象，且仅包含 optimizedMarkdown 字段。`,
          },
          { role: 'user', content: optimizeUserPrompt },
        ],
      },
    }),
  )

  const optimizedMarkdown = String(optimize.optimizedMarkdown || '').trim()

  if (!optimizedMarkdown) {
    throw new Error('Empty optimizedMarkdown')
  }

  console.log(
    'STEP 2 optimize:ok',
    JSON.stringify({
      optimizedLength: optimizedMarkdown.length,
      changed: optimizedMarkdown !== markdown.trim(),
    }),
  )

  console.log(`STEP 3 rereview:start ${model}`)
  const review2 = parseChoiceJson(
    await callWithOptionalLooseJson({
      payload: {
        model,
        temperature: 0.2,
        stream: false,
        ...getTokenLimitPayload(),
        messages: [
          { role: 'system', content: reviewSystemPrompt },
          {
            role: 'user',
            content: `请批改这份优化后的 AI 产品经理简历 Markdown，并按要求返回结构化 JSON：

${optimizedMarkdown}`,
          },
        ],
        response_format: { type: 'json_schema', json_schema: reviewSchema },
      },
      loosePayload: {
        model,
        temperature: 0.2,
        stream: false,
        ...getTokenLimitPayload(),
        messages: [
          {
            role: 'system',
            content: `${reviewSystemPrompt}\n如果结构化参数不兼容或被 provider 拒绝，也必须只返回 JSON 对象，不要输出代码块。`,
          },
          {
            role: 'user',
            content: `请批改这份优化后的 AI 产品经理简历 Markdown，并按要求返回结构化 JSON：

${optimizedMarkdown}`,
          },
        ],
      },
    }),
  )

  console.log(
    'STEP 3 rereview:ok',
    JSON.stringify({
      score: review2.overallScore,
      verdict: review2.overallVerdict,
      issueCount: getIssueCount(review2),
      delta: review2.overallScore - review1.overallScore,
    }),
  )
}

run().catch((error) => {
  console.error('SMOKE FAILED')
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
