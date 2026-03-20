import { createFileRoute } from "@tanstack/react-router";
import ChatWindow from "@/components/chat/ChatWindow";
import { getSessionWithMessages } from "@/lib/server/sessions";

export const Route = createFileRoute("/_app/chat/$sessionId")({
  loader: async ({ params }) => {
    const result = await getSessionWithMessages({ data: { sessionId: params.sessionId } });
    if (!result) {
      throw new Error("Session not found");
    }
    return result;
  },
  component: ChatSessionPage,
});

function ChatSessionPage() {
  const { session, messages } = Route.useLoaderData();

  return (
    <ChatWindow
      sessionId={session.id}
      initialModel={session.model}
      initialTools={session.tools_enabled}
      initialMessages={messages}
    />
  );
}
