// ── Photo configuration ─────────────────────────────────────────────────────

export interface PhotoConfig {
  width: number
  height: number
  borderRadius: 'none' | 'medium' | 'full' | 'custom'
  customBorderRadius: number
  visible: boolean
}

// ── Custom fields for basic info ────────────────────────────────────────────

export interface CustomField {
  id: string
  label: string
  value: string
  icon: string
}

// ── Basic info ──────────────────────────────────────────────────────────────

export interface BasicInfo {
  name: string
  title: string // 求职意向 e.g. "AI 产品经理"
  phone: string
  email: string
  age: string
  gender: string
  location: string
  website: string
  education: string // 学历 e.g. "本科"
  university: string
  major: string
  workYears: string // e.g. "2年"
  avatarUrl: string
  photo: string // base64 or URL
  photoConfig: PhotoConfig
  customFields: CustomField[]
  fieldOrder?: string[] // optional, for field reordering
}

// ── Experience ──────────────────────────────────────────────────────────────

export interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  highlights: string[]
}

// ── Project ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  role: string // project tag e.g. "公司AIGC项目"
  startDate: string
  endDate: string
  description: string // background
  highlights: string[] // responsibilities + results mixed
}

// ── Education ───────────────────────────────────────────────────────────────

export interface Education {
  id: string
  school: string
  degree: string
  major: string
  startDate: string
  endDate: string
  description: string
}

// ── Skill ───────────────────────────────────────────────────────────────────

export interface Skill {
  id: string
  name: string // 能力标签 e.g. "AI产品全链路经验"
  description: string // 详细描述
}

// ── Certificate / credential ────────────────────────────────────────────────

export interface Certificate {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

// ── Custom section (user-created) ───────────────────────────────────────────

export interface CustomSectionItem {
  id: string
  title: string
  subtitle: string
  dateRange: string
  description: string
  visible: boolean
}

export interface CustomSection {
  id: string
  title: string
  items: CustomSectionItem[]
}

// ── Sections menu ───────────────────────────────────────────────────────────

export type SectionId =
  | 'basicInfo'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certificates'
  | string

export interface MenuSection {
  id: SectionId
  title: string
  enabled: boolean
  order: number
}

// ── Global settings ─────────────────────────────────────────────────────────

export interface GlobalSettings {
  themeColor: string
  fontFamily: string
  fontSize: number
  lineHeight: number
  pagePadding: number
  sectionSpacing: number
  paragraphSpacing: number
  headerSize: number
  subheaderSize: number
  useIconMode: boolean
  centerSubtitle: boolean
  autoOnePage: boolean
}

// ── Resume data (root) ──────────────────────────────────────────────────────

export interface ResumeData {
  basicInfo: BasicInfo
  skills: Skill[]
  experience: Experience[]
  projects: Project[]
  education: Education[]
  certificates: Certificate[]
  customSections: CustomSection[]
  menuSections: MenuSection[]
  globalSettings: GlobalSettings
}
