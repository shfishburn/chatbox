"use client";

import { useState, useRef, useEffect } from "react";
import type { Model } from "@/lib/ai/models";
import { useApiKey } from "@/lib/apiKeyStore";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Loader2 } from "lucide-react";

interface Props {
  value: string | undefined;
  onChange: (model: string) => void;
}

export default function ModelSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { apiKey } = useApiKey();

  const currentModel = models.find((m) => m.id === value);
  const displayName = value
    ? (currentModel?.name ?? value.split("/").pop() ?? value)
    : "Select a model";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {};
    if (apiKey) headers["x-openrouter-key"] = apiKey;

    fetch("/api/models", { headers })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          models?: Model[];
          error?: string;
        } | null;

        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to load models");
        }

        return { models: data?.models ?? [] };
      })
      .then((data: { models: Model[] }) => {
        if (!cancelled) setModels(data.models);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load models",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

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
        <span className="truncate max-w-[160px]">{displayName}</span>
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
            {loading && (
              <div className="flex items-center justify-center py-6 text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Loading models…</span>
              </div>
            )}
            {error && (
              <p className="text-sm text-red-500 px-3 py-4 text-center">
                {error}
              </p>
            )}
            {!loading && !error && models.length === 0 && (
              <p className="text-sm text-neutral-500 px-3 py-4 text-center">
                No models available.
              </p>
            )}
            {!loading &&
              !error &&
              models.map((model) => {
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
                        {model.contextWindow && (
                          <span className="text-xs text-neutral-400 shrink-0 ml-2">
                            {model.contextWindow} ctx
                          </span>
                        )}
                      </div>
                      {model.description && (
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                          {model.description}
                        </p>
                      )}
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
