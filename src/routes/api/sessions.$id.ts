import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@/lib/supabase/server";

export const Route = createFileRoute("/api/sessions/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = (await request.json()) as {
          model?: string;
          tools_enabled?: string[];
        };

        const updates: { model?: string; tools_enabled?: string[] } = {};
        if (typeof body.model === "string") updates.model = body.model;
        if (Array.isArray(body.tools_enabled)) updates.tools_enabled = body.tools_enabled;

        if (Object.keys(updates).length === 0) {
          return new Response("No valid updates provided", { status: 400 });
        }

        const { error } = await supabase
          .from("chat_sessions")
          .update(updates as never)
          .eq("id", params.id)
          .eq("user_id", user.id);

        if (error) {
          return new Response(error.message, { status: 500 });
        }

        return new Response(null, { status: 204 });
      },
      DELETE: async ({ params }) => {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { error } = await supabase
          .from("chat_sessions")
          .delete()
          .eq("id", params.id)
          .eq("user_id", user.id);

        if (error) {
          return new Response(error.message, { status: 500 });
        }

        return new Response(null, { status: 204 });
      },
    },
  },
});
