import type { ModelOption, ReviewIssueSeverity, ReviewSectionKey } from '../types'

export const sectionLabels: Record<ReviewSectionKey, string> = {
  personal_info: '个人信息',
  personal_strengths: '个人优势',
  work_experience: '工作经历',
  project_experience: '项目经历',
}

export const sectionOrder: ReviewSectionKey[] = [
  'personal_info',
  'personal_strengths',
  'work_experience',
  'project_experience',
]

export const severityLabels: Record<ReviewIssueSeverity, string> = {
  high: '高优先',
  medium: '中优先',
  low: '低优先',
}

export const reviewModelOptions: ModelOption[] = [
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    shortLabel: 'Claude Sonnet 4.6',
  },
  {
    id: 'gpt-5.4-mini',
    label: 'GPT-5.4 Mini',
    shortLabel: 'GPT-5.4 Mini',
  },
  {
    id: 'gemini-3.1-flash-lite-preview',
    label: 'Gemini 3.1 Flash Lite',
    shortLabel: 'Gemini 3.1 Flash Lite',
  },
]

export const defaultModelId = 'gpt-5.4-mini'
export const defaultOptimizeModelId = 'gpt-5.4-mini'

export const providerFallbackModelIds = [
  'claude-sonnet-4-6',
  'gpt-5.4-mini',
  'gemini-3.1-flash-lite-preview',
] as const

export const reviewRules = [
  '个人信息区必须至少包含：姓名、性别、学历、手机号、邮箱。',
  '个人信息区中，年龄、所在地、籍贯、个人网站等属于次要信息，有没有都行，不作为硬性扣分项。',
  '个人信息区禁止出现：期望城市、期望薪资。',
  '全简历禁止出现概念解释类括号写法，例如“大模型（LLM）”；这会显得像科普说明，不像求职表达。',
  '全简历禁止用英文双引号包裹关键词，例如"工作流体系"；中文简历中这类写法不专业。',
  '全简历禁止出现“擅长/熟练掌握/精通某个模型”这类表述，例如“熟练掌握GPT-4o”；重点应写你如何把模型能力落到产品和业务中。',
  '个人信息区只保留与投递直接相关的信息：学校/专业、工作年限、求职意向、个人网站/作品集等可以保留，但不要让弱相关信息抢占注意力。',
  '最好把“工作年限 + 求职意向”直接写进基本信息行，让 HR 一秒锁定定位。',
  '当前默认批改场景是招聘平台在线简历，不是一页纸 PDF 简历；不要把“过度精简”当成优点。',
  '个人优势允许两种写法：一整段时建议控制在约 4 行半；分点写法时至少 8 点，每点最好是“小标题 + 一行半正文”。',
  '个人优势内容应突出职责、能力和优势本身，而不是把结果/量化指标当成主体；如果只有结果没有职责能力，应明确指出。',
  '工作经历必须按倒序写，最近经历在前。',
  '每段工作经历必须写清：公司名称、职位名称、在职周期。',
  '工作经历模块内容总量应达到在线简历可读厚度，通常至少 800 字符；若明显不足，应直接指出“内容偏薄/展开不足”。',
  '工作经历必须讲清：业务背景、团队情况、在公司期间主要负责什么（职责/业务/项目）、业绩成果（量化指标和具体贡献）。',
  '多段工作经历不得出现时间线错误，包括倒序错误、结束时间早于开始时间、上下段衔接明显不合理。',
  '项目经历至少写 2 个项目。',
  '项目经历必须尽量按 STAR 法则撰写，讲清项目背景、目标、具体动作、项目结果。',
  '项目背景建议控制在约 2 行半到 4 行之间；目标要说清北极星指标或项目解决的核心痛点。',
  '具体动作本质上是在讲你的职责，可以是段落，也可以分点；若分点，优先用“小标题 + 正文”。',
  '项目结果必须至少有 3 个分点，且尽量量化。',
  'AI 产品经理简历重点不是“用了什么 AI 工具”，而是“如何把 AI 能力产品化并落到业务结果”。',
  '如果某个模块整体没有明显问题，直接判定通过，不要为了凑问题而硬挑刺。',
  '如果个人优势、工作经历、项目经历出现“在线简历内容过少”的问题，不要轻易给出 90 分以上高分。',
  '问题描述要具体、可操作，修改建议要能直接指导学生改简历。',
]
