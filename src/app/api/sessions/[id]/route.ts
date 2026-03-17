import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as {
    model?: string;
    tools_enabled?: string[];
  };

  const updates: { model?: string; tools_enabled?: string[] } = {};
  if (typeof body.model === "string") updates.model = body.model;
  if (Array.isArray(body.tools_enabled))
    updates.tools_enabled = body.tools_enabled;

  if (Object.keys(updates).length === 0) {
    return new Response("No valid updates provided", { status: 400 });
  }

  // RLS + user_id filter ensure users can only mutate their own sessions
  const { error } = await supabase
    .from("chat_sessions")
    .update(updates as never)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(null, { status: 204 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // RLS ensures users can only delete their own sessions
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
