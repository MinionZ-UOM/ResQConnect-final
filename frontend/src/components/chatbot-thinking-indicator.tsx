"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type ChatbotThinkingIndicatorProps = {
  statusMessage?: string
}

const ChatbotThinkingIndicator = ({
  statusMessage = "Thinking…",
}: ChatbotThinkingIndicatorProps) => {
  return (
    <div className="flex justify-start">
      <div className="flex gap-3 max-w-[80%]">
        <Avatar>
          <AvatarFallback className="bg-purple-500 text-white">R</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">resQbot</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {statusMessage}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-300">
              <span className="chatbot-thinking-dot" />
              <span className="chatbot-thinking-dot" />
              <span className="chatbot-thinking-dot" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatbotThinkingIndicator
