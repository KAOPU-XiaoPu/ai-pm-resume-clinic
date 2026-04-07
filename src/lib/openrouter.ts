import {
  providerFallbackModelIds,
  sectionLabels,
  sectionOrder,
} from '../data/reviewConfig'
import {
  buildOptimizeUserPrompt,
  optimizeSystemPrompt,
} from '../prompts/optimizePrompt'
import { buildReviewUserPrompt, reviewSystemPrompt } from '../prompts/reviewPrompt'
import type {
  ReviewDraft,
  ReviewIssue,
  ReviewIssueSeverity,
  ReviewReport,
  ReviewSectionDraft,
  ReviewSectionKey,
  ReviewSectionResult,
  ReviewSectionStatus,
} from '../types'
import { createSourceDigest, extractSectionHints } from './markdown'
import { optimizeResponseSchema } from './optimizeSchema'
import { reviewResponseSchema } from './reviewSchema'

type DraftIssue = NonNullable<ReviewSectionDraft['issues']>[number]

interface ProviderErrorPayload {
  error?: {
    message?: string
  }
  message?: string
}

interface ProviderResponse extends ProviderErrorPayload {
  choices?: Array<{
    message?: {
      content?: unknown
    }
  }>
}

interface OptimizeDraft {
  optimizedMarkdown?: string
}

interface OptimizeResult {
  markdown: string
  model: string
}

interface SyntheticIssueSeed {
  section: ReviewSectionKey
  title: string
  reason: string
  fix: string
  severity?: ReviewIssueSeverity
  evidenceSnippets?: string[]
}

const AIHUBMIX_URL = 'https://aihubmix.com/v1/chat/completions'
const DEFAULT_MAX_TOKENS = 6000
const API_KEY_STORAGE_KEY = 'aihubmix_api_key'

export function getStoredApiKey() {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY)?.trim() || ''
  } catch {
    return ''
  }
}

export function setStoredApiKey(key: string) {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim())
  } catch {
    // ignore storage errors
  }
}

export function hasStoredApiKey() {
  return Boolean(getStoredApiKey())
}

const GENERIC_PASS_SUMMARIES = new Set([
  '没有明显问题。',
  '无待调整项。',
  '没问题。',
  '存在待调整点。',
  '该模块缺失或非常薄弱。',
])
const sectionKeywordMap: Record<ReviewSectionKey, string[]> = {
  personal_info: ['个人信息', '基本信息', '邮箱', '手机号', '学历'],
  personal_strengths: ['个人优势', '优势', '亮点', '自我评价'],
  work_experience: ['工作经历', '最近一段', '任职', '公司', '经历'],
  project_experience: ['项目经历', '项目', 'STAR', '主项目'],
}
const negativeSignalPattern = /(仍|但|未|不足|缺|问题|优化|改进|提升空间|不够|偏薄|展开不足|需补|待调整)/i

function getApiKey() {
  return (
    getStoredApiKey() ||
    import.meta.env.VITE_AIHUBMIX_API_KEY?.trim() ||
    ''
  )
}

function isSeverity(value: string | undefined): value is ReviewIssueSeverity {
  return value === 'high' || value === 'medium' || value === 'low'
}

function isSectionStatus(value: string | undefined): value is ReviewSectionStatus {
  return value === 'pass' || value === 'issue' || value === 'missing'
}

function extractMessageText(content: unknown) {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (item && typeof item === 'object' && 'text' in item) {
          return String(item.text ?? '')
        }

        return ''
      })
      .join('')
  }

  return ''
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim()

  if (!trimmed) {
    throw new Error('模型返回了空结果。')
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fencedMatch?.[1]?.trim() ?? trimmed
  const startIndex = candidate.indexOf('{')
  const endIndex = candidate.lastIndexOf('}')

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('模型返回结果不是可解析的 JSON。')
  }

  return candidate.slice(startIndex, endIndex + 1)
}

