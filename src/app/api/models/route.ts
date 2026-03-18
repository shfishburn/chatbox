import { NextResponse } from "next/server";
import type { Model } from "@/lib/ai/models";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_MODELS = [
  "qwen/qwen3.5-9b",
  "openai/gpt-5-nano",
  "google/gemini-2.5-flash-lite",
  "qwen/qwen3-8b",
  "openai/gpt-4.1-nano",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct",
];

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
}

function formatContextLength(tokens: number | undefined): string {
  if (!tokens) return "";
  if (tokens >= 1_000_000) return `${Math.floor(tokens / 1_000_000)}M`;
  if (tokens >= 1_000) return `${Math.floor(tokens / 1_000)}K`;
  return String(tokens);
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey =
    req.headers.get("x-openrouter-key")?.trim() ?? process.env.OPENROUTER_API_KEY?.trim() ?? "";

  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter API key is required." }, { status: 400 });
  }

  const headers: Record<string, string> = {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    "X-Title": "ChatBox",
    Authorization: `Bearer ${apiKey}`,
  };

  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch models from OpenRouter" },
      { status: res.status },
    );
  }

  const allowedSet = new Set(ALLOWED_MODELS);
  const json = await res.json();
  const models: Model[] = (json.data as OpenRouterModel[])
    .filter((m) => allowedSet.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? "",
      contextWindow: formatContextLength(m.context_length),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ models });
}
