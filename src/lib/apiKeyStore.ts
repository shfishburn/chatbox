"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "openrouter_api_key";
const API_KEY_CHANGED_EVENT = "openrouter_api_key_changed";

function readApiKey() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  const onLocalUpdate = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(API_KEY_CHANGED_EVENT, onLocalUpdate);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(API_KEY_CHANGED_EVENT, onLocalUpdate);
  };
}

export function setApiKey(key: string) {
  const trimmed = key.trim();

  if (typeof window !== "undefined") {
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
  }
}

export function useApiKey() {
  const apiKey = useSyncExternalStore(subscribe, readApiKey, () => "");

  return { apiKey, setApiKey };
}
