"use client";

import {
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronRight,
  Cloud,
  Link,
  Loader2,
  Search,
} from "lucide-react";
import { useState } from "react";
import type { ToolInvocation } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

const TOOL_ICONS: Record<string, React.ReactNode> = {
  calculator: <Calculator className="w-3.5 h-3.5" />,
  weather: <Cloud className="w-3.5 h-3.5" />,
  wikipedia: <BookOpen className="w-3.5 h-3.5" />,
  url_reader: <Link className="w-3.5 h-3.5" />,
};

const TOOL_NAMES: Record<string, string> = {
  calculator: "Calculator",
  weather: "Weather",
  wikipedia: "Wikipedia",
  url_reader: "URL Reader",
};

interface Props {
  invocation: ToolInvocation;
}

export default function ToolCallDisplay({ invocation }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isPending = invocation.state === "call";
  const name = TOOL_NAMES[invocation.toolName] ?? invocation.toolName;
  const icon = TOOL_ICONS[invocation.toolName] ?? <Search className="w-3.5 h-3.5" />;

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
      >
        <span
          className={cn(
            "flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400",
            isPending && "text-blue-600 dark:text-blue-400",
          )}
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
          <span className="font-medium">{name}</span>
        </span>
        <span className="flex-1 truncate text-neutral-400 font-mono">
          {formatArgs(invocation.args)}
        </span>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 px-3 py-2 space-y-2">
          <div>
            <div className="text-neutral-500 mb-1 uppercase tracking-wide text-[10px] font-semibold">
              Input
            </div>
            <pre className="font-mono text-xs text-foreground whitespace-pre-wrap wrap-break-word">
              {JSON.stringify(invocation.args, null, 2)}
            </pre>
          </div>
          {"result" in invocation && (
            <div>
              <div className="text-neutral-500 mb-1 uppercase tracking-wide text-[10px] font-semibold">
                Result
              </div>
              <pre className="font-mono text-xs text-foreground whitespace-pre-wrap wrap-break-word overflow-x-auto max-h-60 overflow-y-auto">
                {JSON.stringify(invocation.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatArgs(args: unknown): string {
  if (!args || typeof args !== "object") return "";
  const entries = Object.entries(args);
  if (!entries.length) return "";
  const [, value] = entries[0];
  const str = typeof value === "string" ? value : JSON.stringify(value);
  return str.length > 60 ? `${str.slice(0, 60)}…` : str;
}
