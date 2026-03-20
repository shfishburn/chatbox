import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileSidebarBackdrop from "@/components/layout/MobileSidebarBackdrop";
import Sidebar from "@/components/layout/Sidebar";
import { getAuthUser } from "@/lib/server/auth";
import { getSessionsForUser } from "@/lib/server/sessions";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const user = await getAuthUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    const sessions = await getSessionsForUser();
    return { user, sessions };
  },
  component: AppLayout,
});

function AppLayout() {
  const { user, sessions } = Route.useRouteContext();

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <div className="hidden md:flex">
        <Sidebar user={user} initialSessions={sessions} />
      </div>
      <div className="md:hidden">
        <MobileSidebarBackdrop />
        <Sidebar user={user} initialSessions={sessions} mobile />
      </div>
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <MobileHeader />
        <Outlet />
      </main>
    </div>
  );
}
