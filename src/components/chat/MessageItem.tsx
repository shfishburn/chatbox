"use client";

import { Bot, ChevronDown, ChevronRight, Code2, User, Wrench } from "lucide-react";
import { useState } from "react";
import type { Message, TelemetryStep, ToolInvocation } from "@/lib/ai/types";
import Markdown from "./Markdown";
import ToolCallDisplay from "./ToolCallDisplay";

interface Props {
  message: Message;
}

export default function MessageItem({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 bg-blue-600 text-white text-sm leading-relaxed font-mono whitespace-pre-wrap wrap-break-word">
          {message.content}
        </div>
        <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
        </div>
      </div>
    );
  }

  const invocations = message.toolInvocations;
  const hasTools = invocations && invocations.length > 0;
  const text = message.content;

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {/* Collapsed tool calls summary */}
        {hasTools && <ToolCallsSummary invocations={invocations} />}

        {/* Text content */}
        {text && (
          <div className="text-sm leading-relaxed text-foreground wrap-break-word">
            <Markdown>{text}</Markdown>
          </div>
        )}

        {/* Raw telemetry */}
        {message.telemetry && message.telemetry.length > 0 && (
          <TelemetryPanel steps={message.telemetry} />
        )}
      </div>
    </div>
  );
}

/** Collapsed tool calls — shows a summary line, expandable to full details */
function ToolCallsSummary({ invocations }: { invocations: ToolInvocation[] }) {
  const [expanded, setExpanded] = useState(false);
  const toolNames = [...new Set(invocations.map((inv) => inv.toolName))];
  const _totalMs = invocations.reduce((sum, inv) => {
    if (inv.state === "result") return sum;
    return sum;
  }, 0);

  const label =
    invocations.length === 1
      ? `Used ${toolNames[0]}`
      : `Used ${invocations.length} tools (${toolNames.join(", ")})`;

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
      >
        <Wrench className="w-3.5 h-3.5 text-neutral-500" />
        <span className="font-medium text-neutral-600 dark:text-neutral-400">{label}</span>
        <span className="flex-1" />
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-2 space-y-2">
          {invocations.map((inv) => (
            <ToolCallDisplay key={inv.toolCallId} invocation={inv} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Expandable raw API telemetry panel */
function TelemetryPanel({ steps }: { steps: TelemetryStep[] }) {
  const [expanded, setExpanded] = useState(false);
  const totalMs = steps.reduce((sum, s) => sum + s.durationMs, 0);

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
      >
        <Code2 className="w-3.5 h-3.5 text-neutral-500" />
        <span className="font-medium text-neutral-600 dark:text-neutral-400">Raw payload</span>
        <span className="text-neutral-400 dark:text-neutral-500">
          {steps.length} {steps.length === 1 ? "request" : "requests"} &middot; {totalMs}ms
        </span>
        <span className="flex-1" />
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-200 dark:divide-neutral-700">
          {steps.map((step) => (
            <div key={step.step} className="px-3 py-2 space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide font-semibold text-neutral-500">
                <span>Step {step.step + 1}</span>
                <span className="font-normal">&middot; {step.durationMs}ms</span>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-1">
                  Request
                </div>
                <pre className="font-mono text-[11px] text-foreground whitespace-pre-wrap wrap-break-word bg-white dark:bg-neutral-900 rounded p-2 max-h-48 overflow-y-auto">
                  {JSON.stringify(step.request, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-1">
                  Response
                </div>
                <pre className="font-mono text-[11px] text-foreground whitespace-pre-wrap wrap-break-word bg-white dark:bg-neutral-900 rounded p-2 max-h-48 overflow-y-auto">
                  {JSON.stringify(step.response, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
