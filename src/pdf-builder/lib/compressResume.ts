import { sendChatCompletion, getStoredApiKey } from '../../lib/openrouter'
import type { ResumeData } from '../types'
import { defaultMenuSections, defaultGlobalSettings } from '../config/initialResumeData'
import { compressionResponseSchema } from './compressionSchema'
import {
  compressionSystemPrompt,
  buildCompressionUserPrompt,
} from './compressionPrompt'

export async function compressResumeForPdf(
  markdown: string,
  model: string,
): Promise<ResumeData> {
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

  const parsed = JSON.parse(raw) as Omit<ResumeData, 'menuSections' | 'globalSettings'>

  if (
    !parsed.basicInfo?.name ||
    !parsed.skills ||
    !parsed.experience ||
    !parsed.projects
  ) {
    throw new Error('AI 返回的数据结构不完整')
  }

  // Inject client-only defaults that AI does not generate
  const resumeData: ResumeData = {
    ...parsed,
    education: parsed.education ?? [],
    menuSections: [...defaultMenuSections],
    globalSettings: { ...defaultGlobalSettings },
  }

  return resumeData
}
