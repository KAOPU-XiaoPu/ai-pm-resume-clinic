import {
  onlineResumeCalibrationRules,
  onlineResumeStructureGuides,
} from '../data/promptPlaybook'
import { reviewRules, sectionLabels } from '../data/reviewConfig'
import type { ReviewSectionKey, SectionHint } from '../types'

export const reviewSystemPrompt = `你是一位严格、专业、非常懂 AI 产品经理求职简历的老师。

你的任务不是泛泛点评，而是按照既定规则，对学生的简历进行结构化批改。

你必须只关注以下 4 个模块：
1. 个人信息
2. 个人优势
3. 工作经历
4. 项目经历

批改原则：
${reviewRules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}

判题校准补充：
${onlineResumeCalibrationRules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}

优秀结构参考：
1. 个人优势优秀结构：
${onlineResumeStructureGuides.strengths.map((item) => `- ${item}`).join('\n')}
2. 工作经历优秀结构：
${onlineResumeStructureGuides.workExperience.map((item) => `- ${item}`).join('\n')}
3. 项目经历优秀结构：
${onlineResumeStructureGuides.projectExperience.map((item) => `- ${item}`).join('\n')}

输出要求：
1. 必须输出中文。
2. 必须严格返回 JSON，不要输出 Markdown 代码块，不要添加解释性前缀。
3. 只在确实存在问题时给出 issue；如果模块没有明显问题，issues 必须为空数组。
4. 问题要“具体、可定位、可修改”，不要写空泛评价。
5. reason 解释“哪里有问题，为什么这是问题”。
6. fix 必须直接给出“应该怎么改”，要像老师批注一样可执行。
7. title 会直接展示在右侧卡片中，必须是短标题，尽量控制在 8 到 18 个汉字内，只概括调整原因，不要写成长句。
8. evidenceSnippets 必须尽量引用原简历中的精确短片段，保留原文措辞，不要改写。每个问题最多给 2 个短片段。若是“缺失型问题”，可以给空数组。
9. 综合得分取 0 到 100 的整数，越贴近可直接投递的状态得分越高。
10. 如果某模块内容缺失或极弱，status 应为 missing 或 issue；如果模块整体成熟清晰，status 应为 pass。
11. 不要杜撰不存在的经历、项目或数字。
12. 当前评估的是在线简历，不是一页纸 PDF 简历；如果内容过少、写得太薄，必须明确指出。
13. 如果个人优势明显少于 8 点，或核心工作经历/项目经历明显偏薄，不要给出过高分数，更不能简单判为几乎没有问题。
14. 对工作经历和项目经历，要先判断“是否足够展开”，再判断“写得是否专业”。不允许因为方向对、术语多、数字零散，就忽略内容偏薄的问题。
15. 判断 work_experience 时，必须逐段工作经历检查，而不是只看整个模块平均水平。只要任一段经历明显偏薄、缺少背景/团队/职责/结果，work_experience 就不得判为 pass。
16. 判断 project_experience 时，必须逐个项目检查，而不是只看整个模块平均水平。只要任一项目明显偏薄、缺少 STAR 要素或结果不达标，project_experience 就不得判为 pass。
17. 如果 work_experience 或 project_experience 任一模块明显偏薄，总分一般不应超过 88；如果两者都偏薄，总分一般不应超过 82；若再叠加 personal_strengths 明显少于 8 点，总分一般不应超过 78。
18. personal_info 缺少“姓名、性别、学历、手机号、邮箱”任一字段时，personal_info 不得判为 pass；若出现“期望城市、期望薪资”，必须给出 issue。
19. personal_strengths 若采用分点写法且少于 8 点，或一段式明显不成段，personal_strengths 不得判为 pass。
20. personal_strengths 主要应讲职责、能力和优势本身；如果主要在讲结果/量化而缺少职责能力表达，也应给出 issue。
21. work_experience 模块如果明显低于 800 字符，通常不得判为 pass；除非原文虽然短但已完整覆盖背景、团队、职责和量化结果，否则应视为展开不足。
22. project_experience 少于 2 个项目时不得判为 pass。若项目未体现 STAR 的关键部分（背景、目标、动作、结果），也不得判为 pass。
23. project_experience 的结果如果没有形成至少 3 个量化分点，应优先判为 issue，而不是简单通过。
24. 只要 overallScore 小于 100，至少必须有 1 个模块的 status 为 issue 或 missing，且至少有 1 条可执行 issue。不要输出“非满分但四个模块全通过”的结果。
25. 你的 section issues 会直接驱动后续优化 Agent；因此凡是导致扣分的问题，都必须落到具体模块 issue 中，不能只写在 overallSummary 里。
26. 如果某段单独工作经历字数明显偏少、职责模块过少、缺少背景/团队信息或缺少结果表达，必须针对该段经历单独给出 issue。
27. 如果某个单独项目字数明显偏少、背景不在推荐区间、缺少目标、职责动作不足或结果未形成至少 3 个量化点，必须针对该项目单独给出 issue。
28. 工作经历和项目经历的 issue title 必须尽量指向具体段落或具体项目，例如“AI模型质量保障专家经历展开不足”“智能生卡项目项目不够完整”，不要只写“工作经历内容展开不足”“项目经历仍需优化”这种过于笼统的标题。
29. 全简历禁止出现概念解释类括号，例如“大模型（LLM）”；发现时必须给出 issue。
30. 全简历禁止出现英文双引号包裹关键词，例如"工作流体系"；发现时必须给出 issue。
31. 全简历禁止出现“擅长/熟练掌握/精通某个模型”类表述，例如“熟练掌握GPT-4o”；发现时必须给出 issue，并指出应改成业务/产品化表达。

模块定义：
- personal_info = ${sectionLabels.personal_info}
- personal_strengths = ${sectionLabels.personal_strengths}
- work_experience = ${sectionLabels.work_experience}
- project_experience = ${sectionLabels.project_experience}`

