"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/ai/types";
import MessageItem from "./MessageItem";
import { Bot, RotateCcw } from "lucide-react";

interface Props {
  messages: Message[];
  isLoading: boolean;
  onRetry?: () => void;
}

export default function MessageList({ messages, isLoading, onRetry }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
          <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            How can I help?
          </h2>
          <p className="text-sm text-neutral-500 max-w-sm">
            Ask me anything — I can search the web, do math, check the weather,
            look up Wikipedia, or read any URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {messages.map((message, msgIdx) => (
          <MessageItem key={msgIdx} message={message} />
        ))}
        {!isLoading &&
          !!onRetry &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="flex justify-end">
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex gap-1 pt-2.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
