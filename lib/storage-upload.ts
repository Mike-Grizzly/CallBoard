import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Uploads a file straight from the browser to Supabase Storage using a
 * server-issued signed upload URL. The file never passes through the
 * Next.js server, so it is not subject to Vercel's request body limit —
 * the cap becomes the Supabase bucket's file-size setting.
 */
export async function uploadFileToSignedUrl(
  path: string,
  token: string,
  file: File,
): Promise<{ error?: string }> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from("attachments")
    .uploadToSignedUrl(path, token, file);
  return error ? { error: error.message } : {};
}