function parseJsonFromResponse<T>(data: ProviderResponse) {
  const rawContent = extractMessageText(data?.choices?.[0]?.message?.content)
  const jsonText = extractJsonObject(rawContent)
  return JSON.parse(jsonText) as T
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeEvidenceSnippets(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().replace(/^#+\s*/, '').replace(/\*{1,2}/g, ''))
    .filter(Boolean)
    .slice(0, 2)
}

function normalizeIssue(
  section: ReviewSectionKey,
  issue: DraftIssue,
  index: number,
): ReviewIssue | null {
  const title = issue?.title?.trim()
  const reason = issue?.reason?.trim()
  const fix = issue?.fix?.trim()
  const severity = isSeverity(issue?.severity) ? issue.severity : 'medium'

  if (!title || !reason || !fix) {
    return null
  }

  return {
    id: `${section}-${index + 1}`,
    title,
    reason,
    fix,
    severity,
    evidenceSnippets: sanitizeEvidenceSnippets(issue?.evidenceSnippets),
  }
}

function normalizeSection(section: ReviewSectionKey, draft?: ReviewSectionDraft): ReviewSectionResult {
  const issues =
    draft?.issues
      ?.map((issue, index) => normalizeIssue(section, issue, index))
      .filter((issue): issue is ReviewIssue => Boolean(issue)) ?? []

  const status =
    issues.length > 0
      ? 'issue'
      : isSectionStatus(draft?.status)
        ? draft.status
        : 'pass'

  return {
    key: section,
    label: sectionLabels[section],
    status,
    summary:
      draft?.summary?.trim() ||
      (status === 'pass' ? '没有明显问题。' : status === 'missing' ? '该模块缺失或非常薄弱。' : '存在待调整点。'),
    issues,
  }
}

function normalizeReport(draft: ReviewDraft, model: string, sourceDigest: string): ReviewReport {
  const overallScore = Number.isFinite(draft.overallScore)
    ? Math.max(0, Math.min(100, Math.round(Number(draft.overallScore))))
    : 0

  const sections = sectionOrder.reduce(
    (accumulator, section) => {
      accumulator[section] = normalizeSection(section, draft.sections?.[section])
      return accumulator
    },
    {} as Record<ReviewSectionKey, ReviewSectionResult>,
  )

  return {
    overallScore,
    overallVerdict: draft.overallVerdict?.trim() || '待补结论',
    overallSummary: draft.overallSummary?.trim() || '模型未返回足够的整体说明。',
    sections,
    model,
    reviewedAt: new Date().toISOString(),
    sourceDigest,
  }
}

function collectNonEmptyLines(content: string) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function countMatches(content: string, pattern: RegExp) {
  return content.match(pattern)?.length ?? 0
}

function countPointLikeLines(lines: string[]) {
  const numberedLines = lines.filter((line) => /^(\d+[.、)]|[一二三四五六七八九十]+[、.])/.test(line)).length
  const bulletedLines = lines.filter((line) => /^[-*•]/.test(line)).length
  const bracketTitleLines = lines.filter((line) => /【[^】]+】/.test(line)).length
  return numberedLines + bulletedLines + bracketTitleLines
}

function countProjectEntries(lines: string[]) {
  return lines.filter(
    (line) =>
      /\d{4}[./-]\d{1,2}/.test(line) ||
      /至今/.test(line) ||
      (line.includes('|') && line.length <= 80),
  ).length
}

function isTimedEntryHeading(line: string) {
  return (
    (line.includes('|') || line.includes('｜')) &&
    /\d{4}[./-]\d{1,2}/.test(line)
  )
}

function extractEntryShortLabel(header: string) {
  const segments = header
    .split(/[|｜]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !/\d{4}[./-]\d{1,2}/.test(segment) && !/至今/.test(segment))

  return segments[1] ?? segments[0] ?? header.trim()
}

function splitTimedEntries(content: string) {
  const lines = collectNonEmptyLines(content)
  const entries: Array<{ header: string; lines: string[] }> = []
  let current: { header: string; lines: string[] } | null = null

  lines.forEach((line) => {
    if (isTimedEntryHeading(line)) {
      if (current) {
        entries.push(current)
      }

      current = {
        header: line.replace(/^#+\s*/, ''),
        lines: [],
      }
      return
    }

    if (!current) {
      current = {
        header: '未识别标题',
        lines: [],
      }
    }

    current.lines.push(line)
  })

  if (current) {
    entries.push(current)
  }

  return entries
    .filter((entry) => entry.lines.length > 0)
    .map((entry) => ({
      header: entry.header,
      shortLabel: extractEntryShortLabel(entry.header),
      lines: entry.lines,
      content: entry.lines.join('\n'),
      bodyCharCount: entry.lines.join('').length,
    }))
}

function stripInlineMarkdown(line: string) {
  return line.replace(/\*{1,2}/g, '').replace(/^[-*•]\s*/, '').replace(/^\d+[.、)]\s*/, '')
}

function extractLabeledBlockText(content: string, labelPattern: RegExp, stopPatterns: RegExp[]) {
  const lines = collectNonEmptyLines(content)
  const startIndex = lines.findIndex((line) => labelPattern.test(stripInlineMarkdown(line)))

  if (startIndex === -1) {
    return ''
  }

  const fragments: string[] = []
  const inlineContent = stripInlineMarkdown(lines[startIndex]).replace(labelPattern, '').trim()

  if (inlineContent) {
    fragments.push(inlineContent)
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]

    if (stopPatterns.some((pattern) => pattern.test(stripInlineMarkdown(line)))) {
      break
    }

    fragments.push(line)
  }

  return fragments.join('\n').trim()
}

function countResultPointUnits(content: string) {
  const lines = collectNonEmptyLines(content)
  const bulletCount = lines.filter((line) =>
    /^([-*•]|\d+[.、)]|[一二三四五六七八九十]+[、.])/.test(line),
  ).length

  const inlineCount = content
    .split(/[；;]/)
    .map((item) => item.trim())
    .filter(Boolean).length

  return Math.max(bulletCount, inlineCount)
}

function getLeadingSnippet(content: string, maxLength = 28) {
  const normalized = collectNonEmptyLines(content).join(' ').trim()

  if (!normalized) {
    return ''
  }

  const sentence = normalized.split(/[；;。！？]/)[0]?.trim() ?? normalized
  return sentence.slice(0, maxLength)
}

function getFirstMatchingLine(content: string, pattern: RegExp) {
  // Strip markdown formatting before regex test so anchored patterns (^) work on clean text
  const line = collectNonEmptyLines(content)
    .find((l) => pattern.test(l.replace(/\*{1,2}/g, '').replace(/^[-*•]\s*/, '').replace(/^\d+[.、)]\s*/, '')))
    ?.trim() ?? ''
  if (!line) return ''
  // Strip markdown formatting and bold label prefixes so snippet can match a single DOM text node
  return line
    .replace(/\*{1,2}/g, '')
    .replace(/^#+\s*/, '')
    .replace(
      /^(项目背景|背景|项目目标|目标|北极星|职责描述|核心职责|具体动作|项目结果|结果|成果|项目成果)[:：]\s*/,
      '',
    )
    .trim()
}

function buildSyntheticIssue(
  report: ReviewReport,
  seed: SyntheticIssueSeed,
): ReviewIssue {
  const section = report.sections[seed.section]
  const nextIndex = section.issues.length + 1

  return {
    id: `${seed.section}-${nextIndex}`,
    title: seed.title,
    reason: seed.reason,
    fix: seed.fix,
    severity: seed.severity ?? 'medium',
    evidenceSnippets: seed.evidenceSnippets ?? [],
  }
}

