import type { CoreMessage } from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";
import type { DbMessage } from "@/lib/supabase/types";

export async function getMessages(sessionId: string): Promise<CoreMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as DbMessage[]).map(rowToMessage);
}

export async function saveMessage(sessionId: string, message: CoreMessage): Promise<DbMessage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      session_id: sessionId,
      role: message.role as "user" | "assistant" | "tool",
      content: message.content as unknown as import("@/lib/supabase/types").Json,
    } as never)
    .select()
    .single();

  if (error) throw error;
  return data as DbMessage;
}

function rowToMessage(row: DbMessage): CoreMessage {
  return {
    role: row.role,
    content: row.content,
  } as CoreMessage;
}
