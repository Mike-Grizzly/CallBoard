import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for privileged server-side operations
 * (creating/inviting auth users via the Admin API).
 *
 * NEVER import this from a client component — the service-role key must
 * never reach the browser. Use only inside `"use server"` actions.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Admin Supabase client unavailable. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local to invite people.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