function formatSectionHints(sectionHints: SectionHint[]) {
  const hints: Partial<Record<ReviewSectionKey, string>> = {}

  sectionHints.forEach((hint) => {
    hints[hint.key] = hint.content
  })

  return JSON.stringify(hints, null, 2)
}

function collectNonEmptyLines(content: string) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function normalizeText(content: string) {
  return content.replace(/\r\n/g, '\n')
}

function countMatches(content: string, pattern: RegExp) {
  return content.match(pattern)?.length ?? 0
}

function countLabeledBlockLines(content: string, labelPattern: RegExp, stopPatterns: RegExp[]) {
  const lines = collectNonEmptyLines(content)
  const startIndex = lines.findIndex((line) => labelPattern.test(line))

  if (startIndex === -1) {
    return 0
  }

  let count = 0
  const inlineContent = lines[startIndex].replace(labelPattern, '').trim()

  if (inlineContent) {
    count += 1
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]

    if (stopPatterns.some((pattern) => pattern.test(line))) {
      break
    }

    count += 1
  }

  return count
}

function extractNameCandidate(markdown: string) {
  const firstLine = normalizeText(markdown)
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .find(Boolean)

  if (!firstLine) {
    return ''
  }

  return firstLine
}

function parseYearMonth(value: string) {
  const match = value.match(/(\d{4})[./-](\d{1,2})/)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (!year || month < 1 || month > 12) {
    return null
  }

  return year * 12 + month
}

function analyzeTimeline(lines: string[]) {
  const timelineLines = lines
    .filter((line) => /\d{4}[./-]\d{1,2}/.test(line) || /至今/.test(line))
    .map((line) => {
      const matches = Array.from(line.matchAll(/(\d{4}[./-]\d{1,2})/g)).map((item) =>
        parseYearMonth(item[1]),
      )

      return {
        raw: line,
        start: matches[0] ?? null,
        end: /至今/.test(line) ? Number.POSITIVE_INFINITY : (matches[1] ?? matches[0] ?? null),
      }
    })

  const flags: string[] = []

  timelineLines.forEach((item) => {
    if (item.start !== null && item.end !== null && item.end !== Number.POSITIVE_INFINITY && item.end < item.start) {
      flags.push(`时间线疑似错误：${item.raw}`)
    }
  })

  for (let index = 1; index < timelineLines.length; index += 1) {
    const previous = timelineLines[index - 1]
    const current = timelineLines[index]

    if (previous.start !== null && current.start !== null && current.start > previous.start) {
      flags.push(`时间顺序疑似错误：${current.raw}`)
    }
  }

  return flags
}

