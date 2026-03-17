export interface Model {
  id: string;
  name: string;
  description: string;
  contextWindow: string;
}

export const MODELS: Model[] = [
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Fast & capable, great for most tasks",
    contextWindow: "1M",
  },
  {
    id: "google/gemini-2.5-pro-preview-03-25",
    name: "Gemini 2.5 Pro",
    description: "Google's most powerful model",
    contextWindow: "1M",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Excellent reasoning & writing",
    contextWindow: "200K",
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    description: "Fast Claude model for everyday tasks",
    contextWindow: "200K",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    description: "OpenAI's flagship multimodal model",
    contextWindow: "128K",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Affordable & capable GPT-4 class",
    contextWindow: "128K",
  },
  {
    id: "meta-llama/llama-4-scout",
    name: "Llama 4 Scout",
    description: "Meta's efficient open model",
    contextWindow: "512K",
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek Chat v3",
    description: "Strong reasoning at low cost",
    contextWindow: "128K",
  },
];

export const DEFAULT_MODEL = MODELS[0].id;
