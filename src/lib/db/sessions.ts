import { createClient } from "@/lib/supabase/server";
import type { ChatSession } from "@/lib/supabase/types";

export async function getSessions(userId: string): Promise<ChatSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ChatSession[];
}

export async function getSession(id: string): Promise<ChatSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ChatSession;
}

export async function createSession(
  userId: string,
  model: string,
  toolsEnabled: string[],
  title?: string,
): Promise<ChatSession> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      title: title ?? "New Chat",
      model,
      tools_enabled: toolsEnabled,
    } as never)
    .select()
    .single();

  if (error) throw error;
  return data as ChatSession;
}

export async function updateSession(
  id: string,
  updates: { title?: string; model?: string; tools_enabled?: string[] },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chat_sessions")
    .update(updates as never)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("chat_sessions").delete().eq("id", id);

  if (error) throw error;
}
