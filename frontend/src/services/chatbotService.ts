import { apiPost } from '@/lib/http'
import type { ChatbotAskRequest, ChatbotNormalizedResponse, ChatbotAskResponse, ChatbotAskOptions } from '@/lib/types/chatbot'
import { mapChatbotRequest } from '@/lib/utils/mapChatbotRequest'
import { mapChatbotResponse } from '@/lib/utils/mapChatbotResponse'

export const askChatbot = async (
  payload: ChatbotAskRequest,
  options?: ChatbotAskOptions,
): Promise<ChatbotNormalizedResponse> => {
  const response = await apiPost<ChatbotAskResponse>(
    '/chatbot/ask',
    mapChatbotRequest(payload),
    { signal: options?.signal, timeout: options?.timeoutMs },
  )

  return mapChatbotResponse(response)
}
