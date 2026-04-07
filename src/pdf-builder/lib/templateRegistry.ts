import type { ColorScheme, TemplateConfig } from '../types'

export const templates: TemplateConfig[] = [
  { id: 'classic', name: '经典模板', description: '传统简约的简历布局，适合大多数场景' },
  { id: 'modern', name: '双栏模板', description: '左侧信息栏+右侧内容区的现代布局' },
  { id: 'timeline', name: '时间轴模板', description: '突出经历时间的时间轴风格' },
  { id: 'minimalist', name: '极简模板', description: '大量留白，干净利落的排版风格' },
]

export const colorSchemes: ColorScheme[] = [
  { id: 'dark', name: '经典黑', primary: '#1a1a1a', secondary: '#4b5563', accent: '#1a1a1a' },
  { id: 'blue', name: '商务蓝', primary: '#1e40af', secondary: '#3b82f6', accent: '#1e40af' },
  { id: 'green', name: '清新绿', primary: '#166534', secondary: '#22c55e', accent: '#166534' },
  { id: 'purple', name: '优雅紫', primary: '#6b21a8', secondary: '#a855f7', accent: '#6b21a8' },
  { id: 'orange', name: '活力橙', primary: '#c2410c', secondary: '#f97316', accent: '#c2410c' },
  { id: 'slate', name: '高级灰', primary: '#475569', secondary: '#94a3b8', accent: '#475569' },
]

export function getTemplate(id: string) {
  return templates.find((t) => t.id === id) ?? templates[0]
}

export function getColorScheme(id: string) {
  return colorSchemes.find((c) => c.id === id) ?? colorSchemes[0]
}
