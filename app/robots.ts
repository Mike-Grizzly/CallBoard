import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Marketing pages, blog, and the /docs manual are crawlable; the app itself
// is auth-gated and kept out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/studio/",
          "/dashboard",
          "/productions",
          "/people",
          "/calendar",
          "/settings",
          "/setup",
          "/workspaces",
          "/focus",
          "/invite/",
          "/login",
          "/signup/confirm",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
