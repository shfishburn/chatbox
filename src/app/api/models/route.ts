import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Model } from "@/lib/ai/models";

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  supported_parameters?: string[];
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
    req.headers.get("x-openrouter-key")?.trim() ??
    process.env.OPENROUTER_API_KEY?.trim() ??
    "";

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key is required." },
      { status: 400 },
    );
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

  const json = await res.json();
  const models: Model[] = (json.data as OpenRouterModel[])
    .filter(
      (m) =>
        m.supported_parameters?.includes("tools") &&
        m.pricing?.prompt === "0" &&
        m.pricing?.completion === "0",
    )
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? "",
      contextWindow: formatContextLength(m.context_length),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ models });
}
