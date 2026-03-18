import type { ChatCompletionMessage } from "@/lib/ai/openrouter";
import { createClient } from "@/lib/supabase/server";
import { createOpenRouter } from "@/lib/ai/openrouter";
import {
  OpenRouterRequestError,
  OpenRouterTimeoutError,
} from "@/lib/ai/openrouter";
import { ALL_TOOLS, toOpenAITools } from "@/lib/ai/tools";
import type { AnyTool } from "@/lib/ai/tools";
import { createSession, updateSession } from "@/lib/db/sessions";
import { saveMessage } from "@/lib/db/messages";
import type {
  CoreMessage,
  TextPart,
  ToolCallPart,
  ToolResultPart,
} from "@/lib/ai/types";

export const maxDuration = 60;

function buildSessionHeaders(
  sessionId: string,
  isNewSession: boolean,
): HeadersInit {
  return {
    "X-Session-Id": sessionId,
    "X-Is-New-Session": isNewSession ? "true" : "false",
  };
}

function coreMessagesToOpenAI(
  messages: CoreMessage[],
): ChatCompletionMessage[] {
  const result: ChatCompletionMessage[] = [];
  for (const msg of messages) {
    if (msg.role === "system") {
      result.push({ role: "system", content: msg.content as string });
    } else if (msg.role === "user") {
      const content =
        typeof msg.content === "string"
          ? msg.content
          : (msg.content as TextPart[]).map((p) => p.text).join("");
      result.push({ role: "user", content });
    } else if (msg.role === "assistant") {
      const parts = Array.isArray(msg.content)
        ? (msg.content as (TextPart | ToolCallPart)[])
        : [{ type: "text" as const, text: msg.content as string }];
      const text = parts
        .filter((p): p is TextPart => p.type === "text")
        .map((p) => p.text)
        .join("");
      const toolCallParts = parts.filter(
        (p): p is ToolCallPart => p.type === "tool-call",
      );
      const openAIMsg: Extract<ChatCompletionMessage, { role: "assistant" }> = {
        role: "assistant",
        content: text || null,
      };
      if (toolCallParts.length > 0) {
        openAIMsg.tool_calls = toolCallParts.map((tc) => ({
          id: tc.toolCallId,
          type: "function" as const,
          function: {
            name: tc.toolName,
            arguments: JSON.stringify(tc.args),
          },
        }));
      }
      result.push(openAIMsg);
    } else if (msg.role === "tool") {
      for (const part of msg.content as ToolResultPart[]) {
        result.push({
          role: "tool",
          tool_call_id: part.toolCallId,
          content:
            typeof part.result === "string"
              ? part.result
              : JSON.stringify(part.result),
        });
      }
    }
  }
  return result;
}

function openAIAssistantToCoreMessage(msg: {
  content: string | null;
  tool_calls?:
    | {
        id: string;
        type: string;
        function: { name: string; arguments: string };
      }[]
    | null;
}): CoreMessage {
  if (msg.tool_calls && msg.tool_calls.length > 0) {
    const parts: (TextPart | ToolCallPart)[] = [];
    if (msg.content) {
      parts.push({ type: "text", text: msg.content });
    }
    for (const tc of msg.tool_calls) {
      if (tc.type !== "function") continue;
      let args: unknown;
      try {
        args = JSON.parse(tc.function.arguments) as unknown;
      } catch {
        args = {};
      }
      parts.push({
        type: "tool-call",
        toolCallId: tc.id,
        toolName: tc.function.name,
        args,
      });
    }
    return { role: "assistant", content: parts };
  }
  return { role: "assistant", content: msg.content ?? "" };
}

