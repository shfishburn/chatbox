"use client";

import { useState } from "react";
import { TOOL_META } from "@/lib/ai/tools";
import { cn } from "@/lib/utils";
import {
  Wrench,
  Calculator,
  Search,
  Cloud,
  BookOpen,
  Link,
  ChevronDown,
} from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  calculator: <Calculator className="w-4 h-4" />,
  search: <Search className="w-4 h-4" />,
  cloud: <Cloud className="w-4 h-4" />,
  "book-open": <BookOpen className="w-4 h-4" />,
  link: <Link className="w-4 h-4" />,
};

interface Props {
  enabledTools: string[];
  onChange: (tools: string[]) => void;
}

export default function ToolsPanel({ enabledTools, onChange }: Props) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    if (enabledTools.includes(id)) {
      onChange(enabledTools.filter((t) => t !== id));
    } else {
      onChange([...enabledTools, id]);
    }
  }

  const activeCount = enabledTools.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
          "border border-neutral-200 dark:border-neutral-700",
          activeCount > 0
            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
            : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700",
        )}
      >
        <Wrench className="w-3.5 h-3.5" />
        <span>Tools{activeCount > 0 ? ` (${activeCount})` : ""}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 z-20 w-72 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Available Tools
              </p>
            </div>
            <div className="p-2 space-y-1">
              {TOOL_META.map((tool) => {
                const enabled = enabledTools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => toggle(tool.id)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      enabled
                        ? "bg-blue-50 dark:bg-blue-950/40"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800",
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        enabled
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500",
                      )}
                    >
                      {ICONS[tool.icon]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            enabled
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-foreground",
                          )}
                        >
                          {tool.name}
                        </span>
                        {/* Toggle indicator */}
                        <div
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors shrink-0",
                            enabled
                              ? "bg-blue-600"
                              : "bg-neutral-200 dark:bg-neutral-700",
                          )}
                        >
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full bg-white shadow-sm transition-transform mt-0.5",
                              enabled
                                ? "translate-x-4 ml-0.5"
                                : "translate-x-0.5",
                            )}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
