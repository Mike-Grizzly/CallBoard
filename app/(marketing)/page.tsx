import type { Metadata } from "next";
import "./home.css";
import { HOME_HTML, HOME_REST_HTML } from "./home-content";
import { getHomePage } from "@/lib/sanity/queries";
import { SanityHero } from "./sanity-hero";

export const metadata: Metadata = {
  title: "Proscene: the one place your show lives",
  description:
    "Calls, calendar, script, blocking, and reports, connected and shared by everyone. Proscene keeps cast, crew, and creative teams on the same page, from first read to closing night.",
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
