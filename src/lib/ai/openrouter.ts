export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatCompletionMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: ToolCall[] | null;
    }
  | { role: "tool"; tool_call_id: string; content: string };

export type ChatCompletionTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatCompletionResponse = {
  choices: {
    message: {
      role: "assistant";
      content: string | null;
      tool_calls?: ToolCall[] | null;
    };
    finish_reason: string;
  }[];
};

export interface OpenRouterClient {
  chat: {
    completions: {
      create(params: {
        model: string;
        messages: ChatCompletionMessage[];
        tools?: ChatCompletionTool[];
        tool_choice?: "auto";
        temperature?: number;
        top_p?: number;
      }): Promise<ChatCompletionResponse>;
    };
  };
}

const OPENROUTER_TIMEOUT_MS = 25_000;

export class OpenRouterRequestError extends Error {
  status: number;

  constructor(status: number, details: string) {
    super(details);
    this.name = "OpenRouterRequestError";
    this.status = status;
  }
}

export class OpenRouterTimeoutError extends Error {
  timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`OpenRouter request timed out after ${timeoutMs}ms`);
    this.name = "OpenRouterTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function createOpenRouter(apiKey: string): OpenRouterClient {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    "X-Title": "ChatBox",
  };

  return {
    chat: {
      completions: {
        async create(params) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, OPENROUTER_TIMEOUT_MS);

          let res: Response;
          try {
            res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers,
              body: JSON.stringify(params),
              signal: controller.signal,
            });
          } catch (error) {
            if (
              error instanceof Error &&
              (error.name === "AbortError" ||
                error.name === "TimeoutError" ||
                error.message.toLowerCase().includes("aborted"))
            ) {
              throw new OpenRouterTimeoutError(OPENROUTER_TIMEOUT_MS);
            }
            throw error;
          } finally {
            clearTimeout(timeoutId);
          }

          if (!res.ok) {
            const text = await res.text();
            throw new OpenRouterRequestError(res.status, `OpenRouter error ${res.status}: ${text}`);
          }
          return res.json() as Promise<ChatCompletionResponse>;
        },
      },
    },
  };
}
