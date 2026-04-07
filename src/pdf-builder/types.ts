export interface PdfBasicInfo {
  name: string
  gender: string
  age: string
  phone: string
  email: string
  education: string
  university: string
  major: string
  workYears: string
  jobTarget: string
  website: string
}

export interface PdfStrengthPoint {
  id: string
  content: string
}

export interface PdfWorkEntry {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  content: string
}

export interface PdfProjectEntry {
  id: string
  name: string
  tag: string
  startDate: string
  endDate: string
  background: string
  responsibilities: string
  results: string
}

export interface PdfResumeData {
  basicInfo: PdfBasicInfo
  strengths: PdfStrengthPoint[]
  workExperience: PdfWorkEntry[]
  projectExperience: PdfProjectEntry[]
}

export type TemplateId = 'classic' | 'modern' | 'timeline' | 'minimalist'

export interface ColorScheme {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
}

export interface TemplateConfig {
  id: TemplateId
  name: string
  description: string
}
