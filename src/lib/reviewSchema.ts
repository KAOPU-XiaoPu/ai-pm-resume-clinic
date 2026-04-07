export const reviewResponseSchema = {
  name: 'ai_pm_resume_review',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      overallScore: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
      },
      overallVerdict: {
        type: 'string',
      },
      overallSummary: {
        type: 'string',
      },
      sections: {
        type: 'object',
        properties: {
          personal_info: createSectionSchema(),
          personal_strengths: createSectionSchema(),
          work_experience: createSectionSchema(),
          project_experience: createSectionSchema(),
        },
        required: [
          'personal_info',
          'personal_strengths',
          'work_experience',
          'project_experience',
        ],
        additionalProperties: false,
      },
    },
    required: ['overallScore', 'overallVerdict', 'overallSummary', 'sections'],
    additionalProperties: false,
  },
} as const

function createSectionSchema() {
  return {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pass', 'issue', 'missing'],
      },
      summary: {
        type: 'string',
      },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            reason: { type: 'string' },
            fix: { type: 'string' },
            severity: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
            },
            evidenceSnippets: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 2,
            },
          },
          required: ['title', 'reason', 'fix', 'severity', 'evidenceSnippets'],
          additionalProperties: false,
        },
      },
    },
    required: ['status', 'summary', 'issues'],
    additionalProperties: false,
  } as const
}

