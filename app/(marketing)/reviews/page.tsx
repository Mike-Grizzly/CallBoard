import type { Metadata } from "next";
import "./reviews.css";
import { REVIEWS_HTML } from "./content";

export const metadata: Metadata = {
  title: "Reviews — Proscene",
  description:
    "From the people holding the book. 4.9/5 from 600+ productions — why stage managers run their shows on Proscene.",
};

export default function ReviewsPage() {
  return (
    <div data-page="reviews" dangerouslySetInnerHTML={{ __html: REVIEWS_HTML }} />
  );
}
