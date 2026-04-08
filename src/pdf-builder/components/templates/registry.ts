import type { TemplateConfig } from '../../types'

export const templateConfigs: TemplateConfig[] = [
  { id: 'classic', name: '经典模板', description: '传统简约布局，适合大多数场景', category: 'professional' },
  { id: 'modern', name: '现代双栏', description: '左侧信息栏+右侧内容区', category: 'professional' },
  { id: 'left-right', name: '左右分栏', description: '均衡双栏，信息清晰', category: 'professional' },
  { id: 'timeline', name: '时间轴', description: '突出经历时间线', category: 'creative' },
  { id: 'minimalist', name: '极简', description: '大量留白，干净利落', category: 'minimal' },
  { id: 'elegant', name: '优雅', description: '精致排版，专业感强', category: 'professional' },
  { id: 'creative', name: '创意', description: '个性化布局，印象深刻', category: 'creative' },
  { id: 'editorial', name: '编辑风', description: '杂志编辑排版风格', category: 'professional' },
]

export function getTemplateConfig(id: string) {
  return templateConfigs.find(t => t.id === id) ?? templateConfigs[0]
}
