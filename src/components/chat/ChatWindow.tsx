"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Message, CoreMessage, ToolInvocation } from "@/lib/ai/types";
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

/** Convert CoreMessage[] to the Message[] format expected by the UI components */
function coreToMessages(coreMessages: CoreMessage[]): Message[] {
  const result: Message[] = [];
  for (let i = 0; i < coreMessages.length; i++) {
    const msg = coreMessages[i];
    if (msg.role === "system") continue;

    if (msg.role === "user") {
      const content =
        typeof msg.content === "string"
          ? msg.content
          : (msg.content as Array<{ type: string; text?: string }>)
              .filter((p) => p.type === "text" && p.text != null)
              .map((p) => p.text!)
              .join("\n");
      result.push({ id: String(i), role: "user", content });
    } else if (msg.role === "assistant") {
      const parts = (
        Array.isArray(msg.content)
          ? msg.content
          : [{ type: "text", text: msg.content as string }]
      ) as Array<{
        type: string;
        text?: string;
        toolCallId?: string;
        toolName?: string;
        args?: unknown;
      }>;
      const text = parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
      const toolCalls = parts.filter((p) => p.type === "tool-call");
      const toolInvocations: ToolInvocation[] = toolCalls.map((tc) => {
        for (let j = i + 1; j < coreMessages.length; j++) {
          const toolMsg = coreMessages[j];
          if (toolMsg.role === "tool" && Array.isArray(toolMsg.content)) {
            const res = (
              toolMsg.content as Array<{
                toolCallId: string;
                toolName: string;
                result: unknown;
              }>
            ).find((r) => r.toolCallId === tc.toolCallId);
            if (res) {
              return {
                state: "result" as const,
                toolCallId: tc.toolCallId!,
                toolName: tc.toolName!,
                args: tc.args,
                result: res.result,
              };
            }
          }
        }
        return {
          state: "call" as const,
          toolCallId: tc.toolCallId!,
          toolName: tc.toolName!,
          args: tc.args,
        };
      });
      result.push({
        id: String(i),
        role: "assistant",
        content: text,
        toolInvocations:
          toolInvocations.length > 0 ? toolInvocations : undefined,
      });
    }
    // "tool" role messages are embedded in assistant's toolInvocations; skip top-level
  }
  return result;
}

export default function ChatWindow({
  sessionId: initialSessionId,
  initialModel,
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

  const [coreMessages, setCoreMessages] =
    useState<CoreMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messages = useMemo(() => coreToMessages(coreMessages), [coreMessages]);

  useEffect(() => {
    if (apiKey) setRequestError(null);
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

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const syncSessionFromResponse = useCallback(
    (response: Response) => {
      const newSessionId = response.headers.get("X-Session-Id");
      const isNew = response.headers.get("X-Is-New-Session") === "true";

      if (newSessionId && isNew && !sessionRedirected.current) {
        sessionRedirected.current = true;
        setSessionId(newSessionId);
        router.replace(`/chat/${newSessionId}`);
        router.refresh();
      }
    },
    [router],
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (isLoading) return;

      const trimmed = input.trim();
      let updatedCoreMessages: CoreMessage[];

      if (trimmed) {
        const userCoreMessage: CoreMessage = { role: "user", content: trimmed };
        updatedCoreMessages = [...coreMessages, userCoreMessage];
        setCoreMessages(updatedCoreMessages);
        setInput("");
      } else {
        updatedCoreMessages = [...coreMessages];
      }

      setIsLoading(true);
      setRequestError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-openrouter-key": apiKey } : {}),
          },
          body: JSON.stringify({
            messages: updatedCoreMessages,
            sessionId,
            model,
            enabledTools,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          syncSessionFromResponse(response);
          let errorMsg = `Request failed (${response.status})`;
          try {
            const payload = (await response.json()) as { error?: string };
            if (payload.error === "OpenRouter API key is required.") {
              setRequestError(
                "Add your OpenRouter API key in Sidebar > API Key to continue.",
              );
              return;
            }
            if (payload.error) errorMsg = payload.error;
          } catch {
            // ignore JSON parse errors
          }
          setRequestError(errorMsg);
          return;
        }

        const data = (await response.json()) as { messages: CoreMessage[] };
        syncSessionFromResponse(response);

        setCoreMessages([...updatedCoreMessages, ...data.messages]);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setRequestError("An error occurred. Please try again.");
          return;
        }
      } finally {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    },
    [
      input,
      isLoading,
      coreMessages,
      apiKey,
      sessionId,
      model,
      enabledTools,
      syncSessionFromResponse,
    ],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
        <ModelSelector value={model} onChange={setModel} />
        <div className="flex-1" />
        <ToolsPanel enabledTools={enabledTools} onChange={setEnabledTools} />
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onRetry={input ? undefined : handleSubmit}
      />

      {/* Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onStop={stop}
        error={requestError}
      />
    </div>
  );
}
