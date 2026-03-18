import OpenAI from "openai";

export function createOpenRouter(apiKey: string) {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      "X-Title": "ChatBox",
    },
  });
}
