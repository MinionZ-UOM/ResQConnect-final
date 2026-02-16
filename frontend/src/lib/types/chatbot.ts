import { z } from 'zod'

export const ChatbotCoordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
})

export type ChatbotCoordinates = z.infer<typeof ChatbotCoordinatesSchema>

export const CHATBOT_DEFAULT_COORDINATES: ChatbotCoordinates = {
  latitude: 0,
  longitude: 0,
}

export const ChatbotRoleSchema = z.enum(['user', 'assistant', 'system'])

export type ChatbotRole = z.infer<typeof ChatbotRoleSchema>

export const ChatbotHistoryItemSchema = z.object({
  role: ChatbotRoleSchema,
  content: z.string().trim().min(1),
})

export type ChatbotHistoryItem = z.infer<typeof ChatbotHistoryItemSchema>

export const ChatbotUserSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  location: ChatbotCoordinatesSchema,
})

export type ChatbotUserPayload = z.infer<typeof ChatbotUserSchema>

export const CHATBOT_HISTORY_LIMIT = 12

export const ChatbotAskRequestSchema = z.object({
  user: ChatbotUserSchema,
  prompt: z.string().trim().min(1),
  chat_history: z.array(ChatbotHistoryItemSchema).default([]),
})

export type ChatbotAskRequest = z.infer<typeof ChatbotAskRequestSchema>

export const ChatbotStructuredResponseSchema = z
  .object({
    message: z.string().optional(),
    reply: z.string().optional(),
    response: z.string().optional(),
    text: z.string().optional(),
    content: z.string().optional(),
  })
  .catchall(z.unknown())

export type ChatbotStructuredResponse = z.infer<typeof ChatbotStructuredResponseSchema>

export const ChatbotAskResponseSchema = z.union([
  z.string(),
  ChatbotStructuredResponseSchema,
])

export type ChatbotAskResponse = z.infer<typeof ChatbotAskResponseSchema>

export type ChatbotNormalizedResponse = {
  text: string
  raw: ChatbotAskResponse
  structured: ChatbotStructuredResponse | null
}

export type ChatbotAskOptions = {
  signal?: AbortSignal
  timeoutMs?: number
}
