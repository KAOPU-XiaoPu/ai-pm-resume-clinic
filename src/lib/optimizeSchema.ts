export const optimizeResponseSchema = {
  name: 'ai_pm_resume_optimize',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      optimizedMarkdown: {
        type: 'string',
      },
    },
    required: ['optimizedMarkdown'],
    additionalProperties: false,
  },
} as const
