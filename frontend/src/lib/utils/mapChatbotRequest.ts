import {
  CHATBOT_DEFAULT_COORDINATES,
  CHATBOT_HISTORY_LIMIT,
  ChatbotAskRequest,
  ChatbotAskRequestSchema,
  ChatbotHistoryItem,
} from '@/lib/types/chatbot'

const trimHistory = (history: ChatbotHistoryItem[]): ChatbotHistoryItem[] =>
  history
    .filter((item) => item?.content?.trim().length)
    .slice(-CHATBOT_HISTORY_LIMIT)
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }))

export const mapChatbotRequest = (payload: ChatbotAskRequest): ChatbotAskRequest => {
  const location = payload.user.location ?? CHATBOT_DEFAULT_COORDINATES

  const mappedPayload: ChatbotAskRequest = {
    user: {
      ...payload.user,
      location: {
        latitude: Number.isFinite(location.latitude)
          ? location.latitude
          : CHATBOT_DEFAULT_COORDINATES.latitude,
        longitude: Number.isFinite(location.longitude)
          ? location.longitude
          : CHATBOT_DEFAULT_COORDINATES.longitude,
      },
    },
    prompt: payload.prompt.trim(),
    chat_history: trimHistory(payload.chat_history ?? []),
  }

  const parsed = ChatbotAskRequestSchema.safeParse(mappedPayload)

  if (!parsed.success) {
    throw new Error(`Invalid chatbot request payload: ${parsed.error.message}`)
  }

  return parsed.data
}
