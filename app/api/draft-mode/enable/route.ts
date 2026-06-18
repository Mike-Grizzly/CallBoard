import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { sanityClient } from "@/lib/sanity/client";

// Turns Draft Mode ON. The Studio's Presentation tool calls this route (it's
// wired up via `previewUrl.previewMode.enable` in sanity.config.ts) with a
// signed preview URL; defineEnableDraftMode validates that signature against
// the Sanity token before setting the cookie, so an anonymous visitor can't
// flip themselves into preview. Needs a read token to validate + view drafts.
export const { GET } = defineEnableDraftMode({
  client: sanityClient.withConfig({
    token: process.env.SANITY_API_READ_TOKEN,
  }),
});
