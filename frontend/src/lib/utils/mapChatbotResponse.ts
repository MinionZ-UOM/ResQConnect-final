import {
  ChatbotAskResponse,
  ChatbotAskResponseSchema,
  ChatbotNormalizedResponse,
  ChatbotStructuredResponse,
} from '@/lib/types/chatbot'

const RESPONSE_PREFERENCE_ORDER: Array<keyof ChatbotStructuredResponse> = [
  'message',
  'reply',
  'response',
  'text',
  'content',
]

const extractStructuredText = (
  payload: ChatbotStructuredResponse,
): string => {
  for (const key of RESPONSE_PREFERENCE_ORDER) {
    const value = payload[key]
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }
  }

  return ''
}

export const mapChatbotResponse = (
  data: ChatbotAskResponse,
): ChatbotNormalizedResponse => {
  const parsed = ChatbotAskResponseSchema.safeParse(data)

  if (!parsed.success) {
    return { text: '', raw: data, structured: null }
  }

  const payload = parsed.data

  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    return {
      text: trimmed,
      raw: payload,
      structured: null,
    }
  }

  const text = extractStructuredText(payload)

  return {
    text,
    raw: payload,
    structured: payload,
  }
}