function attachSyntheticIssue(report: ReviewReport, seed: SyntheticIssueSeed) {
  const section = report.sections[seed.section]
  const issue = buildSyntheticIssue(report, seed)

  section.issues.push(issue)
  section.status = 'issue'

  if (GENERIC_PASS_SUMMARIES.has(section.summary.trim())) {
    section.summary = issue.reason
  }
}

function getMentionedSections(text: string) {
  const content = text.trim()
  if (!content) {
    return []
  }

  return sectionOrder.filter((section) =>
    sectionKeywordMap[section].some((keyword) => content.includes(keyword)),
  )
}

function inferSectionFromReportText(report: ReviewReport) {
  const overallText = `${report.overallVerdict} ${report.overallSummary}`
  const overallMentions = negativeSignalPattern.test(overallText)
    ? getMentionedSections(overallText)
    : []
  if (overallMentions.length > 0) {
    return overallMentions
  }

  const sectionMentions = sectionOrder.filter((section) => {
    const result = report.sections[section]
    return (
      !GENERIC_PASS_SUMMARIES.has(result.summary.trim()) &&
      negativeSignalPattern.test(result.summary) &&
      getMentionedSections(result.summary).includes(section)
    )
  })

  return sectionMentions
}

function inferHeuristicIssues(sectionHints: ReturnType<typeof extractSectionHints>) {
  const issues: SyntheticIssueSeed[] = []
  const conceptExplanationPattern = /[\u4e00-\u9fa5A-Za-z0-9]+（[A-Za-z][A-Za-z0-9+.\- ]{1,24}）/g
  const englishQuotePattern = /"[^"\n]{2,24}"/g
  const modelMasteryPattern =
    /(擅长|熟练掌握|精通)(?:使用|运用)?\s*(GPT-?[0-9A-Za-z.-]*|Claude|Gemini|LLaMA|DeepSeek|Qwen|通义|文心|豆包|Kimi|ChatGPT|GLM)/gi

  sectionHints.forEach((hint) => {
    const lines = collectNonEmptyLines(hint.content)
    const pointLikeLines = countPointLikeLines(lines)
    const conceptExplanationMatches = Array.from(hint.content.matchAll(conceptExplanationPattern)).map(
      (match) => match[0],
    )
    const englishQuoteMatches = Array.from(hint.content.matchAll(englishQuotePattern)).map(
      (match) => match[0],
    )
    const modelMasteryMatches = Array.from(hint.content.matchAll(modelMasteryPattern)).map(
      (match) => match[0],
    )

    if (conceptExplanationMatches[0]) {
      issues.push({
        section: hint.key,
        title: '概念括号解释不专业',
        reason: '当前简历出现了概念解释类括号写法，更像科普说明，不像求职表达。',
        fix: '请删除这类概念解释式括号，直接保留业务和产品表达即可。',
        evidenceSnippets: [conceptExplanationMatches[0]],
      })
    }

    if (englishQuoteMatches[0]) {
      issues.push({
        section: hint.key,
        title: '关键词引号写法不专业',
        reason: '当前简历使用了英文双引号包裹关键词，这种写法在中文简历里不够专业。',
        fix: '请去掉英文双引号，直接用自然中文表达关键词，不要做引号强调。',
        evidenceSnippets: [englishQuoteMatches[0]],
      })
    }

    if (modelMasteryMatches[0]) {
      issues.push({
        section: hint.key,
        title: '模型熟练掌握表述不当',
        reason: '当前简历把“擅长/熟练掌握/精通某个模型”当成优势表达，这不符合 AI 产品经理简历的重点。',
        fix: '请改成你如何基于该模型完成需求拆解、工作流设计、产品化落地和业务结果，而不是写成熟练掌握某模型。',
        evidenceSnippets: [modelMasteryMatches[0]],
      })
    }

    if (hint.key === 'personal_strengths' && pointLikeLines >= 2 && pointLikeLines < 8) {
      issues.push({
        section: 'personal_strengths',
        title: '个人优势仍需补足',
        reason: '当前个人优势仍未达到在线简历分点写法建议的 8 个能力点，支撑力度还不够。',
        fix: '请继续基于现有事实补足能力点，尽量写到 8 点左右，每点突出职责、能力和优势表达。',
        evidenceSnippets: ['个人优势'],
      })
    }

    if (hint.key === 'work_experience' && hint.content.length < 800) {
      const firstWorkEntry = splitTimedEntries(hint.content)[0]
      const workAnchor = firstWorkEntry
        ? firstWorkEntry.header.split(/[|｜]/)[0]?.trim() || firstWorkEntry.shortLabel
        : '工作经历'
      issues.push({
        section: 'work_experience',
        title: '工作经历仍需展开',
        reason: '当前工作经历模块整体展开度仍不足，未达到在线简历充分支撑招聘判断的厚度。',
        fix: '请继续补足业务背景、团队情况、职责模块、协同方式和量化成果，使工作经历更完整。',
        evidenceSnippets: [workAnchor],
      })
    }

    if (hint.key === 'work_experience') {
      splitTimedEntries(hint.content).forEach((entry) => {
        const responsibilityPointCount = entry.lines.filter((line) =>
          /^([-*•]|\d+[.、)]|[一二三四五六七八九十]+[、.]|【[^】]+】)/.test(line),
        ).length
        const resultSignalCount = countMatches(
          entry.content,
          /(提升|下降|降低|增长|缩短|节省|覆盖|落地|上线|转化|准确率|效率|成本|预算|时长|耗时|金额|营收|ROI|CTR|CVR|GMV|复用|渗透|节约|减少|产出|价值|%|万)/g,
        )
        const hasBackgroundOrTeamSignal = /(背景|团队|协同|业务压力|团队情况|定位)/.test(entry.content)
        const entryFlags: string[] = []

        if (entry.bodyCharCount < 260) {
          entryFlags.push('字数明显偏少')
        }

        if (responsibilityPointCount < 3) {
          entryFlags.push('职责模块偏少')
        }

        if (!hasBackgroundOrTeamSignal) {
          entryFlags.push('缺少背景或团队信息')
        }

        if (resultSignalCount < 1) {
          entryFlags.push('缺少量化结果表达')
        }

        if (entryFlags.length > 0) {
          const companyName = entry.header.split(/[|｜]/)[0]?.trim() || entry.shortLabel
          issues.push({
            section: 'work_experience',
            title: `${entry.shortLabel}经历展开不足`,
            reason: `${entry.shortLabel} 这段工作经历仍存在以下问题：${entryFlags.join('、')}。`,
            fix: `请把 ${entry.shortLabel} 这段经历按”背景/团队 -> 职责模块 -> 量化结果”补足，至少让招聘方看清你在这段经历中的定位、职责和贡献。`,
            evidenceSnippets: [companyName],
          })
        }
      })
    }

    if (hint.key === 'project_experience') {
      const projectCount = countProjectEntries(lines)
      const resultBulletCount = lines.filter(
        (line) =>
          /^([-*•]|\d+[.、)]|[一二三四五六七八九十]+[、.])/.test(line) &&
          /(提升|下降|降低|增长|缩短|节省|覆盖|落地|上线|转化|准确率|效率|成本|预算|时长|耗时|金额|营收|ROI|CTR|CVR|GMV|复用|渗透|节约|减少|产出|价值|%|万)/.test(
            line,
          ),
      ).length

      if (projectCount > 0 && projectCount < 2) {
        issues.push({
          section: 'project_experience',
          title: '项目数量仍然不足',
          reason: '当前项目经历少于 2 个项目，还不满足基础展示要求。',
          fix: '请至少补足 2 个项目，并保持 STAR 结构，优先展示最能体现 AI 产品经理能力的项目。',
        })
      } else if (resultBulletCount > 0 && resultBulletCount < 3) {
        issues.push({
          section: 'project_experience',
          title: '项目结果仍需量化',
          reason: '当前项目结果尚未稳定形成 3 个量化分点，还不足以支撑满分判断。',
          fix: '请继续把项目结果整理成至少 3 个量化分点，分别体现效果、规模和业务价值。',
        })
      }

      splitTimedEntries(hint.content).forEach((entry) => {
        const backgroundLineCount = countMatches(
          extractLabeledBlockText(
            entry.content,
            /^(项目背景|背景)[:：]?/,
            [/^(项目目标|目标|北极星|职责描述|核心职责|具体动作|项目结果|结果|成果)[:：]?/, /^【[^】]+】/],
          ),
          /\n/g,
        ) + (/(项目背景|背景)[:：]?/.test(entry.content) ? 1 : 0)
        const goalText = extractLabeledBlockText(
          entry.content,
          /^(项目目标|目标|北极星)[:：]?/,
          [/^(职责描述|核心职责|具体动作|项目结果|结果|成果)[:：]?/, /^【[^】]+】/],
        )
        const resultText = extractLabeledBlockText(
          entry.content,
          /^(项目结果|结果|成果)[:：]?/,
          [/^(项目背景|背景|项目目标|目标|北极星|职责描述|核心职责|具体动作)[:：]?/, /^【[^】]+】/],
        )
        const actionPointCount = entry.lines.filter((line) =>
          /^([-*•]|\d+[.、)]|[一二三四五六七八九十]+[、.]|【[^】]+】)/.test(line),
        ).length
        const resultPointCount = countResultPointUnits(resultText)
        const entryFlags: string[] = []

        if (entry.bodyCharCount < 420) {
          entryFlags.push('字数明显偏少')
        }

        if (backgroundLineCount > 0 && (backgroundLineCount < 2 || backgroundLineCount > 4)) {
          entryFlags.push('背景不在推荐区间')
        }

        if (!goalText && !/(为解决|解决|痛点|目标|北极星)/.test(entry.content)) {
          entryFlags.push('缺少明确目标或痛点')
        }

        if (actionPointCount < 3) {
          entryFlags.push('职责动作展开不足')
        }

        if (resultPointCount < 3) {
          entryFlags.push('结果未形成 3 个量化点')
        }

        if (entryFlags.length > 0) {
          issues.push({
            section: 'project_experience',
            title: `${entry.shortLabel}项目不够完整`,
            reason: `${entry.shortLabel} 这个项目仍存在以下问题：${entryFlags.join('、')}。`,
            fix: `请把 ${entry.shortLabel} 按 STAR 补足，明确项目背景、目标、你的动作，以及至少 3 个量化结果点。`,
            evidenceSnippets: [entry.shortLabel],
          })
        }
      })
    }
  })

  return issues
}

