import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Magic-byte validators keyed by MIME type. Each function receives the first
// 12 bytes of the uploaded file and returns true only if the byte signature
// matches the declared type. This catches files that lie about their type at
// the Content-Type header level before any DB record is written.
export const UPLOAD_MAGIC_BYTES: Record<string, (b: Buffer) => boolean> = {
  "application/pdf": (b) => b.slice(0, 4).toString("ascii") === "%PDF",
  "image/png": (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/gif": (b) =>
    b.slice(0, 6).toString("ascii") === "GIF87a" ||
    b.slice(0, 6).toString("ascii") === "GIF89a",
  "image/webp": (b) =>
    b.slice(0, 4).toString("ascii") === "RIFF" &&
    b.slice(8, 12).toString("ascii") === "WEBP",
  "text/plain": (b) => {
    // No universal magic bytes for plain text — reject anything that starts
    // with a known binary signature.
    return !(
      (b[0] === 0xff && b[1] === 0xd8) ||           // JPEG
      (b[0] === 0x89 && b[1] === 0x50) ||           // PNG
      b.slice(0, 4).toString("ascii") === "%PDF" || // PDF
      (b[0] === 0xd0 && b[1] === 0xcf) ||           // Old Office (CFB)
      (b[0] === 0x50 && b[1] === 0x4b)              // ZIP / OOXML
    );
  },
  // Old binary Office formats use Compound File Binary (D0 CF 11 E0).
  "application/msword": (b) =>
    b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
  "application/vnd.ms-excel": (b) =>
    b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
  "application/vnd.ms-powerpoint": (b) =>
    b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
  // Modern OOXML formats are ZIP archives (PK header).
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (
    b,
  ) => b[0] === 0x50 && b[1] === 0x4b,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (b) =>
    b[0] === 0x50 && b[1] === 0x4b,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": (
    b,
  ) => b[0] === 0x50 && b[1] === 0x4b,
};

/**
 * Fetches the first 12 bytes of a file from the attachments bucket via a
 * short-lived signed URL and validates them against the declared content type.
 *
 * Accepts a pre-created admin client so the caller can reuse it (e.g. for a
 * follow-up delete if validation fails).
 */
export async function verifyUploadMagicBytes(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  storagePath: string,
  contentType: string,
): Promise<boolean> {
  const checker = UPLOAD_MAGIC_BYTES[contentType];
  if (!checker) return false;

  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 30);
  if (error || !data?.signedUrl) return false;

  const res = await fetch(data.signedUrl, { headers: { Range: "bytes=0-11" } });
  if (!res.ok) return false;

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4) return false;

  return checker(buf);
}
