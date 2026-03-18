import { streamText, type CoreMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { createOpenRouter } from "@/lib/ai/openrouter";
import { ALL_TOOLS } from "@/lib/ai/tools";
import { createSession, updateSession } from "@/lib/db/sessions";
import { saveMessage } from "@/lib/db/messages";
export const maxDuration = 60;

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

  const openrouter = createOpenRouter(apiKey);

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
          ? rawContent
              .filter(
                (p: { type: string; text?: string }) =>
                  p.type === "text" && typeof p.text === "string",
              )
              .map((p: { type: string; text?: string }) => p.text as string)
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
      ? Object.fromEntries(
          enabledTools
            .filter((id) => id in ALL_TOOLS)
            .map((id) => [id, ALL_TOOLS[id]]),
        )
      : undefined;

  const result = streamText({
    model: openrouter(model),
    messages,
    tools: toolsToUse,
    maxSteps: 5,
    onError: ({ error }) => {
      console.error("[chat/route] streamText error:", error);
    },
    onFinish: async ({ response }) => {
      // Save all new assistant messages (including tool calls / results)
      for (const msg of response.messages) {
        if (msg.role === "assistant" || msg.role === "tool") {
          await saveMessage(sessionId!, msg as CoreMessage);
        }
      }
      // Bump session updated_at (and update model/tools if they changed)
      await updateSession(sessionId!, {
        model,
        tools_enabled: enabledTools,
      });
    },
  });

  // Attach session ID to response headers so the client can redirect
  const dataStream = result.toDataStreamResponse({
    getErrorMessage: (error) => {
      if (error instanceof Error) return error.message;
      return String(error);
    },
  });
  const headers = new Headers(dataStream.headers);
  headers.set("X-Session-Id", sessionId!);
  headers.set("X-Is-New-Session", isNewSession ? "true" : "false");

  return new Response(dataStream.body, {
    status: dataStream.status,
    headers,
  });
}
