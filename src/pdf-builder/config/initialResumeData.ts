import type { ResumeData, GlobalSettings, MenuSection, PhotoConfig } from '../types'

export const defaultPhotoConfig: PhotoConfig = {
  width: 140,
  height: 140,
  borderRadius: 'full',
  customBorderRadius: 0,
  visible: false,
}

export const defaultGlobalSettings: GlobalSettings = {
  themeColor: '#1a1a1a',
  fontFamily: "'Noto Sans SC', sans-serif",
  fontSize: 9,
  lineHeight: 1.6,
  pagePadding: 36,
  sectionSpacing: 16,
  paragraphSpacing: 8,
  headerSize: 16,
  subheaderSize: 12,
  useIconMode: false,
  centerSubtitle: false,
  autoOnePage: false,
}

export const defaultMenuSections: MenuSection[] = [
  { id: 'basicInfo', title: '基本信息', enabled: true, order: 0 },
  { id: 'skills', title: '个人优势', enabled: true, order: 1 },
  { id: 'experience', title: '工作经历', enabled: true, order: 2 },
  { id: 'projects', title: '项目经历', enabled: true, order: 3 },
  { id: 'education', title: '教育经历', enabled: false, order: 4 },
  { id: 'certificates', title: '证书资质', enabled: false, order: 5 },
]

export function createEmptyResumeData(): ResumeData {
  return {
    basicInfo: {
      name: '',
      title: '',
      phone: '',
      email: '',
      age: '',
      gender: '',
      location: '',
      website: '',
      education: '',
      university: '',
      major: '',
      workYears: '',
      avatarUrl: '',
      photo: '',
      photoConfig: { ...defaultPhotoConfig },
      customFields: [],
    },
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certificates: [],
    customSections: [],
    menuSections: [...defaultMenuSections],
    globalSettings: { ...defaultGlobalSettings },
  }
}

export const sampleResumeData: ResumeData = {
  basicInfo: {
    name: '张仁溥',
    title: 'AI 产品经理',
    phone: '176 3825 9086',
    email: 'z17638259086@gmail.com',
    age: '24岁',
    gender: '男',
    location: '',
    website: 'https://kaopu-xiaopu.github.io/XIAOPU/index.html',
    education: '本科',
    university: '河南师范大学',
    major: '产品设计',
    workYears: '2年',
    avatarUrl: '',
    photo: '',
    photoConfig: { ...defaultPhotoConfig },
    customFields: [],
  },
  skills: [
    {
      id: '1',
      name: 'AI产品全链路经验',
      description:
        '具备从0到1搭建AI-SaaS平台的完整经验，深刻理解AIGC技术在业务场景中的应用与产品化路径',
    },
    {
      id: '2',
      name: '多模态模型产品化',
      description:
        '精通多模态大模型的训练与应用，主导设计了从数据预处理、模型微调到效果评测的全流程SOP',
    },
    {
      id: '3',
      name: '流程节点赋能提效',
      description:
        '擅长将复杂业务问题拆分为多个节点，通过制定模型评估规则和策略，有效保障AI模型质量',
    },
    {
      id: '4',
      name: '业务场景垂直落地',
      description:
        '能敏锐洞察业务痛点，并提出可落地的产品解决方案，直接驱动业务降本增效',
    },
  ],
  experience: [
    {
      id: '1',
      company: '阿里淘天集团',
      position: 'AI模型质量保障专家',
      startDate: '2025.01',
      endDate: '至今',
      highlights: [
        '【上游需求承接与任务拆解】深度参与算法团队的需求评审，将算法目标拆解为可执行的数据标注需求和评测维度',
        '【横向产品需求挖掘与研发】主动发掘并推动多个内部提效工具的产品化，独立设计并推动了"基于ELO算法的项目难度排行榜"',
      ],
    },
    {
      id: '2',
      company: '蚂蚁金服',
      position: 'AI产品设计工程师',
      startDate: '2023.11',
      endDate: '2025.01',
      highlights: [
        '从0到1主导"万花筒AI服务平台"的整体规划与建设',
        '【平台顶层设计与规划】规划AI服务平台从探索期到深化期的演进路线图',
        '【核心功能模块产品化】负责将抽象AI能力具体化为用户可感知的功能模块',
      ],
    },
  ],
  projects: [
    {
      id: '1',
      name: '智能生卡项目',
      role: '公司AIGC项目',
      startDate: '2024.10',
      endDate: '2025.01',
      description:
        '传统卡片生产模式无法满足业务需求，通过引入AIGC技术实现端到端智能化生成',
      highlights: [
        '【产品方案构思】设计全链路生成框架',
        '【标签体系构造】建立多维度标签体系',
        '【GC工作流设计】构建三模型协同的卡片生成工作流',
        '模型布局合理性评分达8.2/10分，图文匹配准确率92%',
        '推动5条核心业务线落地，累计生成卡片素材超200张',
      ],
    },
  ],
  education: [],
  certificates: [],
  customSections: [],
  menuSections: [
    { id: 'basicInfo', title: '基本信息', enabled: true, order: 0 },
    { id: 'skills', title: '个人优势', enabled: true, order: 1 },
    { id: 'experience', title: '工作经历', enabled: true, order: 2 },
    { id: 'projects', title: '项目经历', enabled: true, order: 3 },
  ],
  globalSettings: {
    themeColor: '#1a1a1a',
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: 9,
    lineHeight: 1.5,
    pagePadding: 32,
    sectionSpacing: 12,
    paragraphSpacing: 8,
    headerSize: 16,
    subheaderSize: 12,
    useIconMode: false,
    centerSubtitle: false,
    autoOnePage: false,
  },
}
