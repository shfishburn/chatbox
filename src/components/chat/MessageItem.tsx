"use client";

import type { Message } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
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
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 bg-blue-600 text-white text-sm leading-relaxed">
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
        {message.toolInvocations?.map((inv) => (
          <ToolCallDisplay key={inv.toolCallId} invocation={inv} />
        ))}
        {/* Text content */}
        {message.content && (
          <div
            className={cn(
              "text-sm leading-relaxed text-foreground",
              "prose prose-sm dark:prose-invert max-w-none",
              "prose-p:my-1.5 prose-pre:bg-neutral-100 dark:prose-pre:bg-neutral-800",
              "prose-code:bg-neutral-100 dark:prose-code:bg-neutral-800 prose-code:px-1 prose-code:rounded",
            )}
          >
            <SimpleMarkdown content={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}

function getTextContent(message: Message): string {
  if (typeof message.content === "string") return message.content;
  return "";
}

/** Minimal Markdown renderer (bold, code, line breaks) — no external dep */
function SimpleMarkdown({ content }: { content: string }) {
  // Split on code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const code = match?.[2] ?? part.slice(3, -3);
          const lang = match?.[1] ?? "";
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 text-xs my-3"
            >
              {lang && (
                <div className="text-xs text-neutral-500 mb-1 font-mono">
                  {lang}
                </div>
              )}
              <code>{code}</code>
            </pre>
          );
        }
        // Inline formatting
        return <InlineText key={i} text={part} />;
      })}
    </>
  );
}

function InlineText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => {
        const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
          <span key={li}>
            {parts.map((p, pi) => {
              if (p.startsWith("**") && p.endsWith("**")) {
                return <strong key={pi}>{p.slice(2, -2)}</strong>;
              }
              if (p.startsWith("*") && p.endsWith("*")) {
                return <em key={pi}>{p.slice(1, -1)}</em>;
              }
              if (p.startsWith("`") && p.endsWith("`")) {
                return (
                  <code
                    key={pi}
                    className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded text-xs font-mono"
                  >
                    {p.slice(1, -1)}
                  </code>
                );
              }
              return <span key={pi}>{p}</span>;
            })}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}
