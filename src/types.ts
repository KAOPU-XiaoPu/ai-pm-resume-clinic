export const reviewSectionKeys = [
  'personal_info',
  'personal_strengths',
  'work_experience',
  'project_experience',
] as const

export type ReviewSectionKey = (typeof reviewSectionKeys)[number]
export type ReviewMode = 'read' | 'edit'
export type ReviewState = 'idle' | 'loading' | 'success' | 'error'
export type ReviewIssueSeverity = 'high' | 'medium' | 'low'
export type ReviewSectionStatus = 'pass' | 'issue' | 'missing'

export interface ReviewIssue {
  id: string
  title: string
  reason: string
  fix: string
  severity: ReviewIssueSeverity
  evidenceSnippets: string[]
}

export interface ReviewSectionResult {
  key: ReviewSectionKey
  label: string
  status: ReviewSectionStatus
  summary: string
  issues: ReviewIssue[]
}

export interface ReviewReport {
  overallScore: number
  overallVerdict: string
  overallSummary: string
  sections: Record<ReviewSectionKey, ReviewSectionResult>
  model: string
  reviewedAt: string
  sourceDigest: string
}

export interface SectionHint {
  key: ReviewSectionKey
  heading: string
  content: string
}

export interface ReviewSectionDraft {
  status?: string
  summary?: string
  issues?: Array<{
    title?: string
    reason?: string
    fix?: string
    severity?: string
    evidenceSnippets?: unknown
  }>
}

export interface ReviewDraft {
  overallScore?: number
  overallVerdict?: string
  overallSummary?: string
  sections?: Partial<Record<ReviewSectionKey, ReviewSectionDraft>>
}

export interface ModelOption {
  id: string
  label: string
  shortLabel: string
}
