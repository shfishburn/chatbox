"use client";

import type { Message, ToolInvocation } from "@/lib/ai/types";
import { Bot, User } from "lucide-react";
import ToolCallDisplay from "./ToolCallDisplay";

interface Props {
  message: Message;
}

export default function MessageItem({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 bg-blue-600 text-white text-sm leading-relaxed font-mono whitespace-pre-wrap break-words">
          {getTextContent(message)}
        </div>
        <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
        </div>
      </div>
    );
  }

  // Assistant message — may contain text + tool invocations
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {/* Tool call parts */}
        {message.toolInvocations?.map((inv: ToolInvocation) => (
          <ToolCallDisplay key={inv.toolCallId} invocation={inv} />
        ))}
        {/* Text content */}
        {getTextContent(message) && (
          <div className="text-sm leading-relaxed text-foreground font-mono whitespace-pre-wrap break-words">
            {getTextContent(message)}
          </div>
        )}
      </div>
    </div>
  );
}

function getTextContent(message: Message): string {
  return message.content;
}
