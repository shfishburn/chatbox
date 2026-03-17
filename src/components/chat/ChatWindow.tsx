"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import type { CoreMessage } from "ai";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import { useApiKey } from "@/lib/apiKeyStore";
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
  const { apiKey } = useApiKey();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [model, setModel] = useState(initialModel);
  const [enabledTools, setEnabledTools] = useState<string[]>(initialTools);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const sessionRedirected = useRef(false);

  useEffect(() => {
    // Clear stale missing-key guidance once a key is provided.
    if (apiKey) {
      setRequestError(null);
    }
  }, [apiKey]);

  useEffect(() => {
    if (!sessionId) return;

    const controller = new AbortController();
    void fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, tools_enabled: enabledTools }),
      signal: controller.signal,
    }).catch(() => {
      // Non-blocking UX: session settings will still persist on next message.
    });

    return () => controller.abort();
  }, [sessionId, model, enabledTools]);

  const { messages, input, setInput, handleSubmit, isLoading, error, stop } =
    useChat({
      api: "/api/chat",
      initialMessages: initialMessages as never,
      headers: apiKey ? { "x-openrouter-key": apiKey } : {},
      body: { sessionId, model, enabledTools },
      onResponse: async (response) => {
        if (!response.ok) {
          if (response.status === 400) {
            try {
              const payload = (await response.clone().json()) as {
                error?: string;
              };

              if (payload.error === "OpenRouter API key is required.") {
                setRequestError(
                  "Add your OpenRouter API key in Sidebar > API Key to continue.",
                );
                return;
              }
            } catch {
              // Fall through to generic error handling.
            }
          }

          setRequestError(null);
          return;
        }

        setRequestError(null);
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
        error={requestError ?? error?.message ?? null}
      />
    </div>
  );
}
