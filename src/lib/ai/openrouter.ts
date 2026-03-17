import { createOpenAI } from "@ai-sdk/openai";

export function createOpenRouter(apiKey: string) {
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      "X-Title": "ChatBox",
    },
  });
}
