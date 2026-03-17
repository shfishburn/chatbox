"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import type { CoreMessage } from "ai";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ToolsPanel from "./ToolsPanel";
import ModelSelector from "./ModelSelector";

interface Props {
  sessionId?: string;
  initialModel?: string;
  initialTools?: string[];
  initialMessages?: CoreMessage[];
}

export default function ChatWindow({
  sessionId: initialSessionId,
  initialModel = DEFAULT_MODEL,
  initialTools = [],
  initialMessages = [],
}: Props) {
  const router = useRouter();
  const [model, setModel] = useState(initialModel);
  const [enabledTools, setEnabledTools] = useState<string[]>(initialTools);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const sessionRedirected = useRef(false);

  const { messages, input, setInput, handleSubmit, isLoading, error, stop } =
    useChat({
      api: "/api/chat",
      initialMessages: initialMessages as never,
      body: { sessionId, model, enabledTools },
      onResponse: (response) => {
        const newSessionId = response.headers.get("X-Session-Id");
        const isNew = response.headers.get("X-Is-New-Session") === "true";
        if (newSessionId && isNew && !sessionRedirected.current) {
          sessionRedirected.current = true;
          setSessionId(newSessionId);
          // Navigate to the new URL without full reload — push to history
          router.replace(`/chat/${newSessionId}`);
          router.refresh(); // refresh sidebar session list
        }
      },
    });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
        <ModelSelector value={model} onChange={setModel} />
        <div className="flex-1" />
        <ToolsPanel enabledTools={enabledTools} onChange={setEnabledTools} />
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onStop={stop}
        error={error?.message ?? null}
      />
    </div>
  );
}
