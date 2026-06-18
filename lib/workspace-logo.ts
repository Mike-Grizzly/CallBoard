import "server-only";
import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Sign the workspace logo's storage path for display. Returns null if
 * the org has no logo or the signing failed. Wrapped in `cache()` so
 * the rail + settings header share a single signed URL per request
 * instead of issuing two.
 */
export const getSignedLogoUrl = cache(
  async (logoPath: string | null): Promise<string | null> => {
    if (!logoPath) return null;
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(logoPath, 60 * 60);
    if (error || !data) return null;
    return data.signedUrl;
  },
);
