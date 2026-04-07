import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { sectionOrder } from '../data/reviewConfig'
import type { ReviewIssue, ReviewSectionKey, SectionHint } from '../types'

marked.setOptions({
  gfm: true,
  breaks: true,
})

const headingMatchers: Array<{ key: ReviewSectionKey; keywords: string[] }> = [
  {
    key: 'personal_info',
    keywords: ['个人信息', '基本信息', '基本资料', '个人资料'],
  },
  {
    key: 'personal_strengths',
    keywords: ['个人优势', '个人亮点', '核心优势', '自我评价', '个人总结'],
  },
  {
    key: 'work_experience',
    keywords: ['工作经历', '职业经历', '实习经历'],
  },
  {
    key: 'project_experience',
    keywords: ['项目经历', '项目经验', '代表项目', '核心项目'],
  },
]

function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n/g, '\n').trim()
}

function matchHeadingToSection(heading: string) {
  const normalized = heading.replace(/^#+\s*/, '').trim()

  for (const matcher of headingMatchers) {
    if (matcher.keywords.some((keyword) => normalized.includes(keyword))) {
      return matcher.key
    }
  }

  return null
}

function getIssueSectionKey(issueId: string | null) {
  if (!issueId) {
    return null
  }

  return sectionOrder.find((key) => issueId.startsWith(`${key}-`)) ?? null
}

function normalizeSnippet(snippet: string) {
  let s = snippet.trim()
    .replace(/^#+\s*/, '')        // strip markdown headings
    .replace(/\*{1,2}/g, '')      // strip bold/italic markers
    .replace(/^[-*•]\s*/, '')     // strip bullet markers
    .replace(/^\d+[.、)]\s*/, '') // strip numbered list markers
  // Strip bold label prefixes that render as <strong> in DOM, causing the
  // snippet to span element boundaries and fail text-node matching.
  const withoutLabel = s
    .replace(/^【[^】]+】\s*/, '')
    // Known section labels
    .replace(
      /^(项目背景|背景|项目目标|目标|北极星|职责描述|核心职责|具体动作|项目结果|结果|成果|项目成果)[:：]\s*/,
      '',
    )
    // Generic bold label pattern: "ShortLabel：" (Chinese colon after ≤12-char label)
    .replace(/^[\u4e00-\u9fa5A-Za-z]{2,12}[:：]\s*/, '')
  return withoutLabel || s
}

function isAbstractIssue(issue: ReviewIssue) {
  const abstractPattern =
    /(偏薄|展开不足|点数不足|字数|总字数|少于|至少|缺少|缺失|未形成|时间线|时间顺序|不在推荐区间|项目数|结果不足|背景不足|模块数量偏少|信号偏弱|仍需补足|不够完整)/i

  return abstractPattern.test(`${issue.title} ${issue.reason}`)
}

function stripMarkdownFormatting(text: string) {
  return text.replace(/\*{1,2}/g, '').replace(/^#+\s*/gm, '')
}

function hasMatchedSnippet(markdown: string, issue: ReviewIssue) {
  const content = stripMarkdownFormatting(normalizeMarkdown(markdown))

  return issue.evidenceSnippets
    .map(normalizeSnippet)
    .filter(Boolean)
    .some((snippet) => content.includes(snippet))
}

function getMatchedSnippetIssueIds(markdown: string, issues: ReviewIssue[]) {
  return new Set(
    issues
      .filter((issue) => hasMatchedSnippet(markdown, issue))
      .map((issue) => issue.id),
  )
}

function isTimedEntryHeader(text: string) {
  return /(\||｜).*\d{4}[./-]\d{1,2}/.test(text)
}

function extractEntryLabel(header: string) {
  const segments = header
    .split(/[|｜]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !/\d{4}[./-]\d{1,2}/.test(segment) && !/至今/.test(segment))

  return segments[1] ?? segments[0] ?? header.trim()
}

function isEntryHeaderElement(node: Node) {
  if (!(node instanceof HTMLElement)) {
    return false
  }

  // H1 and H2 are section-level headers; H3+ can be entry headers
  if (/^H[12]$/.test(node.tagName)) {
    return false
  }

  const text = node.textContent?.trim() ?? ''
  return text.length > 0 && text.length <= 120 && isTimedEntryHeader(text)
}

export function extractSectionHints(markdown: string): SectionHint[] {
  const content = normalizeMarkdown(markdown)
  const lines = content.split('\n')
  const headings = lines
    .map((line, index) => ({
      index,
      key: matchHeadingToSection(line),
      raw: line.trim(),
    }))
    .filter(
      (item): item is { index: number; key: ReviewSectionKey; raw: string } =>
        Boolean(item.key),
    )

  const bySection = new Map<ReviewSectionKey, SectionHint>()

  if (headings.length) {
    headings.forEach((heading, index) => {
      const endIndex = headings[index + 1]?.index ?? lines.length
      const sectionContent = lines.slice(heading.index + 1, endIndex).join('\n').trim()

      if (!bySection.has(heading.key)) {
        bySection.set(heading.key, {
          key: heading.key,
          heading: heading.raw,
          content: sectionContent,
        })
      }
    })
  }

  if (!bySection.has('personal_info')) {
    const firstHeadingIndex = headings[0]?.index ?? lines.length
    const topBlock = lines.slice(0, firstHeadingIndex).join('\n').trim()

    if (topBlock) {
      bySection.set('personal_info', {
        key: 'personal_info',
        heading: '推断为个人信息',
        content: topBlock,
      })
    }
  }

  return sectionOrder
    .map((key) => bySection.get(key))
    .filter((item): item is SectionHint => Boolean(item && item.content))
}

/**
 * Split markdown into raw section blocks (including heading lines).
 * Returns { key, rawText } for each recognized section, plus a 'preamble'
 * block for everything before the first matched heading.
 */
export function splitMarkdownSections(markdown: string) {
  const content = normalizeMarkdown(markdown)
  const lines = content.split('\n')
  const headings = lines
    .map((line, index) => ({
      index,
      key: matchHeadingToSection(line),
    }))
    .filter(
      (item): item is { index: number; key: ReviewSectionKey } =>
        Boolean(item.key),
    )

  const blocks: Array<{ key: ReviewSectionKey | '_preamble'; rawText: string }> = []

  // Preamble: everything before first matched heading
  const firstHeadingLine = headings[0]?.index ?? lines.length
  if (firstHeadingLine > 0) {
    blocks.push({
      key: '_preamble',
      rawText: lines.slice(0, firstHeadingLine).join('\n'),
    })
  }

  headings.forEach((heading, i) => {
    const endLine = headings[i + 1]?.index ?? lines.length
    blocks.push({
      key: heading.key,
      rawText: lines.slice(heading.index, endLine).join('\n'),
    })
  })

  return blocks
}

/**
 * After optimization, restore original text for sections that had no issues.
 * This prevents the optimize model from accidentally modifying clean sections.
 */
export function guardOptimizedSections(
  originalMarkdown: string,
  optimizedMarkdown: string,
  sectionKeysWithIssues: Set<ReviewSectionKey>,
) {
  const originalBlocks = splitMarkdownSections(originalMarkdown)
  const optimizedBlocks = splitMarkdownSections(optimizedMarkdown)

  // Build a map of optimized sections
  const optimizedMap = new Map(
    optimizedBlocks.map((b) => [b.key, b.rawText]),
  )

  // For each original block: keep original if section had no issues, else use optimized
  const result = originalBlocks.map((block) => {
    if (block.key === '_preamble') {
      // Preamble is personal_info if there's no explicit personal_info heading
      const hasExplicitPI = originalBlocks.some((b) => b.key === 'personal_info')
      if (!hasExplicitPI && sectionKeysWithIssues.has('personal_info')) {
        return optimizedMap.get('_preamble') ?? block.rawText
      }
      if (!hasExplicitPI && !sectionKeysWithIssues.has('personal_info')) {
        return block.rawText
      }
      return optimizedMap.get('_preamble') ?? block.rawText
    }

    if (sectionKeysWithIssues.has(block.key as ReviewSectionKey)) {
      // This section had issues — use optimized version
      return optimizedMap.get(block.key) ?? block.rawText
    }

    // No issues in this section — keep original
    return block.rawText
  })

  return result.join('\n').trim()
}

export function createSourceDigest(markdown: string) {
  let hash = 0
  const normalized = normalizeMarkdown(markdown)

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(index)
    hash |= 0
  }

  return `resume_${Math.abs(hash)}_${normalized.length}`
}

export interface SnippetLocation {
  snippet: string
  index: number
  line: number
}

export function findFirstSnippetLocation(markdown: string, snippets: string[]) {
  const content = normalizeMarkdown(markdown)

  for (const snippet of snippets) {
    const normalizedSnippet = snippet.trim()
    if (!normalizedSnippet) {
      continue
    }

    const index = content.indexOf(normalizedSnippet)
    if (index === -1) {
      continue
    }

    const line = content.slice(0, index).split('\n').length
    return {
      snippet: normalizedSnippet,
      index,
      line,
    } satisfies SnippetLocation
  }

  return null
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function shouldSkipNode(parent: HTMLElement | null) {
  if (!parent) {
    return true
  }

  return Boolean(parent.closest('pre, code, kbd, samp, script, style, mark'))
}

interface HighlightTarget {
  issueId: string
  snippet: string
  sectionKey: ReviewSectionKey | null
}

function isHeadingElement(node: Node): node is HTMLElement {
  return node instanceof HTMLElement && /^H[1-6]$/.test(node.tagName)
}

function wrapSections(root: HTMLElement) {
  const children = Array.from(root.childNodes)
  let currentSection: ReviewSectionKey = 'personal_info'
  let currentWrapper: HTMLElement | null = null

  root.innerHTML = ''

  const ensureWrapper = (section: ReviewSectionKey) => {
    if (currentWrapper?.dataset.sectionKey === section) {
      return currentWrapper
    }

    currentWrapper = document.createElement('section')
    currentWrapper.className = 'resume-section'
    currentWrapper.dataset.sectionKey = section
    root.append(currentWrapper)
    return currentWrapper
  }

  children.forEach((child) => {
    if (isHeadingElement(child)) {
      const matchedSection = matchHeadingToSection(child.textContent ?? '')
      if (matchedSection) {
        currentSection = matchedSection
      }
    }

    ensureWrapper(currentSection).append(child)
  })
}

function wrapEntryBlocks(root: HTMLElement) {
  const sections = root.querySelectorAll<HTMLElement>('.resume-section')

  sections.forEach((section) => {
    const sectionKey = section.dataset.sectionKey as ReviewSectionKey | undefined

    if (sectionKey !== 'work_experience' && sectionKey !== 'project_experience') {
      return
    }

    const children = Array.from(section.childNodes)
    let currentEntry: HTMLElement | null = null
    section.innerHTML = ''

    children.forEach((child) => {
      if (isEntryHeaderElement(child)) {
        const header = child.textContent?.trim() ?? ''
        currentEntry = document.createElement('article')
        currentEntry.className = 'resume-entry'
        currentEntry.dataset.entryHeader = header
        currentEntry.dataset.entryLabel = extractEntryLabel(header)
        section.append(currentEntry)
        currentEntry.append(child)
        return
      }

      if (currentEntry) {
        currentEntry.append(child)
      } else {
        section.append(child)
      }
    })
  })
}

function buildEntryIssueMap(
  root: HTMLElement,
  issues: ReviewIssue[],
  matchedSnippetIssueIds: Set<string>,
) {
  const entryIssueMap = new Map<HTMLElement, ReviewIssue[]>()
  const issueEntryMap = new Map<string, HTMLElement>()
  const entries = Array.from(root.querySelectorAll<HTMLElement>('.resume-entry'))

  issues.forEach((issue) => {
    if (matchedSnippetIssueIds.has(issue.id)) {
      return
    }

    const snippets = issue.evidenceSnippets
      .map(normalizeSnippet)
      .filter(Boolean)

    const matchedEntry = entries.find((entry) =>
      (snippets.length > 0 &&
        snippets.some((snippet) => (entry.textContent ?? '').includes(snippet))) ||
      (entry.dataset.entryLabel &&
        (`${issue.title} ${issue.reason}`.includes(entry.dataset.entryLabel) ||
          entry.dataset.entryHeader &&
            `${issue.title} ${issue.reason}`.includes(entry.dataset.entryHeader))),
    )

    if (!matchedEntry) {
      return
    }

    issueEntryMap.set(issue.id, matchedEntry)
    const currentIssues = entryIssueMap.get(matchedEntry) ?? []
    currentIssues.push(issue)
    entryIssueMap.set(matchedEntry, currentIssues)
  })

  return {
    entryIssueMap,
    issueEntryMap,
  }
}

function applyEntryIssueState(
  root: HTMLElement,
  issues: ReviewIssue[],
  activeIssueId: string | null,
  matchedSnippetIssueIds: Set<string>,
) {
  const { entryIssueMap, issueEntryMap } = buildEntryIssueMap(
    root,
    issues,
    matchedSnippetIssueIds,
  )
  const entries = root.querySelectorAll<HTMLElement>('.resume-entry')

  entries.forEach((entry) => {
    const entryIssues = entryIssueMap.get(entry) ?? []
    const isActive = Boolean(activeIssueId && entryIssues.some((issue) => issue.id === activeIssueId))
    const preferredIssue =
      entryIssues.find((issue) => issue.id === activeIssueId) ?? entryIssues[0] ?? null

    entry.classList.toggle('resume-entry--issue', entryIssues.length > 0)
    entry.classList.toggle('resume-entry--active', isActive)

    if (preferredIssue) {
      entry.dataset.issueId = preferredIssue.id
    } else {
      delete entry.dataset.issueId
    }
  })

  return issueEntryMap
}

function applyActiveSectionState(
  root: HTMLElement,
  activeIssueId: string | null,
  issueEntryMap: Map<string, HTMLElement>,
  matchedSnippetIssueIds: Set<string>,
) {
  const activeSectionKey = getIssueSectionKey(activeIssueId)
  const sections = root.querySelectorAll<HTMLElement>('.resume-section')

  sections.forEach((section) => {
    const isActive = Boolean(
      activeSectionKey &&
        section.dataset.sectionKey === activeSectionKey &&
        (!activeIssueId || !matchedSnippetIssueIds.has(activeIssueId)) &&
        (!activeIssueId || !issueEntryMap.has(activeIssueId)),
    )
    section.classList.toggle('resume-section--active', isActive)
  })
}

function isSectionLevelIssue(
  issue: ReviewIssue,
  matchedSnippetIssueIds: Set<string>,
  issueEntryMap: Map<string, HTMLElement>,
) {
  if (matchedSnippetIssueIds.has(issue.id)) {
    return false
  }

  if (issueEntryMap.has(issue.id)) {
    return false
  }

  return isAbstractIssue(issue)
}

function getFallbackSectionIssues(
  issues: ReviewIssue[],
  matchedSnippetIssueIds: Set<string>,
  issueEntryMap: Map<string, HTMLElement>,
) {
  const fallbackIssueMap = new Map<ReviewSectionKey, ReviewIssue[]>()

  issues.forEach((issue) => {
    const sectionKey = getIssueSectionKey(issue.id)

    if (!sectionKey) {
      return
    }

    if (isSectionLevelIssue(issue, matchedSnippetIssueIds, issueEntryMap)) {
      const currentIssues = fallbackIssueMap.get(sectionKey) ?? []
      currentIssues.push(issue)
      fallbackIssueMap.set(sectionKey, currentIssues)
    }
  })

  return fallbackIssueMap
}

function applyFallbackSectionState(
  root: HTMLElement,
  issues: ReviewIssue[],
  activeIssueId: string | null,
  matchedSnippetIssueIds: Set<string>,
  issueEntryMap: Map<string, HTMLElement>,
) {
  const fallbackIssueMap = getFallbackSectionIssues(
    issues,
    matchedSnippetIssueIds,
    issueEntryMap,
  )
  const sections = root.querySelectorAll<HTMLElement>('.resume-section')

  sections.forEach((section) => {
    const sectionKey = section.dataset.sectionKey as ReviewSectionKey | undefined
    const sectionIssues = sectionKey ? fallbackIssueMap.get(sectionKey) ?? [] : []

    section.classList.toggle(
      'resume-section--issue',
      sectionIssues.length > 0,
    )

    const preferredIssue =
      sectionIssues.find((issue) => issue.id === activeIssueId) ?? sectionIssues[0] ?? null

    if (preferredIssue) {
      section.dataset.issueId = preferredIssue.id
    } else {
      delete section.dataset.issueId
    }
  })
}

function wrapHighlights(
  root: HTMLElement,
  targets: HighlightTarget[],
  activeIssueId: string | null,
) {
  if (!targets.length) {
    return
  }

  const uniqueTargets = targets
    .filter((target) => target.snippet.trim())
    .filter(
      (target, index, source) =>
        source.findIndex(
          (candidate) =>
            candidate.issueId === target.issueId && candidate.snippet === target.snippet,
        ) === index,
    )
    .sort((left, right) => right.snippet.length - left.snippet.length)

  // Process each section independently: only match targets belonging to that section
  const sections = root.querySelectorAll<HTMLElement>('.resume-section')

  sections.forEach((section) => {
    const sectionKey = section.dataset.sectionKey as ReviewSectionKey | undefined
    if (!sectionKey) return

    // Targets for this section + targets with no section (fallback)
    const sectionTargets = uniqueTargets.filter(
      (t) => t.sectionKey === sectionKey || t.sectionKey === null,
    )
    if (!sectionTargets.length) return

    // Each snippet highlights at most once within its section
    const usedSnippets = new Set<string>()

    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT)
    const nodes: Text[] = []
    while (walker.nextNode()) {
      const currentNode = walker.currentNode
      if (currentNode instanceof Text && currentNode.textContent?.trim()) {
        nodes.push(currentNode)
      }
    }

    nodes.forEach((node) => {
      if (shouldSkipNode(node.parentElement)) return

      const originalText = node.textContent ?? ''
      if (!originalText.trim()) return

      const availableTargets = sectionTargets.filter(
        (t) => !usedSnippets.has(t.snippet.toLowerCase()),
      )
      if (!availableTargets.length) return

      const fragment = document.createDocumentFragment()
      let remainder = originalText
      let hasMatch = false

      while (remainder) {
        const nextMatch = findNextMatch(remainder, availableTargets)
        if (!nextMatch) {
          fragment.append(document.createTextNode(remainder))
          break
        }

        const { index: matchIndex, target: matchTarget } = nextMatch

        if (matchIndex > 0) {
          fragment.append(document.createTextNode(remainder.slice(0, matchIndex)))
        }

        const matchedText = remainder.slice(
          matchIndex,
          matchIndex + matchTarget.snippet.length,
        )
        // Collect all issue IDs that share this snippet text within this section
        const allIssueIds = [...new Set(
          sectionTargets
            .filter((t) => t.snippet.toLowerCase() === matchTarget.snippet.toLowerCase())
            .map((t) => t.issueId),
        )]
        const mark = document.createElement('mark')
        mark.className = allIssueIds.includes(activeIssueId ?? '')
          ? 'resume-highlight resume-highlight--active'
          : 'resume-highlight'
        mark.dataset.issueId = allIssueIds[0]
        mark.dataset.issueIds = allIssueIds.join(',')
        mark.textContent = matchedText
        fragment.append(mark)

        usedSnippets.add(matchTarget.snippet.toLowerCase())
        remainder = remainder.slice(matchIndex + matchTarget.snippet.length)
        hasMatch = true
      }

      if (hasMatch) {
        node.replaceWith(fragment)
      }
    })
  })
}

function findNextMatch(text: string, targets: HighlightTarget[]) {
  const lowerText = text.toLowerCase()
  let bestMatch: { index: number; target: HighlightTarget } | null = null

  for (const target of targets) {
    const lowerSnippet = target.snippet.toLowerCase()
    const index = lowerText.search(new RegExp(escapeRegExp(lowerSnippet), 'i'))

    if (index === -1) {
      continue
    }

    if (!bestMatch || index < bestMatch.index) {
      bestMatch = { index, target }
      continue
    }

    if (
      bestMatch &&
      index === bestMatch.index &&
      target.snippet.length > bestMatch.target.snippet.length
    ) {
      bestMatch = { index, target }
    }
  }

  return bestMatch
}

function createHighlightTargets(markdown: string, issues: ReviewIssue[]) {
  return issues
    .filter((issue) => hasMatchedSnippet(markdown, issue))
    .flatMap((issue) =>
      issue.evidenceSnippets.map((snippet) => ({
        issueId: issue.id,
        snippet: normalizeSnippet(snippet),
        sectionKey: getIssueSectionKey(issue.id),
      })),
    )
}

export function renderMarkdownToHtml(
  markdown: string,
  issues: ReviewIssue[],
  activeIssueId: string | null,
) {
  const html = marked.parse(normalizeMarkdown(markdown)) as string
  const sanitizedHtml = DOMPurify.sanitize(html)
  const targets = createHighlightTargets(markdown, issues)
  const matchedSnippetIssueIds = getMatchedSnippetIssueIds(markdown, issues)

  if (typeof document === 'undefined') {
    return sanitizedHtml
  }

  const wrapper = document.createElement('div')
  wrapper.innerHTML = sanitizedHtml
  wrapSections(wrapper)
  wrapEntryBlocks(wrapper)
  const issueEntryMap = applyEntryIssueState(
    wrapper,
    issues,
    activeIssueId,
    matchedSnippetIssueIds,
  )
  applyFallbackSectionState(
    wrapper,
    issues,
    activeIssueId,
    matchedSnippetIssueIds,
    issueEntryMap,
  )
  if (targets.length) {
    wrapHighlights(wrapper, targets, activeIssueId)
    // Mark entries that contain snippet highlights for precise visual feedback
    wrapper.querySelectorAll<HTMLElement>('.resume-entry').forEach((entry) => {
      const hasAnyHighlight = entry.querySelector('.resume-highlight') !== null
      const hasActiveHighlight = entry.querySelector('.resume-highlight--active') !== null
      entry.classList.toggle('resume-entry--has-highlight', hasAnyHighlight)
      entry.classList.toggle('resume-entry--highlight-active', hasActiveHighlight)
    })
  }
  applyActiveSectionState(wrapper, activeIssueId, issueEntryMap, matchedSnippetIssueIds)
  return wrapper.innerHTML
}
