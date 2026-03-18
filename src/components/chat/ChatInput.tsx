"use client";

import { AlertCircle, Send, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onStop: () => void;
  error: string | null;
}

export default function ChatInput({ input, setInput, onSubmit, isLoading, onStop, error }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  }

  return (
    <div className="shrink-0 px-4 py-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className={cn(
            "relative flex items-end gap-2 rounded-2xl border bg-neutral-50 dark:bg-neutral-800 px-4 py-3",
            "border-neutral-200 dark:border-neutral-700",
            "focus-within:border-blue-400 dark:focus-within:border-blue-600 transition-colors",
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ChatBox… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent text-sm text-foreground outline-none",
              "placeholder:text-neutral-400 leading-relaxed min-h-[24px]",
            )}
            disabled={isLoading}
          />

          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className={cn(
                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                "bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600",
                "text-neutral-600 dark:text-neutral-300 transition-colors",
              )}
              title="Stop generating"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className={cn(
                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                input.trim()
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed",
              )}
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
        <p className="text-center text-xs text-neutral-400 mt-2">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