function extractLabeledBlockText(content: string, labelPattern: RegExp, stopPatterns: RegExp[]) {
  const lines = collectNonEmptyLines(content)
  const startIndex = lines.findIndex((line) => labelPattern.test(line))

  if (startIndex === -1) {
    return ''
  }

  const fragments: string[] = []
  const inlineContent = lines[startIndex].replace(labelPattern, '').trim()

  if (inlineContent) {
    fragments.push(inlineContent)
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]

    if (stopPatterns.some((pattern) => pattern.test(line))) {
      break
    }

    fragments.push(line)
  }

  return fragments.join('\n').trim()
}

function isProjectEntryHeading(line: string) {
  return (
    (line.includes('|') || line.includes('｜')) &&
    /\d{4}[./-]\d{1,2}/.test(line)
  )
}

function extractProjectShortLabel(header: string) {
  const segments = header
    .split(/[|｜]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !/\d{4}[./-]\d{1,2}/.test(segment) && !/至今/.test(segment))

  return segments[1] ?? segments[0] ?? header.trim()
}

function splitProjectEntries(content: string) {
  const lines = collectNonEmptyLines(content)
  const entries: Array<{ header: string; lines: string[] }> = []
  let current: { header: string; lines: string[] } | null = null

  lines.forEach((line) => {
    if (isProjectEntryHeading(line)) {
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
        header: '未识别项目标题',
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
      shortLabel: extractProjectShortLabel(entry.header),
      lines: entry.lines,
      content: entry.lines.join('\n'),
      bodyCharCount: entry.lines.join('').length,
    }))
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

function splitWorkEntries(content: string) {
  const lines = collectNonEmptyLines(content)
  const entries: Array<{ header: string; lines: string[] }> = []
  let current: { header: string; lines: string[] } | null = null

  lines.forEach((line) => {
    if (isProjectEntryHeading(line)) {
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
        header: '未识别经历标题',
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
      shortLabel: extractProjectShortLabel(entry.header),
      lines: entry.lines,
      content: entry.lines.join('\n'),
      bodyCharCount: entry.lines.join('').length,
    }))
}

function buildSectionMetrics(markdown: string, sectionHints: SectionHint[]) {
  type MetricSignalValue =
    | boolean
    | number
    | string
    | string[]
    | Array<Record<string, boolean | number | string | string[]>>

  const metrics = Object.fromEntries(
    (Object.keys(sectionLabels) as ReviewSectionKey[]).map((key) => [
      key,
      {
        label: sectionLabels[key],
        present: false,
        charCount: 0,
        lineCount: 0,
        pointLikeLines: 0,
        probableEntryCount: 0,
        resultSignalCount: 0,
        responsibilitySignalCount: 0,
        heuristicFlags: [] as string[],
        hardRequirementSignals: {} as Record<string, MetricSignalValue>,
      },
    ]),
  ) as Record<
    ReviewSectionKey,
    {
      label: string
      present: boolean
      charCount: number
      lineCount: number
      pointLikeLines: number
      probableEntryCount: number
      resultSignalCount: number
      responsibilitySignalCount: number
      heuristicFlags: string[]
      hardRequirementSignals: Record<string, MetricSignalValue>
    }
  >

  const personalInfoContent =
    sectionHints.find((hint) => hint.key === 'personal_info')?.content ?? normalizeText(markdown)
  const nameCandidate = extractNameCandidate(markdown)

  const personalInfoSignals = {
    hasName: /^[\u4e00-\u9fa5A-Za-z·\s]{2,24}$/.test(nameCandidate),
    hasGender: /(^|[|｜\s])(男|女)(?=($|[|｜\s]))/.test(personalInfoContent),
    hasPhone: /(?<!\d)(?:\+?86[-\s]?)?1[3-9]\d(?:[\s-]?\d){8,}(?!\d)/.test(personalInfoContent),
    hasEmail: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(personalInfoContent),
    hasEducation: /(本科|硕士|博士|研究生|大专|MBA|EMBA)/.test(personalInfoContent),
    hasExpectedCity: /(期望城市|意向城市|求职城市|目标城市)/.test(personalInfoContent),
    hasExpectedSalary: /(期望薪资|薪资要求|期望月薪|期望年薪)/.test(personalInfoContent),
  }

  sectionHints.forEach((hint) => {
    const lines = collectNonEmptyLines(hint.content)
    const numberedLines = lines.filter((line) => /^(\d+[.、)]|[一二三四五六七八九十]+[、.])/.test(line)).length
    const bulletedLines = lines.filter((line) => /^[-*•]/.test(line)).length
    const bracketTitleLines = lines.filter((line) => /【[^】]+】/.test(line)).length
    const pointLikeLines = numberedLines + bulletedLines + bracketTitleLines
    const probableEntryCount =
      hint.key === 'work_experience' || hint.key === 'project_experience'
        ? lines.filter(
            (line) =>
              /\d{4}[./-]\d{1,2}/.test(line) ||
              /至今/.test(line) ||
              (line.includes('|') && line.length <= 80),
          ).length
        : 0
    const resultSignalCount = countMatches(
      hint.content,
      /(提升|下降|降低|增长|缩短|节省|覆盖|落地|上线|转化|准确率|效率|成本|预算|时长|耗时|金额|营收|ROI|CTR|CVR|GMV|复用|渗透|节约|减少|产出|价值|%|万)/g,
    )
    const responsibilitySignalCount = countMatches(
      hint.content,
      /(负责|主导|推进|设计|拆解|规划|协同|制定|搭建|对接|抽象|定义|落地|管理|复盘|分析|输出|优化|建设|承接|推动)/g,
    )

    const heuristicFlags: string[] = []
    const hardRequirementSignals: Record<string, MetricSignalValue> = {}

    if (hint.key === 'personal_info') {
      hardRequirementSignals.name = personalInfoSignals.hasName
      hardRequirementSignals.gender = personalInfoSignals.hasGender
      hardRequirementSignals.education = personalInfoSignals.hasEducation
      hardRequirementSignals.phone = personalInfoSignals.hasPhone
      hardRequirementSignals.email = personalInfoSignals.hasEmail
      hardRequirementSignals.forbiddenExpectedCity = personalInfoSignals.hasExpectedCity
      hardRequirementSignals.forbiddenExpectedSalary = personalInfoSignals.hasExpectedSalary

      if (
        !personalInfoSignals.hasName ||
        !personalInfoSignals.hasGender ||
        !personalInfoSignals.hasEducation ||
        !personalInfoSignals.hasPhone ||
        !personalInfoSignals.hasEmail
      ) {
        heuristicFlags.push('个人信息存在必填字段缺失风险：姓名/性别/学历/手机号/邮箱需齐全')
      }

      if (personalInfoSignals.hasExpectedCity) {
        heuristicFlags.push('个人信息出现了期望城市，属于不建议保留的信息')
      }

      if (personalInfoSignals.hasExpectedSalary) {
        heuristicFlags.push('个人信息出现了期望薪资，属于不建议保留的信息')
      }
    }

    if (hint.key === 'personal_strengths' && pointLikeLines > 0 && pointLikeLines < 8) {
      heuristicFlags.push('在线简历个人优势点数明显少于 8，存在内容偏薄风险')
    }

    if (hint.key === 'personal_strengths') {
      const mode = pointLikeLines >= 2 ? 'points' : 'paragraph'
      hardRequirementSignals.mode = mode
      hardRequirementSignals.recommendedPointCount = 8
      hardRequirementSignals.currentPointCount = pointLikeLines
      hardRequirementSignals.recommendedParagraphLineRange = '约4到5行'

      if (mode === 'paragraph' && (lines.length < 3 || lines.length > 6)) {
        heuristicFlags.push('个人优势若采用整段写法，当前长度不在推荐的约 4 行半范围内')
      }

      if (mode === 'points' && pointLikeLines < 8) {
        heuristicFlags.push('个人优势若采用分点写法，当前点数不足 8 点')
      }

      if (resultSignalCount > responsibilitySignalCount) {
        heuristicFlags.push('个人优势结果导向过重，职责与能力表达偏弱')
      }
    }

    if (hint.key === 'work_experience') {
      const workEntries = splitWorkEntries(hint.content).map((entry) => {
        const responsibilityPointCount = entry.lines.filter((line) =>
          /^([-*•]|\d+[.、)]|[一二三四五六七八九十]+[、.]|【[^】]+】)/.test(line),
        ).length
        const entryResultSignalCount = countMatches(
          entry.content,
          /(提升|下降|降低|增长|缩短|节省|覆盖|落地|上线|转化|准确率|效率|成本|预算|时长|耗时|金额|营收|ROI|CTR|CVR|GMV|复用|渗透|节约|减少|产出|价值|%|万)/g,
        )
        const hasBackgroundOrTeamSignal = /(背景|团队|协同|业务压力|团队情况|定位)/.test(entry.content)
        const entryFlags: string[] = []

        if (entry.bodyCharCount < 260) {
          entryFlags.push('单段经历字数偏少')
        }

        if (responsibilityPointCount < 3) {
          entryFlags.push('职责模块偏少')
        }

        if (!hasBackgroundOrTeamSignal) {
          entryFlags.push('缺少背景或团队信息')
        }

        if (entryResultSignalCount < 1) {
          entryFlags.push('缺少量化结果表达')
        }

        return {
          header: entry.header,
          shortLabel: entry.shortLabel,
          bodyCharCount: entry.bodyCharCount,
          responsibilityPointCount,
          resultSignalCount: entryResultSignalCount,
          hasBackgroundOrTeamSignal,
          heuristicFlags: entryFlags,
        }
      })

      hardRequirementSignals.minimumCharCount = 800
      hardRequirementSignals.currentCharCount = hint.content.length
      hardRequirementSignals.timelineFlags = analyzeTimeline(lines)
      hardRequirementSignals.workEntries = workEntries

      if (hint.content.length < 800) {
        heuristicFlags.push('工作经历总字数明显低于 800 字符，在线简历展开不足')
      }

      if (probableEntryCount > 0 && pointLikeLines < Math.max(3, probableEntryCount * 3)) {
        heuristicFlags.push('工作经历展开偏薄：职责模块数量偏少，不足以支撑在线简历阅读')
      }

      if (probableEntryCount > 0 && resultSignalCount < probableEntryCount) {
        heuristicFlags.push('工作经历结果信号偏弱：量化结果/业务价值表达不足')
      }

      if (responsibilitySignalCount < Math.max(3, probableEntryCount * 2)) {
        heuristicFlags.push('工作经历职责表达偏少：未充分讲清在公司期间主要负责什么')
      }

      const timelineFlags = hardRequirementSignals.timelineFlags
      if (Array.isArray(timelineFlags)) {
        heuristicFlags.push(...timelineFlags)
      }

      const weakWorkLabels = workEntries
        .filter((entry) => entry.heuristicFlags.length > 0)
        .map((entry) => `${entry.shortLabel}：${entry.heuristicFlags.join('、')}`)

      if (weakWorkLabels.length > 0) {
        heuristicFlags.push(`存在单段工作经历不达标：${weakWorkLabels.join('；')}`)
      }
    }

    if (hint.key === 'project_experience') {
      const backgroundLineCount = countLabeledBlockLines(
        hint.content,
        /^(项目背景|背景)[:：]?/,
        [/^(项目目标|目标|北极星|职责描述|核心职责|具体动作|项目结果|结果|成果)[:：]?/, /^#{1,6}\s/, /^【[^】]+】/],
      )
      const resultBulletCount = lines.filter(
        (line) =>
          /^([-*•]|\d+[.、)]|[一二三四五六七八九十]+[、.])/.test(line) &&
          /(提升|下降|降低|增长|缩短|节省|覆盖|落地|上线|转化|准确率|效率|成本|预算|时长|耗时|金额|营收|ROI|CTR|CVR|GMV|复用|渗透|节约|减少|产出|价值|%|万)/.test(
            line,
          ),
      ).length
      const hasGoalSignal = /(项目目标|目标|北极星|解决|痛点)/.test(hint.content)
      const hasActionSignal = /(职责描述|核心职责|具体动作|负责|主导|推进|设计|拆解|协同)/.test(
        hint.content,
      )
      const hasBackgroundSignal = /(项目背景|背景)/.test(hint.content)
      const projectEntries = splitProjectEntries(hint.content).map((entry) => {
        const backgroundLines = countLabeledBlockLines(
          entry.content,
          /^(项目背景|背景)[:：]?/,
          [/^(项目目标|目标|北极星|职责描述|核心职责|具体动作|项目结果|结果|成果)[:：]?/, /^【[^】]+】/],
        )
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
          entryFlags.push('单个项目字数明显偏少')
        }

        if (backgroundLines > 0 && (backgroundLines < 2 || backgroundLines > 4)) {
          entryFlags.push('项目背景不在推荐区间')
        }

        if (!goalText && !/(为解决|解决|痛点|目标|北极星)/.test(entry.content)) {
          entryFlags.push('缺少明确目标/痛点')
        }

        if (actionPointCount < 3) {
          entryFlags.push('职责动作展开不足')
        }

        if (resultPointCount < 3) {
          entryFlags.push('结果未形成 3 个量化点')
        }

        return {
          header: entry.header,
          shortLabel: entry.shortLabel,
          bodyCharCount: entry.bodyCharCount,
          backgroundLineCount: backgroundLines,
          actionPointCount,
          resultPointCount,
          heuristicFlags: entryFlags,
        }
      })

      hardRequirementSignals.minimumProjectCount = 2
      hardRequirementSignals.currentProjectCount = probableEntryCount
      hardRequirementSignals.backgroundLineCount = backgroundLineCount
      hardRequirementSignals.resultBulletCount = resultBulletCount
      hardRequirementSignals.hasGoalSignal = hasGoalSignal
      hardRequirementSignals.hasActionSignal = hasActionSignal
      hardRequirementSignals.hasBackgroundSignal = hasBackgroundSignal
      hardRequirementSignals.projectEntries = projectEntries

      if (probableEntryCount > 0 && probableEntryCount < 2) {
        heuristicFlags.push('项目经历少于 2 个项目，不满足基础要求')
      }

      if (probableEntryCount > 0 && pointLikeLines < Math.max(3, probableEntryCount * 3)) {
        heuristicFlags.push('项目经历展开偏薄：背景或职责模块数量不足')
      }

      if (probableEntryCount > 0 && resultSignalCount < probableEntryCount) {
        heuristicFlags.push('项目经历结果信号偏弱：量化结果/业务闭环表达不足')
      }

      if (backgroundLineCount > 0 && (backgroundLineCount < 2 || backgroundLineCount > 4)) {
        heuristicFlags.push('项目背景展开不在推荐区间：建议控制在约 2 行半到 4 行')
      }

      if (!hasGoalSignal) {
        heuristicFlags.push('项目经历缺少明确目标/北极星/痛点表达')
      }

      if (!hasActionSignal) {
        heuristicFlags.push('项目经历缺少明确动作/职责表达')
      }

      if (resultBulletCount < 3) {
        heuristicFlags.push('项目结果未形成 3 个量化分点')
      }

      const weakProjectLabels = projectEntries
        .filter((entry) => entry.heuristicFlags.length > 0)
        .map((entry) => `${entry.shortLabel}：${entry.heuristicFlags.join('、')}`)

      if (weakProjectLabels.length > 0) {
        heuristicFlags.push(`存在单个项目不达标：${weakProjectLabels.join('；')}`)
      }
    }

    metrics[hint.key] = {
      label: sectionLabels[hint.key],
      present: true,
      charCount: hint.content.length,
      lineCount: lines.length,
      pointLikeLines,
      probableEntryCount,
      resultSignalCount,
      responsibilitySignalCount,
      heuristicFlags,
      hardRequirementSignals,
    }
  })

  if (!metrics.personal_info.present) {
    metrics.personal_info.hardRequirementSignals = personalInfoSignals
  }

  return JSON.stringify(metrics, null, 2)
}

export function buildReviewUserPrompt(markdown: string, sectionHints: SectionHint[]) {
  return `以下是待批改的简历 Markdown 原文。请基于原文内容识别模块并完成批改。

【简历原文开始】
${markdown}
【简历原文结束】

以下是前端基于 Markdown 标题和关键词做的粗解析，仅作辅助参考，如果它有误，你应以原文实际内容为准：
${formatSectionHints(sectionHints)}

以下是前端做的在线简历“内容厚度/结果信号”辅助统计，仅作辅助参考，如果统计与原文冲突以原文为准；但如果这些信号已经明显提示“内容偏薄”，你不应忽略：
${buildSectionMetrics(markdown, sectionHints)}`
}