function findSimilarIssue(section: ReviewSectionResult, seed: SyntheticIssueSeed) {
  return section.issues.find((issue) => {
    const matchedEvidence =
      seed.evidenceSnippets?.[0] &&
      issue.evidenceSnippets.some((snippet) => snippet.includes(seed.evidenceSnippets![0]))

    return (
      issue.title.includes(seed.title) ||
      seed.title.includes(issue.title) ||
      issue.reason.includes(seed.title.replace(/仍需|不够完整|展开不足/g, '')) ||
      Boolean(matchedEvidence)
    )
  })
}

function mergeIssuePrecision(issue: ReviewIssue, seed: SyntheticIssueSeed) {
  if (seed.evidenceSnippets?.length) {
    const currentSnippets = issue.evidenceSnippets.filter(Boolean)
    const nextSnippets = [...new Set([...seed.evidenceSnippets, ...currentSnippets])].slice(0, 2)
    issue.evidenceSnippets = nextSnippets
  }

  if (
    (/(工作经历内容展开不足|项目经历仍需优化|工作经历仍需展开|项目经历仍需量化|项目结果仍需量化)/.test(issue.title) ||
      issue.title.length < seed.title.length) &&
    seed.title.length <= 18
  ) {
    issue.title = seed.title
  }
}

