'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { askChatbot } from '@/services/chatbotService'
import {
  CHATBOT_DEFAULT_COORDINATES,
  CHATBOT_HISTORY_LIMIT,
  type ChatbotAskRequest,
  type ChatbotCoordinates,
  type ChatbotHistoryItem,
} from '@/lib/types/chatbot'

export type ChatbotMessage = {
  id: string
  sender_id: 'me' | 'resqbot'
  text: string
  created_at: string
  sender_name?: string
}

const DEFAULT_GREETING =
  "Hello, I’m resQbot 🤖. How can I assist you with disaster response today?"
const DEFAULT_ERROR_MESSAGE = 'Failed to reach resQbot. Please try again.'
const CHATBOT_REQUEST_TIMEOUT_MS = 30_000
const ENGAGEMENT_SEQUENCE = [
  'resQbot is analyzing your request…',
  'resQbot is gathering the latest response data…',
  'resQbot is preparing a detailed answer for you…',
]

const fallbackFormatTimestamp = (value: Date | string) =>
  typeof value === 'string' ? value : value.toISOString()

const CHATBOT_MESSAGE_LIMIT = 50

const isAbortError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false

  const { name, code } = error as { name?: string; code?: string }

  return name === 'CanceledError' || code === 'ERR_CANCELED'
}

export interface UseChatbotOptions {
  formatTimestamp?: (value: Date | string) => string
  initialMessage?: string
  errorMessage?: string
}

export interface UseChatbotResult {
  messages: ChatbotMessage[]
  sendMessage: (prompt: string) => Promise<void>
  isLoading: boolean
  error: string | null
  engagementMessage: string | null
  clearError: () => void
  reset: () => void
}

export const useChatbot = (options?: UseChatbotOptions): UseChatbotResult => {
  const { user } = useAuth()
  const { formatTimestamp, initialMessage, errorMessage } = options ?? {}

  const formatTimestampValue = useMemo(
    () => formatTimestamp ?? fallbackFormatTimestamp,
    [formatTimestamp],
  )

  const greeting = initialMessage ?? DEFAULT_GREETING
  const errorText = errorMessage ?? DEFAULT_ERROR_MESSAGE

  const [messages, setMessages] = useState<ChatbotMessage[]>(() => [
    {
      id: 'resqbot-initial',
      sender_id: 'resqbot',
      text: greeting,
      sender_name: 'resQbot',
      created_at: formatTimestampValue(new Date()),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [engagementMessage, setEngagementMessage] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<ChatbotCoordinates>(
    CHATBOT_DEFAULT_COORDINATES,
  )

  const abortControllerRef = useRef<AbortController | null>(null)
  const engagementTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const historyRef = useRef<ChatbotHistoryItem[]>([
    { role: 'assistant', content: greeting },
  ])

  const clearEngagementSequence = useCallback(() => {
    engagementTimeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    engagementTimeoutsRef.current = []
    setEngagementMessage(null)
  }, [])

  const startEngagementSequence = useCallback(() => {
    clearEngagementSequence()
    if (ENGAGEMENT_SEQUENCE.length === 0) return

    setEngagementMessage(ENGAGEMENT_SEQUENCE[0])

    ENGAGEMENT_SEQUENCE.slice(1).forEach((message, index) => {
      const timeoutId = setTimeout(() => {
        setEngagementMessage(message)
      }, (index + 1) * 5000)
      engagementTimeoutsRef.current.push(timeoutId)
    })
  }, [clearEngagementSequence])

  useEffect(() => {
    let active = true
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return () => {
        active = false
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!active) return
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        if (!active) return
        setCoordinates(CHATBOT_DEFAULT_COORDINATES)
      },
      { enableHighAccuracy: true, maximumAge: 60_000 },
    )

    return () => {
      active = false
    }
  }, [])

  const chatbotUser = useMemo<ChatbotAskRequest['user']>(
    () => ({
      id: user?.id ?? 'anonymous',
      name: user?.display_name ?? 'Guest',
      role: user?.role_id ?? 'guest',
      location: coordinates,
    }),
    [coordinates, user?.id, user?.display_name, user?.role_id],
  )

  const appendHistory = useCallback((item: ChatbotHistoryItem) => {
    historyRef.current = [...historyRef.current, item].slice(-CHATBOT_HISTORY_LIMIT)
  }, [])

  const appendMessage = useCallback((message: ChatbotMessage) => {
    setMessages((previous) => {
      const next = [...previous, message]
      return next.length > CHATBOT_MESSAGE_LIMIT
        ? next.slice(-CHATBOT_MESSAGE_LIMIT)
        : next
    })
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    historyRef.current = [{ role: 'assistant', content: greeting }]
    clearEngagementSequence()
    setMessages([
      {
        id: 'resqbot-initial',
        sender_id: 'resqbot',
        text: greeting,
        sender_name: 'resQbot',
        created_at: formatTimestampValue(new Date()),
      },
    ])
    setError(null)
    setIsLoading(false)
  }, [clearEngagementSequence, formatTimestampValue, greeting])

  const sendMessage = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim()
      if (!trimmed) return

      const outgoingTimestamp = new Date()
      const outgoing: ChatbotMessage = {
        id: `${outgoingTimestamp.getTime()}_user`,
        sender_id: 'me',
        text: trimmed,
        created_at: formatTimestampValue(outgoingTimestamp),
      }

      appendMessage(outgoing)
      appendHistory({ role: 'user', content: trimmed })
      setIsLoading(true)
      setError(null)
      startEngagementSequence()

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        console.info('Sending prompt to resQbot', {
          promptLength: trimmed.length,
          historyLength: historyRef.current.length,
        })
        const response = await askChatbot(
          {
            user: chatbotUser,
            prompt: trimmed,
            chat_history: historyRef.current,
          },
          { signal: controller.signal, timeoutMs: CHATBOT_REQUEST_TIMEOUT_MS },
        )

        const replyText = response.text || errorText
        const replyTimestamp = new Date()
        const reply: ChatbotMessage = {
          id: `${replyTimestamp.getTime()}_bot`,
          sender_id: 'resqbot',
          sender_name: 'resQbot',
          text: replyText,
          created_at: formatTimestampValue(replyTimestamp),
        }

        appendMessage(reply)
        clearEngagementSequence()
        console.info('Received response from resQbot', {
          hasText: Boolean(response.text?.trim()),
          textLength: response.text?.length ?? 0,
        })
        if (response.text.trim().length > 0) {
          appendHistory({ role: 'assistant', content: response.text })
        }
      } catch (err) {
        if (isAbortError(err)) {
          clearEngagementSequence()
          return
        }
        console.error('Failed to reach resQbot', {
          error: err,
          promptLength: trimmed.length,
        })
        setError(errorText)
        const errorTimestamp = new Date()
        const failureReply: ChatbotMessage = {
          id: `${errorTimestamp.getTime()}_bot_error`,
          sender_id: 'resqbot',
          sender_name: 'resQbot',
          text: errorText,
          created_at: formatTimestampValue(errorTimestamp),
        }
        appendMessage(failureReply)
        clearEngagementSequence()
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }
        setIsLoading(false)
      }
    },
    [
      appendHistory,
      appendMessage,
      chatbotUser,
      clearEngagementSequence,
      errorText,
      formatTimestampValue,
      startEngagementSequence,
    ],
  )

  useEffect(() => () => clearEngagementSequence(), [clearEngagementSequence])

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    engagementMessage,
    clearError,
    reset,
  }
}
