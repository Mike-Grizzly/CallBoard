import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers.
 *
 * Uses Next.js 16's async `cookies()` and the `@supabase/ssr` `getAll` /
 * `setAll` interface. Do NOT import this from client components.
 *
 * Note: during Server Component rendering, `cookieStore.set` is not
 * permitted by Next.js. We swallow the resulting error in that case —
 * the session will still be refreshed on the next Server Action or
 * Route Handler invocation.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — Next.js disallows cookie mutation there.
          // The session will be refreshed on the next Server Action/Route Handler.
        }
      },
    },
  });
}