function findSectionHint(sectionHints: ReturnType<typeof extractSectionHints>, key: ReviewSectionKey) {
  return sectionHints.find((hint) => hint.key === key) ?? null
}

function findTimedEntryForIssue(
  issue: ReviewIssue,
  entries: ReturnType<typeof splitTimedEntries>,
) {
  const text = `${issue.title} ${issue.reason} ${issue.evidenceSnippets.join(' ')}`

  return (
    entries.find(
      (entry) =>
        text.includes(entry.shortLabel) ||
        text.includes(entry.header) ||
        issue.evidenceSnippets.some(
          (snippet) =>
            entry.header.includes(snippet) ||
            entry.content.includes(snippet),
        ),
    ) ?? null
  )
}

function selectProjectIssueAnchor(issue: ReviewIssue, entry: ReturnType<typeof splitTimedEntries>[number]) {
  const text = `${issue.title} ${issue.reason}`

  if (/(结果|量化|成果)/.test(text)) {
    const resultLine =
      getFirstMatchingLine(entry.content, /^(项目结果|项目成果|结果|成果)[:：]/) ||
      getFirstMatchingLine(entry.content, /(提升|下降|降低|增长|缩短|节省|覆盖|落地|上线|转化|准确率|效率|成本|预算|时长|耗时|金额|营收|ROI|CTR|CVR|GMV|复用|渗透|节约|减少|产出|价值|%|万)/)
    const resultText = extractLabeledBlockText(
      entry.content,
      /^(项目结果|项目成果|结果|成果)[:：]?/,
      [/^(项目背景|背景|项目目标|目标|北极星|职责描述|核心职责|具体动作)[:：]?/, /^【[^】]+】/],
    )

    return resultLine || getLeadingSnippet(resultText) || entry.shortLabel
  }

  if (/(背景)/.test(text)) {
    const backgroundLine = getFirstMatchingLine(entry.content, /^(项目背景|背景)[:：]?/)
    const backgroundText = extractLabeledBlockText(
      entry.content,
      /^(项目背景|背景)[:：]?/,
      [/^(项目目标|目标|北极星|职责描述|核心职责|具体动作|项目结果|结果|成果)[:：]?/, /^【[^】]+】/],
    )

    return backgroundLine || getLeadingSnippet(backgroundText) || entry.shortLabel
  }

  if (/(目标|痛点|北极星)/.test(text)) {
    const goalLine = getFirstMatchingLine(entry.content, /^(项目目标|目标|北极星)[:：]?/)
    const goalText = extractLabeledBlockText(
      entry.content,
      /^(项目目标|目标|北极星)[:：]?/,
      [/^(职责描述|核心职责|具体动作|项目结果|结果|成果)[:：]?/, /^【[^】]+】/],
    )

    return goalLine || getLeadingSnippet(goalText) || entry.shortLabel
  }

  if (/(职责|动作|完整|展开不足)/.test(text)) {
    const actionLine = getFirstMatchingLine(entry.content, /^(职责描述|核心职责|具体动作)[:：]?/)
    const actionText = extractLabeledBlockText(
      entry.content,
      /^(职责描述|核心职责|具体动作)[:：]?/,
      [/^(项目背景|背景|项目目标|目标|北极星|项目结果|结果|成果)[:：]?/, /^【[^】]+】/],
    )

    return actionLine || getLeadingSnippet(actionText) || entry.shortLabel
  }

  return entry.shortLabel
}

