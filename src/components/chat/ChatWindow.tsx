import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CoreMessage, Message, TelemetryStep, ToolInvocation } from "@/lib/ai/types";
import { useApiKey } from "@/lib/apiKeyStore";
import { getPreferences, savePreferences } from "@/lib/preferencesStore";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import ModelSelector from "./ModelSelector";
import ToolsPanel from "./ToolsPanel";

interface Props {
  sessionId?: string;
  initialModel?: string;
  initialTools?: string[];
  initialMessages?: CoreMessage[];
}

/**
 * Convert CoreMessage[] to the Message[] format expected by the UI.
 * Consecutive assistant turns (from multi-step tool calling) are collapsed
 * into a single Message with all tool invocations + the final text.
 */
function coreToMessages(coreMessages: CoreMessage[], telemetry?: TelemetryStep[]): Message[] {
  const result: Message[] = [];
  let pendingInvocations: ToolInvocation[] = [];
  let turnId = 0;

  for (let i = 0; i < coreMessages.length; i++) {
    const msg = coreMessages[i];
    if (msg.role === "system") continue;

    if (msg.role === "user") {
      // Flush any dangling assistant state (shouldn't happen, but safety)
      pendingInvocations = [];
      const content =
        typeof msg.content === "string"
          ? msg.content
          : (msg.content as Array<{ type: string; text?: string }>)
              .filter((p) => p.type === "text" && p.text != null)
              .map((p) => p.text!)
              .join("\n");
      result.push({ id: String(turnId++), role: "user", content });
    } else if (msg.role === "assistant") {
      const parts = (
        Array.isArray(msg.content) ? msg.content : [{ type: "text", text: msg.content as string }]
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

      // Resolve tool call → result pairs
      const invocations: ToolInvocation[] = toolCalls.map((tc) => {
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

      pendingInvocations.push(...invocations);

      // If this assistant message has tool calls but no final text,
      // it's an intermediate step — accumulate and continue
      const hasToolCalls = toolCalls.length > 0;
      const hasText = text.trim().length > 0;

      if (hasToolCalls && !hasText) {
        // Check if next non-tool message is another assistant (continuation)
        let nextIdx = i + 1;
        while (nextIdx < coreMessages.length && coreMessages[nextIdx].role === "tool") {
          nextIdx++;
        }
        if (nextIdx < coreMessages.length && coreMessages[nextIdx].role === "assistant") {
          continue; // accumulate into next assistant message
        }
      }

      // Emit collapsed message
      const allInvocations = pendingInvocations;
      pendingInvocations = [];
      result.push({
        id: String(turnId++),
        role: "assistant",
        content: text,
        toolInvocations: allInvocations.length > 0 ? allInvocations : undefined,
        telemetry,
      });
      // Only attach telemetry to the first assistant turn after user message
      telemetry = undefined;
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
  const navigate = useNavigate();
  const { apiKey } = useApiKey();
  const [requestError, setRequestError] = useState<string | null>(null);
  const isNewSession = !initialSessionId;
  const [prefs] = useState(getPreferences);
  const [model, setModel] = useState(initialModel ?? (isNewSession ? prefs.model : undefined));
  const resolvedTools =
    isNewSession && initialTools.length === 0 ? (prefs.enabledTools ?? []) : initialTools;
  const [enabledTools, setEnabledTools] = useState<string[]>(resolvedTools);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const sessionRedirected = useRef(false);
  const prefsInitialized = useRef(false);

  const [coreMessages, setCoreMessages] = useState<CoreMessage[]>(initialMessages);
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryStep[] | undefined>();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messages = useMemo(
    () => coreToMessages(coreMessages, latestTelemetry),
    [coreMessages, latestTelemetry],
  );

  useEffect(() => {
    if (apiKey) setRequestError(null);
  }, [apiKey]);

  useEffect(() => {
    if (!prefsInitialized.current) {
      prefsInitialized.current = true;
      return;
    }
    savePreferences({ model, enabledTools });
  }, [model, enabledTools]);

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
        navigate({ to: "/chat/$sessionId", params: { sessionId: newSessionId }, replace: true });
      }
    },
    [navigate],
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
              setRequestError("Add your OpenRouter API key in Sidebar > API Key to continue.");
              return;
            }
            if (payload.error) errorMsg = payload.error;
          } catch {
            // ignore JSON parse errors
          }
          setRequestError(errorMsg);
          return;
        }

        const data = (await response.json()) as {
          messages: CoreMessage[];
          telemetry?: TelemetryStep[];
        };
        syncSessionFromResponse(response);

        setLatestTelemetry(data.telemetry);
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
