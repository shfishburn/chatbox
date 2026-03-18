"use client";

import { ExternalLink, Key, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApiKey } from "@/lib/apiKeyStore";

interface Props {
  onClose: () => void;
}

export default function ApiKeyModal({ onClose }: Props) {
  const { apiKey, setApiKey } = useApiKey();
  const [value, setValue] = useState(apiKey);

  useEffect(() => {
    setValue(apiKey);
  }, [apiKey]);

  function handleSave() {
    setApiKey(value.trim());
    onClose();
  }

  function handleClear() {
    setApiKey("");
    setValue("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss */}
      <div role="presentation" className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-foreground">OpenRouter API Key</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          Enter your{" "}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
          >
            OpenRouter API key
            <ExternalLink className="w-3 h-3" />
          </a>{" "}
          to use your own account and credits. The key is stored only in your browser&apos;s local
          storage.
        </p>

        {/* Input */}
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-or-..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-foreground placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-neutral-500 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
