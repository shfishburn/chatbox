import { createServerClient } from "@supabase/ssr";
import { getRequest } from "@tanstack/react-start/server";

export async function createClient() {
  const request = getRequest();
  const cookieHeader = request?.headers.get("cookie") ?? "";

  // Parse cookies from the request header
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    }),
  );

  const responseCookies: { name: string; value: string; options?: object }[] = [];

  return createServerClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(cookies)
            .filter(([key]) => key.length > 0)
            .map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            responseCookies.push(cookie);
          }
        },
      },
    },
  );
}