function refineIssueAnchors(
  report: ReviewReport,
  sectionHints: ReturnType<typeof extractSectionHints>,
) {
  const workHint = findSectionHint(sectionHints, 'work_experience')
  const projectHint = findSectionHint(sectionHints, 'project_experience')
  const workEntries = workHint ? splitTimedEntries(workHint.content) : []
  const projectEntries = projectHint ? splitTimedEntries(projectHint.content) : []

  report.sections.work_experience.issues.forEach((issue) => {
    const matchedEntry = findTimedEntryForIssue(issue, workEntries)

    if (!matchedEntry) {
      return
    }

    const isExpansionIssue = /(工作经历|经历).*(展开|不足|偏薄|仍需)|字数明显偏少|职责模块偏少|缺少背景或团队信息|缺少量化结果表达/.test(
      `${issue.title} ${issue.reason}`,
    )

    if (isExpansionIssue) {
      const companyName = matchedEntry.header.split(/[|｜]/)[0]?.trim() || matchedEntry.shortLabel
      issue.title = `${matchedEntry.shortLabel}经历展开不足`.slice(0, 18)
      issue.evidenceSnippets = [companyName]
    } else if (issue.evidenceSnippets.length === 0) {
      const companyName = matchedEntry.header.split(/[|｜]/)[0]?.trim() || matchedEntry.shortLabel
      issue.evidenceSnippets = [companyName]
    }
  })

  report.sections.project_experience.issues.forEach((issue) => {
    const matchedEntry = findTimedEntryForIssue(issue, projectEntries)

    if (!matchedEntry) {
      return
    }

    const issueText = `${issue.title} ${issue.reason}`
    const isGenericProjectIssue =
      /项目经历|项目/.test(issue.title) &&
      !issue.title.includes(matchedEntry.shortLabel)

    if (isGenericProjectIssue) {
      if (/(结果|量化|成果)/.test(`${issue.title} ${issue.reason}`)) {
        issue.title = `${matchedEntry.shortLabel}结果表达不足`.slice(0, 18)
      } else {
        issue.title = `${matchedEntry.shortLabel}项目不够完整`.slice(0, 18)
      }
    }

    // Expansion issues (多个flags合并) → always anchor to project name, not content lines
    const isExpansionProjectIssue =
      /(不够完整|展开不足|字数明显偏少)/.test(issue.title) ||
      (issue.reason.includes('以下问题') && /[、，]/.test(issue.reason))

    if (isExpansionProjectIssue) {
      issue.evidenceSnippets = [matchedEntry.shortLabel]
    } else if (/(结果|量化|成果)/.test(issueText)) {
      issue.evidenceSnippets = [selectProjectIssueAnchor(issue, matchedEntry)]
    } else if (/(背景|目标|痛点|北极星|职责|动作)/.test(issueText)) {
      issue.evidenceSnippets = [selectProjectIssueAnchor(issue, matchedEntry)]
    } else if (issue.evidenceSnippets.length === 0) {
      issue.evidenceSnippets = [matchedEntry.shortLabel]
    }
  })

  // Fallback: any work issue still without evidence → anchor to the weakest entry
  if (workEntries.length > 0) {
    const weakestWork = workEntries.reduce((a, b) =>
      a.bodyCharCount < b.bodyCharCount ? a : b,
    )
    const weakestCompany = weakestWork.header.split(/[|｜]/)[0]?.trim() || weakestWork.shortLabel
    report.sections.work_experience.issues.forEach((issue) => {
      if (issue.evidenceSnippets.length > 0) {
        return
      }
      issue.evidenceSnippets = [weakestCompany]
    })
  }

  // Fallback: any project issue still without evidence → anchor to the weakest entry
  if (projectEntries.length > 0) {
    const weakestProject = projectEntries.reduce((a, b) =>
      a.bodyCharCount < b.bodyCharCount ? a : b,
    )
    report.sections.project_experience.issues.forEach((issue) => {
      if (issue.evidenceSnippets.length > 0) {
        return
      }
      issue.evidenceSnippets = [weakestProject.shortLabel]
    })
  }
}

function isGenericSectionIssue(sectionKey: ReviewSectionKey, issue: ReviewIssue) {
  const text = `${issue.title} ${issue.reason}`

  if (sectionKey === 'personal_strengths') {
    return /(个人优势).*(补足|点数|不足|少于\s*8|8点)/.test(text)
  }

  if (sectionKey === 'work_experience') {
    return issue.evidenceSnippets.length === 0 && /(工作经历).*(展开|偏薄|仍需|内容)/.test(text)
  }

  if (sectionKey === 'project_experience') {
    return issue.evidenceSnippets.length === 0 && /(项目经历).*(展开|偏薄|仍需|不够完整|结果)/.test(text)
  }

  return false
}

function getIssueFingerprint(sectionKey: ReviewSectionKey, issue: ReviewIssue) {
  const text = `${issue.title} ${issue.reason}`.replace(/\s+/g, '')

  if (sectionKey === 'personal_strengths' && /(点数|少于8|8点|补足|仍需补足)/.test(text)) {
    return `${sectionKey}:strength-count`
  }

  if (sectionKey === 'work_experience' && issue.evidenceSnippets[0]) {
    return `${sectionKey}:entry:${issue.evidenceSnippets[0]}`
  }

  if (sectionKey === 'project_experience' && issue.evidenceSnippets[0]) {
    return `${sectionKey}:entry:${issue.evidenceSnippets[0]}`
  }

  return `${sectionKey}:${text
    .replace(/仍可继续优化|仍可优化|仍需展开|内容展开不足|内容偏薄|不够完整/g, '')
    .slice(0, 48)}`
}

function reindexSectionIssues(sectionKey: ReviewSectionKey, issues: ReviewIssue[]) {
  return issues.map((issue, index) => ({
    ...issue,
    id: `${sectionKey}-${index + 1}`,
  }))
}

function dedupeAndPruneSectionIssues(report: ReviewReport) {
  sectionOrder.forEach((sectionKey) => {
    const section = report.sections[sectionKey]
    const hasSpecificEntryIssue =
      (sectionKey === 'work_experience' || sectionKey === 'project_experience') &&
      section.issues.some((issue) => issue.evidenceSnippets.length > 0)

    let issues = hasSpecificEntryIssue
      ? section.issues.filter((issue) => !isGenericSectionIssue(sectionKey, issue))
      : [...section.issues]

    const seen = new Map<string, ReviewIssue>()
    issues = issues.filter((issue) => {
      const fingerprint = getIssueFingerprint(sectionKey, issue)
      const existing = seen.get(fingerprint)

      if (existing) {
        // Merge evidenceSnippets — prefer shorter snippets (more likely to match DOM)
        if (issue.evidenceSnippets.length > 0) {
          const all = [...new Set([...issue.evidenceSnippets, ...existing.evidenceSnippets])]
          all.sort((a, b) => a.length - b.length)
          existing.evidenceSnippets = all.slice(0, 2)
        }
        return false
      }

      seen.set(fingerprint, issue)
      return true
    })

    section.issues = reindexSectionIssues(sectionKey, issues)
    section.status = section.issues.length > 0 ? 'issue' : section.status === 'missing' ? 'missing' : 'pass'
  })
}

