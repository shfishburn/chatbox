"use client";

const STORAGE_KEY = "chat_preferences";

interface ChatPreferences {
  model?: string;
  enabledTools?: string[];
}

function normalizePreferences(value: unknown): ChatPreferences {
  if (!value || typeof value !== "object") return {};

  const source = value as Record<string, unknown>;
  const normalized: ChatPreferences = {};

  if (typeof source.model === "string") {
    normalized.model = source.model;
  }

  if (Array.isArray(source.enabledTools)) {
    normalized.enabledTools = source.enabledTools.filter(
      (tool): tool is string => typeof tool === "string",
    );
  }

  return normalized;
}

export function getPreferences(): ChatPreferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return normalizePreferences(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function savePreferences(prefs: ChatPreferences) {
  if (typeof window === "undefined") return;
  const current = getPreferences();
  const incoming = normalizePreferences(prefs);

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...incoming }));
}
