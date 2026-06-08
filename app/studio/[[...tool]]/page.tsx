import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

// The content editor, served at /studio. It authenticates against Sanity
// (not the app's auth), so the route is allow-listed as public in proxy.ts.
export default function StudioPage() {
  return <NextStudio config={config} />;
}