function applyHeuristicIssues(
  report: ReviewReport,
  sectionHints: ReturnType<typeof extractSectionHints>,
) {
  const heuristicIssues = inferHeuristicIssues(sectionHints)

  heuristicIssues.forEach((issue) => {
    const section = report.sections[issue.section]

    const similarIssue = findSimilarIssue(section, issue)

    if (similarIssue) {
      mergeIssuePrecision(similarIssue, issue)
    } else {
      attachSyntheticIssue(report, issue)
    }
  })

  const affectedSections = new Set(heuristicIssues.map((issue) => issue.section))

  if (affectedSections.has('work_experience') || affectedSections.has('project_experience')) {
    report.overallScore = Math.min(report.overallScore, 88)
  }

  if (affectedSections.has('work_experience') && affectedSections.has('project_experience')) {
    report.overallScore = Math.min(report.overallScore, 82)
  }

  if (
    affectedSections.has('personal_strengths') &&
    (affectedSections.has('work_experience') || affectedSections.has('project_experience'))
  ) {
    report.overallScore = Math.min(report.overallScore, 78)
  }

  return heuristicIssues.length
}

function getFallbackSectionByLength(sectionHints: ReturnType<typeof extractSectionHints>) {
  const rankedSections = sectionHints
    .filter((hint) => hint.key !== 'personal_info')
    .map((hint) => ({
      key: hint.key,
      length: hint.content.length,
    }))
    .sort((left, right) => left.length - right.length)

  return rankedSections[0]?.key ?? 'personal_strengths'
}

function ensureNonPerfectReportHasIssues(
  report: ReviewReport,
  sectionHints: ReturnType<typeof extractSectionHints>,
) {
  const heuristicIssueCount = applyHeuristicIssues(report, sectionHints)
  dedupeAndPruneSectionIssues(report)
  refineIssueAnchors(report, sectionHints)
  dedupeAndPruneSectionIssues(report)
  const totalIssues = sectionOrder.reduce(
    (count, section) => count + report.sections[section].issues.length,
    0,
  )

  if (report.overallScore < 100 && totalIssues === 0 && heuristicIssueCount === 0) {
    const mentionedSections = inferSectionFromReportText(report)

    if (mentionedSections.length > 0) {
      mentionedSections.forEach((section) => {
        attachSyntheticIssue(report, {
          section,
          title: `${sectionLabels[section]}仍可优化`,
          reason: report.overallSummary || `${sectionLabels[section]}仍有优化空间。`,
          fix: `请继续根据当前综合评价，补强 ${sectionLabels[section]} 中最影响满分判断的表达、结构或结果呈现。`,
        })
      })
    } else {
      const fallbackSection = getFallbackSectionByLength(sectionHints)
      attachSyntheticIssue(report, {
        section: fallbackSection,
        title: `${sectionLabels[fallbackSection]}仍可优化`,
        reason: report.overallSummary || '当前简历尚未达到满分状态，仍存在可继续打磨的表达空间。',
        fix: `请继续围绕 ${sectionLabels[fallbackSection]} 补足能支撑满分判断的细节表达，并重新批改确认。`,
      })
    }
  }

  dedupeAndPruneSectionIssues(report)
  refineIssueAnchors(report, sectionHints)
  dedupeAndPruneSectionIssues(report)

  if (report.overallScore < 100 && report.overallVerdict.trim() === '通过') {
    report.overallVerdict = '仍可继续优化'
  }

  return report
}

function isReviewIssueDraft(value: unknown) {
  return (
    isPlainObject(value) &&
    typeof value.title === 'string' &&
    typeof value.reason === 'string' &&
    typeof value.fix === 'string' &&
    typeof value.severity === 'string' &&
    Array.isArray(value.evidenceSnippets)
  )
}

function isReviewSectionDraft(value: unknown) {
  return (
    isPlainObject(value) &&
    typeof value.status === 'string' &&
    typeof value.summary === 'string' &&
    Array.isArray(value.issues) &&
    value.issues.every(isReviewIssueDraft)
  )
}

function assertValidReviewDraft(draft: unknown): asserts draft is ReviewDraft {
  if (!isPlainObject(draft)) {
    throw new Error('模型返回结构不符合批改协议。')
  }

  const sections = draft.sections
  if (
    !Number.isFinite(draft.overallScore) ||
    typeof draft.overallVerdict !== 'string' ||
    typeof draft.overallSummary !== 'string' ||
    !isPlainObject(sections)
  ) {
    throw new Error('模型返回结构不符合批改协议。')
  }

  for (const sectionKey of sectionOrder) {
    if (!isReviewSectionDraft(sections[sectionKey])) {
      throw new Error('模型返回结构不符合批改协议。')
    }
  }
}

function assertValidOptimizeDraft(draft: unknown): asserts draft is OptimizeDraft {
  if (
    !isPlainObject(draft) ||
    typeof draft.optimizedMarkdown !== 'string' ||
    !draft.optimizedMarkdown.trim()
  ) {
    throw new Error('模型返回结构不符合优化协议。')
  }
}

async function sendChatCompletion(payload: Record<string, unknown>) {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error('未检测到 AIHubMix API Key。请确认本地环境文件已配置。')
  }

  const response = await fetch(AIHUBMIX_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'ai-pm-resume-clinic',
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as ProviderResponse | null

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `AIHubMix 请求失败（${response.status}）。`

    throw new Error(message)
  }

  return data ?? {}
}

function shouldFallbackToLooseJson(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /response_format|json_schema|structured/i.test(message)
}

function isProviderReturnedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /provider returned error/i.test(message)
}

function isModelOutputError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return (
    error instanceof SyntaxError ||
    /模型返回结果不是可解析的 JSON|模型返回了空结果|模型返回结构不符合批改协议|模型返回结构不符合优化协议|Unexpected token|Expected .*JSON/i.test(
      message,
    )
  )
}

function shouldRetryWithoutSchema(error: unknown) {
  return shouldFallbackToLooseJson(error) || isProviderReturnedError(error)
}

function shouldFallbackToNextModel(error: unknown) {
  return isProviderReturnedError(error) || isModelOutputError(error)
}

