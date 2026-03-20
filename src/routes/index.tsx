import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAuthUser } from "@/lib/server/auth";
import LandingPage from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const user = await getAuthUser();
    if (user) {
      throw redirect({ to: "/chat" });
    }
  },
  component: LandingPage,
});
