import { createFileRoute } from "@tanstack/react-router";
import ChatWindow from "@/components/chat/ChatWindow";

export const Route = createFileRoute("/_app/chat")({
  component: NewChatPage,
});

function NewChatPage() {
  return <ChatWindow />;
}
