import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/supabase/server";

const exchangeCode = createServerFn({ method: "GET" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(data.code);
    return { success: !error };
  });

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: (search.code as string) ?? "",
    next: (search.next as string) ?? "/",
  }),
  beforeLoad: async ({ search }) => {
    if (search.code) {
      const result = await exchangeCode({ data: { code: search.code } });
      if (result.success) {
        throw redirect({ to: search.next || "/" });
      }
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
