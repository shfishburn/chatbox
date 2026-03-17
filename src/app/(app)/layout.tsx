import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessions } from "@/lib/db/sessions";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const sessions = await getSessions(user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar user={user} initialSessions={sessions} />
      </div>
      {/* Mobile sidebar (drawer) */}
      <div className="md:hidden">
        <Sidebar user={user} initialSessions={sessions} mobile />
      </div>
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <MobileHeader />
        {children}
      </main>
    </div>
  );
}
