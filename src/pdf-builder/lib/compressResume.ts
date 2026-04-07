import { sendChatCompletion, getStoredApiKey } from '../../lib/openrouter'
import type { PdfResumeData } from '../types'
import { compressionResponseSchema } from './compressionSchema'
import {
  compressionSystemPrompt,
  buildCompressionUserPrompt,
} from './compressionPrompt'

export async function compressResumeForPdf(
  markdown: string,
  model: string,
): Promise<PdfResumeData> {
  if (!getStoredApiKey()) {
    throw new Error('请先设置 API Key')
  }

  const data = await sendChatCompletion({
    model,
    temperature: 0.2,
    stream: false,
    messages: [
      { role: 'system', content: compressionSystemPrompt },
      { role: 'user', content: buildCompressionUserPrompt(markdown) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: compressionResponseSchema,
    },
  })

  const content = (data as Record<string, unknown[]> | null)?.choices?.[0] as
    | { message?: { content?: string } }
    | undefined
  const raw = content?.message?.content
  if (!raw) {
    throw new Error('AI 返回为空')
  }

  const parsed = JSON.parse(raw) as PdfResumeData

  if (
    !parsed.basicInfo?.name ||
    !parsed.strengths ||
    !parsed.workExperience ||
    !parsed.projectExperience
  ) {
    throw new Error('AI 返回的数据结构不完整')
  }

  return parsed
}