async function runWithTools(
  openai: ReturnType<typeof createOpenRouter>,
  model: string,
  messages: ChatCompletionMessage[],
  toolsToUse: Record<string, AnyTool> | undefined,
  maxSteps: number,
): Promise<CoreMessage[]> {
  const openAITools = toolsToUse ? toOpenAITools(toolsToUse) : undefined;
  const responseMessages: CoreMessage[] = [];
  const currentMessages = [...messages];

  for (let step = 0; step < maxSteps; step++) {
    const response = await openai.chat.completions.create({
      model,
      messages: currentMessages,
      temperature: 0,
      top_p: 1,
      ...(openAITools?.length
        ? { tools: openAITools, tool_choice: "auto" as const }
        : {}),
    });

    const choice = response.choices[0];
    if (!choice) break;
    const assistantMsg = choice.message;

    const coreAssistantMsg = openAIAssistantToCoreMessage(assistantMsg);
    responseMessages.push(coreAssistantMsg);
    currentMessages.push(assistantMsg);

    if (
      choice.finish_reason !== "tool_calls" ||
      !assistantMsg.tool_calls?.length
    ) {
      break;
    }

    // Execute all tool calls in this step
    const toolResultParts: ToolResultPart[] = [];
    for (const tc of assistantMsg.tool_calls) {
      if (tc.type !== "function") continue;
      const toolName = tc.function.name;
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      } catch {
        args = {};
      }
      const toolFn = toolsToUse?.[toolName];
      const parsed = toolFn?.parameters.safeParse(args);
      const result = !toolFn
        ? { error: "Tool not found" }
        : !parsed?.success
          ? { error: "Invalid tool arguments", details: parsed?.error.issues }
          : await (toolFn.execute as (input: unknown) => Promise<unknown>)(
              parsed.data,
            );

      toolResultParts.push({
        type: "tool-result",
        toolCallId: tc.id,
        toolName,
        result,
      });
      currentMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      });
    }
    responseMessages.push({ role: "tool", content: toolResultParts });
  }

  return responseMessages;
}

export async function POST(req: Request) {
  // Authenticate
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
    return Response.json(
      { error: "OpenRouter API key is required." },
      { status: 400 },
    );
  }

  const openai = createOpenRouter(apiKey);

  const body = await req.json();
  const {
    messages,
    sessionId: incomingSessionId,
    model,
    enabledTools = [],
  }: {
    messages: CoreMessage[];
    sessionId?: string;
    model: string;
    enabledTools?: string[];
  } = body;

  // Resolve or create the session
  let sessionId = incomingSessionId;
  const isNewSession = !sessionId;

  if (isNewSession) {
    const firstUserMessage = messages.findLast((m) => m.role === "user");
    const rawContent = firstUserMessage?.content;
    const textContent =
      typeof rawContent === "string"
        ? rawContent
        : Array.isArray(rawContent)
          ? (rawContent as { type: string; text?: string }[])
              .filter((p) => p.type === "text" && typeof p.text === "string")
              .map((p) => p.text as string)
              .join(" ")
          : "New Chat";
    const title = textContent.slice(0, 50).trim() || "New Chat";

    const session = await createSession(user.id, model, enabledTools, title);
    sessionId = session.id;
  }

  // Save the last user message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    await saveMessage(sessionId!, lastMessage);
  }

  // Build enabled tools map (only the tools the user enabled)
  const toolsToUse =
    enabledTools.length > 0
      ? (Object.fromEntries(
          enabledTools
            .filter((id): id is keyof typeof ALL_TOOLS => id in ALL_TOOLS)
            .map((id) => [id, ALL_TOOLS[id]]),
        ) as Record<string, AnyTool>)
      : undefined;

  try {
    const openAIMessages = coreMessagesToOpenAI(messages);
    const responseMessages = await runWithTools(
      openai,
      model,
      openAIMessages,
      toolsToUse,
      5,
    );

    // Save all new assistant messages (including tool calls / results)
    for (const msg of responseMessages) {
      if (msg.role === "assistant" || msg.role === "tool") {
        await saveMessage(sessionId!, msg);
      }
    }
    // Bump session updated_at (and update model/tools if they changed)
    await updateSession(sessionId!, {
      model,
      tools_enabled: enabledTools,
    });

    return Response.json(
      { messages: responseMessages },
      {
        headers: buildSessionHeaders(sessionId!, isNewSession),
      },
    );
  } catch (error) {
    console.error("[chat/route] error:", error);

    if (error instanceof OpenRouterTimeoutError) {
      return Response.json(
        { error: "OpenRouter request timed out. Please try again." },
        {
          status: 504,
          headers: buildSessionHeaders(sessionId!, isNewSession),
        },
      );
    }

    if (error instanceof OpenRouterRequestError) {
      return Response.json(
        { error: "OpenRouter request failed. Please try again." },
        {
          status: 502,
          headers: buildSessionHeaders(sessionId!, isNewSession),
        },
      );
    }

    return Response.json(
      { error: "An error occurred" },
      {
        status: 500,
        headers: buildSessionHeaders(sessionId!, isNewSession),
      },
    );
  }
}
