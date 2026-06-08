import type { Metadata } from "next";
import "./home.css";
import { HOME_HTML, HOME_REST_HTML } from "./home-content";
import { getHomePage } from "@/lib/sanity/queries";
import { SanityHero } from "./sanity-hero";

export const metadata: Metadata = {
  title: "Proscene — The production hub for stage managers",
  description:
    "The paper call board, reinvented. Proscene keeps your whole production on the same page — calls, calendars, scripts, blocking, and reports.",
};

export const revalidate = 60;

export default async function HomePage() {
  const home = await getHomePage();

  // Editable hero from Sanity (once a Home page doc with a headline exists);
  // otherwise the full static page.
  if (home?.heroHeadline) {
    return (
      <div data-page="home">
        <SanityHero home={home} />
        <div dangerouslySetInnerHTML={{ __html: HOME_REST_HTML }} />
      </div>
    );
  }

  return <div data-page="home" dangerouslySetInnerHTML={{ __html: HOME_HTML }} />;
}
