import type { Metadata } from "next";
import "./reviews.css";
import { REVIEWS_HTML } from "./content";
import { getTestimonials, getLogos } from "@/lib/sanity/queries";
import { SanityReviews } from "./sanity-reviews";

export const metadata: Metadata = {
  title: "Reviews — Proscene",
  description:
    "What stage managers say about running their productions on Proscene.",
};

export const revalidate = 60;

export default async function ReviewsPage() {
  const [testimonials, logos] = await Promise.all([getTestimonials(), getLogos()]);

  if (testimonials.length > 0) {
    return (
      <div data-page="reviews">
        <SanityReviews testimonials={testimonials} logos={logos} />
      </div>
    );
  }

  // No testimonials yet → honest "coming soon" placeholder.
  return (
    <div data-page="reviews" dangerouslySetInnerHTML={{ __html: REVIEWS_HTML }} />
  );
}
