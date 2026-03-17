import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/db/sessions";
import { getMessages } from "@/lib/db/messages";
import ChatWindow from "@/components/chat/ChatWindow";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const session = await getSession(sessionId);
  if (!session || session.user_id !== user.id) notFound();

  const messages = await getMessages(sessionId);

  return (
    <ChatWindow
      sessionId={sessionId}
      initialModel={session.model}
      initialTools={session.tools_enabled}
      initialMessages={messages}
    />
  );
}
