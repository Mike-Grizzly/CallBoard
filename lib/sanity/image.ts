import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "./client";

const builder = imageUrlBuilder(sanityClient);

/** Build a CDN URL for a Sanity image (returns null when there's no image). */
export function urlForImage(source: SanityImageSource | undefined | null) {
  if (!source) return null;
  return builder.image(source);
}
