import type { PdfResumeData } from './types'

export const sampleResumeData: PdfResumeData = {
  basicInfo: {
    name: '张仁溥',
    gender: '男',
    age: '24岁',
    phone: '176 3825 9086',
    email: 'z17638259086@gmail.com',
    education: '本科',
    university: '河南师范大学',
    major: '产品设计',
    workYears: '2年',
    jobTarget: 'AI 产品经理',
    website: '',
  },
  strengths: [
    { id: '1', content: 'AI产品全链路经验：具备从0到1搭建AI-SaaS平台的完整经验，深刻理解AIGC技术在业务场景中的应用与产品化路径' },
    { id: '2', content: '多模态模型产品化：精通多模态大模型的训练与应用，主导设计了从数据预处理、模型微调到效果评测的全流程SOP' },
    { id: '3', content: '流程节点赋能提效：擅长将复杂业务问题拆分为多个节点，通过制定模型评估规则和策略，有效保障AI模型质量' },
    { id: '4', content: '业务场景垂直落地：能敏锐洞察业务痛点，并提出可落地的产品解决方案，直接驱动业务降本增效' },
  ],
  workExperience: [
    {
      id: '1',
      company: '阿里淘天集团',
      title: 'AI模型质量保障专家',
      startDate: '2025.01',
      endDate: '至今',
      content: '【上游需求承接与任务拆解】深度参与算法团队的需求评审，将算法目标拆解为可执行的数据标注需求和评测维度\n【横向产品需求挖掘与研发】主动发掘并推动多个内部提效工具的产品化，独立设计并推动了"基于ELO算法的项目难度排行榜"',
    },
    {
      id: '2',
      company: '蚂蚁金服',
      title: 'AI产品设计工程师',
      startDate: '2023.11',
      endDate: '2025.01',
      content: '从0到1主导"万花筒AI服务平台"的整体规划与建设\n【平台顶层设计与规划】规划AI服务平台从探索期到深化期的演进路线图\n【核心功能模块产品化】负责将抽象AI能力具体化为用户可感知的功能模块',
    },
  ],
  projectExperience: [
    {
      id: '1',
      name: '智能生卡项目',
      tag: '公司AIGC项目',
      startDate: '2024.10',
      endDate: '2025.01',
      background: '传统卡片生产模式无法满足业务需求，通过引入AIGC技术实现端到端智能化生成',
      responsibilities: '【产品方案构思】设计全链路生成框架\n【标签体系构造】建立多维度标签体系\n【GC工作流设计】构建三模型协同的卡片生成工作流',
      results: '模型布局合理性评分达8.2/10分，图文匹配准确率92%\n推动5条核心业务线落地，累计生成卡片素材超200张\n某财富产品展位CTR提升30.62%，月度转化用户增长15%',
    },
  ],
}
