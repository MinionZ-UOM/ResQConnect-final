"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Send, Plus, Users, Bot, Loader2 } from "lucide-react"
import type { JoinedResponse } from "@/lib/types/disaster"
import { checkJoinedStatus, getDisasters } from "@/services/disasterService"
import { getChatMessages, sendChatMessage } from "@/services/chatService"
import { getUserDisplayName } from "@/services/userService"
import { useChatbot } from "@/hooks/useChatbot"
import ChatbotThinkingIndicator from "@/components/chatbot-thinking-indicator"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  sender_id: string
  sender_name?: string
  text: string
  created_at: string
}

type DisasterChat = {
  id: string
  name: string
  role?: JoinedResponse["role"]
}

type ChatTarget = DisasterChat & { chat_session_id?: string | null }

type ApiChatMessage = Awaited<ReturnType<typeof getChatMessages>>[number]

const formatTimestamp = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const normalizeChatbotText = (text: string) =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/(^|[^\n])(\d+\.\s)/g, (_match, prefix, listItem) =>
      prefix ? `${prefix}\n${listItem}` : listItem,
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim()

export default function ChatTab() {
  const [disasters, setDisasters] = useState<DisasterChat[]>([])
  const [active, setActive] = useState<ChatTarget | null>(null)
  const [messagesByDisaster, setMessagesByDisaster] = useState<Record<string, Message[]>>({})
  const [text, setText] = useState("")
  const [loadingDisasters, setLoadingDisasters] = useState(true)
  const [loadingMessagesFor, setLoadingMessagesFor] = useState<string | null>(null)
  const [disasterError, setDisasterError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({})
  const endRef = useRef<HTMLDivElement>(null)

  const {
    messages: resqbotMessages,
    sendMessage: sendChatbotMessage,
    isLoading: chatbotLoading,
    error: chatbotError,
    engagementMessage: chatbotEngagementMessage,
    clearError: clearChatbotError,
  } = useChatbot({ formatTimestamp })

  const resqbotTarget = useMemo<ChatTarget>(
    () => ({ id: "resqbot", name: "resQbot" }),
    [],
  )

  const mapApiMessage = useCallback(
    (message: ApiChatMessage): Message => ({
      id: message.id,
      sender_id: message.senderId ?? "user",
      sender_name: message.senderName,
      text: message.text,
      created_at: formatTimestamp(message.createdAt),
    }),
    [],
  )

  useEffect(() => {
    let isMounted = true

    const loadDisasters = async () => {
      setLoadingDisasters(true)
      setDisasterError(null)
      try {
        const allDisasters = await getDisasters()
        const registeredDisasters = allDisasters.filter(
          (disaster) => disaster.status === "Registered",
        )

        const joinedStatuses = await Promise.all(
          registeredDisasters.map(async (disaster) => {
            try {
              return await checkJoinedStatus(disaster.id)
            } catch (statusError) {
              console.error("Failed to check joined status", statusError)
              return { joined: false } satisfies JoinedResponse
            }
          }),
        )

        if (!isMounted) return

        const joinedDisasters = registeredDisasters.reduce<DisasterChat[]>(
          (accumulator, disaster, index) => {
            const status = joinedStatuses[index]
            if (status?.joined) {
              accumulator.push({
                id: disaster.id,
                name: disaster.name,
                role: status.role,
              })
            }
            return accumulator
          },
          [],
        )

        setDisasters(joinedDisasters)
        setActive((current) => {
          if (!current) return joinedDisasters[0] ?? null
          if (current.id === "resqbot") return current
          return joinedDisasters.find((item) => item.id === current.id) ?? null
        })
      } catch (err) {
        if (!isMounted) return
        console.error("Failed to load disasters", err)
        setDisasterError("Failed to load disasters. Please try again.")
      } finally {
        if (isMounted) {
          setLoadingDisasters(false)
        }
      }
    }

    void loadDisasters()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const disasterId = active?.id
    if (!disasterId || disasterId === "resqbot") {
      return
    }

    if (messagesByDisaster[disasterId]) {
      return
    }

    let isMounted = true
    setLoadingMessagesFor(disasterId)
    setMessageError(null)

    const loadMessages = async () => {
      try {
        const response = await getChatMessages(disasterId)
        if (!isMounted) return
        const mapped = response.map(mapApiMessage)
        setMessagesByDisaster((previous) => ({
          ...previous,
          [disasterId]: mapped,
        }))
      } catch (err) {
        if (!isMounted) return
        console.error("Failed to load chat messages", err)
        setMessageError("Failed to load messages. Please try again.")
        setMessagesByDisaster((previous) => ({
          ...previous,
          [disasterId]: previous[disasterId] ?? [],
        }))
      } finally {
        if (isMounted) {
          setLoadingMessagesFor((current) => (current === disasterId ? null : current))
        }
      }
    }

    void loadMessages()

    return () => {
      isMounted = false
    }
  }, [active?.id, mapApiMessage, messagesByDisaster])

  const handleSend = async () => {
    const messageText = text.trim()
    if (!messageText || !active) return

    if (active.id === "resqbot") {
      setText("")
      await sendChatbotMessage(messageText)
      return
    }

    setSending(true)
    setMessageError(null)
    try {
      const response = await sendChatMessage(active.id, { text: messageText })
      const mapped = mapApiMessage(response)
      setMessagesByDisaster((previous) => {
        const existing = previous[active.id] ?? []
        return {
          ...previous,
          [active.id]: [...existing, mapped],
        }
      })
      setText("")
    } catch (err) {
      console.error("Failed to send message", err)
      setMessageError("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const handleSelectResQbot = () => {
    clearChatbotError()
    setActive(resqbotTarget)
  }

  const getSenderName = (message: Message) => {
    if (message.sender_id === "me") return "You"
    if (message.sender_id === "resqbot") return "resQbot"
    const resolvedName = displayNames[message.sender_id] ?? message.sender_name
    if (resolvedName) return resolvedName

    switch (message.sender_id) {
      case "individual":
        return "Individual"
      case "responder":
        return "Responder"
      case "volunteer":
        return "Volunteer"
      default:
        return "User"
    }
  }

  const getAvatarColor = (message: Message) => {
    switch (message.sender_id) {
      case "me":
        return "bg-blue-500 text-white"
      case "individual":
        return "bg-red-500 text-white"
      case "responder":
        return "bg-green-500 text-white"
      case "volunteer":
        return "bg-yellow-500 text-black"
      case "resqbot":
        return "bg-purple-500 text-white"
      default:
        return "bg-slate-500 text-white"
    }
  }

  const getRoleLabel = (role?: JoinedResponse["role"]) => {
    switch (role) {
      case "first_responder":
        return "Joined as First Responder"
      case "affected_individual":
        return "Joined as Affected Individual"
      case "volunteer":
        return "Joined as Volunteer"
      default:
        return "Joined channel"
    }
  }

  const currentMessages = useMemo(() => {
    if (!active) return [] as Message[]
    if (active.id === "resqbot") return resqbotMessages
    return messagesByDisaster[active.id] ?? []
  }, [active, messagesByDisaster, resqbotMessages])

  const currentMessageCount = currentMessages.length

  useEffect(() => {
    if (!active) return
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [active?.id, currentMessageCount])

  useEffect(() => {
    const pendingIds = new Set<string>()
    const resolvedFromMessages: Record<string, string> = {}

    Object.values(messagesByDisaster).forEach((list) => {
      list.forEach((message) => {
        const senderId = message.sender_id
        if (!senderId || senderId === "me" || senderId === "resqbot") {
          return
        }

        if (message.sender_name && !displayNames[senderId]) {
          resolvedFromMessages[senderId] = message.sender_name
          return
        }

        if (!displayNames[senderId]) {
          pendingIds.add(senderId)
        }
      })
    })

    if (Object.keys(resolvedFromMessages).length > 0) {
      setDisplayNames((previous) => ({ ...previous, ...resolvedFromMessages }))
    }

    if (pendingIds.size === 0) {
      return
    }

    let isMounted = true

    const loadDisplayNames = async () => {
      const entries = await Promise.all(
        Array.from(pendingIds).map(async (senderId) => {
          try {
            const name = await getUserDisplayName(senderId)
            return [senderId, name] as const
          } catch (err) {
            console.error("Failed to load display name", err)
            // fallback so we don't retry forever
            return [senderId, "Unknown User"] as const
          }
        }),
      )

      if (!isMounted) return

      setDisplayNames((previous) => {
        const next = { ...previous }
        entries.forEach((entry) => {
          if (!entry) return
          const [senderId, name] = entry
          if (!next[senderId]) {
            next[senderId] = name
          }
        })
        return next
      })
    }

    void loadDisplayNames()

    return () => {
      isMounted = false
    }
  }, [displayNames, messagesByDisaster])

  useEffect(() => {
    setMessageError(null)
    if (active?.id !== "resqbot") {
      clearChatbotError()
    }
  }, [active?.id, clearChatbotError])

  const isDisasterChat = active?.id !== undefined && active.id !== "resqbot"
  const textareaDisabled = !active || (isDisasterChat ? sending : false)
  const sendDisabled =
    !text.trim() ||
    !active ||
    (isDisasterChat
      ? sending || loadingMessagesFor === active?.id
      : chatbotLoading)

  return (
    <div className="w-full flex-1 overflow-hidden">
      <div className="flex flex-col md:grid md:grid-cols-4 gap-6 h-full md:h-[70vh]">
        {/* Sidebar */}
        <div className="md:col-span-1 md:h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Disasters</CardTitle>
                <Button variant="ghost" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Input placeholder="Filter…" className="pl-2" disabled />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 min-h-0">
              <div className="p-2">
                <button
                  className={`w-full flex items-center gap-3 p-2 rounded-md text-left ${active?.id === "resqbot"
                      ? "bg-green-50 dark:bg-green-900"
                      : "hover:bg-green-100 dark:hover:bg-green-800"
                    }`}
                  onClick={handleSelectResQbot}
                >
                  <Bot className="h-8 w-8 text-green-500 bg-green-100 dark:bg-green-900 p-1.5 rounded-md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">resQbot</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Pinned Chat
                    </div>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    AI
                  </Badge>
                </button>
              </div>
              <div className="border-b my-2" />
              <div className="space-y-1 p-2">
                {disasterError && (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to load disasters</AlertTitle>
                    <AlertDescription>{disasterError}</AlertDescription>
                  </Alert>
                )}
                {loadingDisasters ? (
                  <div className="flex items-center justify-center py-6 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading chats…
                  </div>
                ) : disasters.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Join a disaster to start chatting with your team.
                  </div>
                ) : (
                  disasters.map((d) => (
                    <button
                      key={d.id}
                      className={`w-full flex items-center gap-3 p-2 rounded-md text-left ${active?.id === d.id
                          ? "bg-blue-50 dark:bg-blue-900"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      onClick={() => setActive(d)}
                    >
                      <Users className="h-8 w-8 text-blue-500 bg-blue-100 dark:bg-blue-900 p-1.5 rounded-md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{d.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {getRoleLabel(d.role)}
                        </div>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        Joined
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-3 flex-1 min-h-0">
          <Card className="h-full flex flex-col">
            {active ? (
              <>
                <CardHeader className="p-4 border-b flex items-center justify-between">
                  <div>
                    <CardTitle>{active.name}</CardTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {active.id === "resqbot" ? "AI Chat" : getRoleLabel(active.role)}
                    </p>
                  </div>
                  {active.id !== "resqbot" && <Badge variant="outline">Joined</Badge>}
                </CardHeader>
                <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {messageError && isDisasterChat && (
                      <Alert variant="destructive">
                        <AlertTitle>Chat issue</AlertTitle>
                        <AlertDescription>{messageError}</AlertDescription>
                      </Alert>
                    )}
                    {active.id === "resqbot" && chatbotError && (
                      <Alert variant="destructive">
                        <AlertTitle>resQbot issue</AlertTitle>
                        <AlertDescription>{chatbotError}</AlertDescription>
                      </Alert>
                    )}
                    {active.id !== "resqbot" && loadingMessagesFor === active.id ? (
                      <div className="flex items-center justify-center py-6 text-slate-500 dark:text-slate-400">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading messages…
                      </div>
                    ) : currentMessages.length === 0 ? (
                      <div className="text-center text-slate-500 dark:text-slate-400">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <>
                        {currentMessages.map((m) => {
                          const senderName = getSenderName(m)
                          const isSelf = m.sender_id === "me"
                          const isChatbotMessage = m.sender_id === "resqbot"
                          const bubbleClasses = isSelf
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800"
                          const chatbotText = isChatbotMessage
                            ? normalizeChatbotText(m.text)
                            : m.text

                          return (
                            <div
                              key={m.id}
                              className={`flex ${isSelf ? "justify-end" : "justify-start"
                                }`}
                            >
                              <div
                                className={`flex gap-3 max-w-[80%] ${isSelf ? "flex-row-reverse" : "flex-row"
                                  }`}
                              >
                                <Avatar>
                                  <AvatarFallback className={getAvatarColor(m)}>
                                    {senderName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">{senderName}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {m.created_at}
                                    </span>
                                  </div>
                                  <div
                                    className={cn(
                                      "p-3 rounded-lg text-sm leading-relaxed",
                                      bubbleClasses,
                                      isChatbotMessage && "prose prose-sm prose-slate dark:prose-invert max-w-none",
                                    )}
                                  >
                                    {isChatbotMessage ? (
                                      <ReactMarkdown
                                        components={{
                                          p: ({ className, ...props }) => (
                                            <p
                                              className={cn(
                                                "mb-2 last:mb-0 whitespace-pre-wrap",
                                                className,
                                              )}
                                              {...props}
                                            />
                                          ),
                                          ol: ({ className, ...props }) => (
                                            <ol
                                              className={cn(
                                                "list-decimal list-outside pl-5 space-y-2",
                                                className,
                                              )}
                                              {...props}
                                            />
                                          ),
                                          li: ({ className, ...props }) => (
                                            <li
                                              className={cn("leading-relaxed", className)}
                                              {...props}
                                            />
                                          ),
                                          strong: ({ className, ...props }) => (
                                            <strong
                                              className={cn("font-semibold", className)}
                                              {...props}
                                            />
                                          ),
                                        }}
                                      >
                                        {chatbotText}
                                      </ReactMarkdown>
                                    ) : (
                                      <p className="whitespace-pre-wrap break-words">
                                        {chatbotText}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        {active.id === "resqbot" && chatbotLoading && (
                          <ChatbotThinkingIndicator
                            statusMessage={
                              chatbotEngagementMessage ?? "Thinking…"
                            }
                          />
                        )}
                      </>
                    )}
                    <div ref={endRef} />
                  </div>
                  <div className="border-t p-4">
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleSend();
                          }
                        }}
                        disabled={textareaDisabled}
                        className="min-h-10 flex-1"
                      />
                      <Button
                        onClick={() => void handleSend()}
                        disabled={sendDisabled}
                        className="w-full sm:w-auto"
                      >
                        {(isDisasterChat && sending) || (!isDisasterChat && chatbotLoading) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium mb-2">No Disaster Selected</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Select a disaster from the sidebar to start communicating
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
