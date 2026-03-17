"use client";

import { useState, useRef, useEffect } from "react";
import { MODELS } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface Props {
  value: string;
  onChange: (model: string) => void;
}

export default function ModelSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const currentModel = MODELS.find((m) => m.id === value) ?? MODELS[0];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
          "border border-neutral-200 dark:border-neutral-700",
          "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
          "hover:bg-neutral-50 dark:hover:bg-neutral-700",
        )}
      >
        <span className="truncate max-w-[160px]">{currentModel.name}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-20 w-72 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Select Model
            </p>
          </div>
          <div className="p-2 space-y-0.5 max-h-80 overflow-y-auto">
            {MODELS.map((model) => {
              const selected = model.id === value;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onChange(model.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "bg-blue-50 dark:bg-blue-950/40"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          selected
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-foreground",
                        )}
                      >
                        {model.name}
                      </span>
                      <span className="text-xs text-neutral-400 shrink-0 ml-2">
                        {model.contextWindow} ctx
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {model.description}
                    </p>
                  </div>
                  {selected && (
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