function getRetryModels(requestedModel: string) {
  const ordered = [requestedModel, ...providerFallbackModelIds]
  return [...new Set(ordered)]
}

function getTokenLimitPayload(model: string) {
  if (/^gpt-/i.test(model)) {
    return {
      max_completion_tokens: DEFAULT_MAX_TOKENS,
    }
  }

  return {
    max_tokens: DEFAULT_MAX_TOKENS,
  }
}

async function runReviewWithModel(
  model: string,
  messages: Array<{ role: string; content: string }>,
  sourceDigest: string,
  sectionHints: ReturnType<typeof extractSectionHints>,
) {
  try {
    const data = await sendChatCompletion({
      model,
      temperature: 0.2,
      stream: false,
      ...getTokenLimitPayload(model),
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: reviewResponseSchema,
      },
    })

    const draft = parseJsonFromResponse<ReviewDraft>(data)
    assertValidReviewDraft(draft)
    return ensureNonPerfectReportHasIssues(
      normalizeReport(draft, model, sourceDigest),
      sectionHints,
    )
  } catch (error) {
    if (!shouldRetryWithoutSchema(error)) {
      throw error
    }

    const fallbackMessages = [
      ...messages,
      {
        role: 'system',
        content:
          '如果上一步的结构化输出参数不被支持，请继续按同样标准批改，但必须仅返回 JSON 对象，不要输出代码块。',
      },
    ]

    const data = await sendChatCompletion({
      model,
      temperature: 0.2,
      stream: false,
      ...getTokenLimitPayload(model),
      messages: fallbackMessages,
    })

    const draft = parseJsonFromResponse<ReviewDraft>(data)
    assertValidReviewDraft(draft)
    return ensureNonPerfectReportHasIssues(
      normalizeReport(draft, model, sourceDigest),
      sectionHints,
    )
  }
}

function normalizeOptimizedMarkdown(draft: OptimizeDraft, originalMarkdown: string) {
  const optimizedMarkdown = draft.optimizedMarkdown?.trim()

  if (!optimizedMarkdown) {
    throw new Error('优化 Agent 没有返回有效的 Markdown。')
  }

  return optimizedMarkdown.replace(/\r\n/g, '\n') || originalMarkdown
}

async function runOptimizeWithModel(
  model: string,
  messages: Array<{ role: string; content: string }>,
  originalMarkdown: string,
) {
  try {
    const data = await sendChatCompletion({
      model,
      temperature: 0.25,
      stream: false,
      ...getTokenLimitPayload(model),
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: optimizeResponseSchema,
      },
    })

    const draft = parseJsonFromResponse<OptimizeDraft>(data)
    assertValidOptimizeDraft(draft)
    return {
      markdown: normalizeOptimizedMarkdown(draft, originalMarkdown),
      model,
    } satisfies OptimizeResult
  } catch (error) {
    if (!shouldRetryWithoutSchema(error)) {
      throw error
    }

    const fallbackMessages = [
      ...messages,
      {
        role: 'system',
        content:
          '如果上一步的结构化输出参数不被支持，请继续按同样要求执行，但必须仅返回一个 JSON 对象，且只包含 optimizedMarkdown 字段。',
      },
    ]

    const data = await sendChatCompletion({
      model,
      temperature: 0.25,
      stream: false,
      ...getTokenLimitPayload(model),
      messages: fallbackMessages,
    })

    const draft = parseJsonFromResponse<OptimizeDraft>(data)
    assertValidOptimizeDraft(draft)
    return {
      markdown: normalizeOptimizedMarkdown(draft, originalMarkdown),
      model,
    } satisfies OptimizeResult
  }
}

export async function reviewResume(markdown: string, model: string) {
  const sectionHints = extractSectionHints(markdown)
  const sourceDigest = createSourceDigest(markdown)
  const messages = [
    { role: 'system', content: reviewSystemPrompt },
    { role: 'user', content: buildReviewUserPrompt(markdown, sectionHints) },
  ]
  const retryModels = getRetryModels(model)
  const attemptedModels: string[] = []
  let lastError: unknown = null

  for (const currentModel of retryModels) {
    try {
      attemptedModels.push(currentModel)
      return await runReviewWithModel(currentModel, messages, sourceDigest, sectionHints)
    } catch (error) {
      lastError = error

      if (!shouldFallbackToNextModel(error)) {
        throw error
      }
    }
  }

  const fallbackTail = attemptedModels.slice(1)
  const suffix =
    fallbackTail.length > 0
      ? `，已自动尝试 ${fallbackTail.join('、')} 兜底`
      : ''
  const message =
    lastError instanceof Error ? lastError.message : '请求失败，请稍后重试。'

  throw new Error(`${attemptedModels[0]} 调用失败${suffix}：${message}`)
}

export async function optimizeResume(markdown: string, report: ReviewReport, model: string) {
  const messages = [
    { role: 'system', content: optimizeSystemPrompt },
    { role: 'user', content: buildOptimizeUserPrompt(markdown, report) },
  ]
  const retryModels = getRetryModels(model)
  const attemptedModels: string[] = []
  let lastError: unknown = null

  for (const currentModel of retryModels) {
    try {
      attemptedModels.push(currentModel)
      return await runOptimizeWithModel(currentModel, messages, markdown)
    } catch (error) {
      lastError = error

      if (!shouldFallbackToNextModel(error)) {
        throw error
      }
    }
  }

  const fallbackTail = attemptedModels.slice(1)
  const suffix =
    fallbackTail.length > 0
      ? `，已自动尝试 ${fallbackTail.join('、')} 兜底`
      : ''
  const message =
    lastError instanceof Error ? lastError.message : '请求失败，请稍后重试。'

  throw new Error(`${attemptedModels[0]} 调用失败${suffix}：${message}`)
}
