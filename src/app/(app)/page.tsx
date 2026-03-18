import { redirect } from "next/navigation";
import { getSessions } from "@/lib/db/sessions";
import { createClient } from "@/lib/supabase/server";

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const sessions = await getSessions(user.id);
  if (sessions.length > 0) {
    redirect(`/chat/${sessions[0].id}`);
  }

  redirect("/chat");
}
