import { cookies } from "next/headers";
import { THEME_COOKIE, type ThemePref } from "./theme";

/** Server-side read of the stored theme preference, for seeding client
 *  components so their first render matches the cookie (no flicker). */
export async function getThemePref(): Promise<ThemePref> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}
