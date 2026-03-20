import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/supabase/server";
import type { ChatSession } from "@/lib/supabase/types";

export const getSessionsForUser = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [] as ChatSession[];

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ChatSession[];
  });

export const getSessionWithMessages = createServerFn({ method: "GET" })
  .validator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", data.sessionId)
      .single();

    if (sessionError || !session) return null;
    if ((session as ChatSession).user_id !== user.id) return null;

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    return {
      session: session as ChatSession,
      messages: (messages ?? []).map((row: { role: string; content: unknown }) => ({
        role: row.role,
        content: row.content,
      })),
    };
  });
