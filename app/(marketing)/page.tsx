import type { Metadata } from "next";
import "./home.css";
import { HOME_HTML, HOME_REST_HTML } from "./home-content";
import { getHomePage } from "@/lib/sanity/queries";
import { SanityHero } from "./sanity-hero";
import { JsonLd } from "./_components/json-ld";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Proscene: the one place your show lives",
  description:
    "Calls, calendar, script, blocking, and reports, connected and shared by everyone. Proscene keeps cast, crew, and creative teams on the same page, from first read to closing night.",
  alternates: { canonical: "/" },
};

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Proscene",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  sameAs: [],
};

const APP_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Proscene",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Theatre production management software: rehearsal calls, calendar, script, blocking, and rehearsal reports for cast, crew, and creative teams.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free during open beta",
  },
};

export const revalidate = 60;

export default async function HomePage() {
  const home = await getHomePage();

  // Editable hero from Sanity (once a Home page doc with a headline exists);
  // otherwise the full static page.
  if (home?.heroHeadline) {
    return (
      <div data-page="home">
        <JsonLd data={ORG_SCHEMA} />
        <JsonLd data={APP_SCHEMA} />
        <SanityHero home={home} />
        <div dangerouslySetInnerHTML={{ __html: HOME_REST_HTML }} />
      </div>
    );
  }

  return (
    <div data-page="home">
      <JsonLd data={ORG_SCHEMA} />
      <JsonLd data={APP_SCHEMA} />
      <div dangerouslySetInnerHTML={{ __html: HOME_HTML }} />
    </div>
  );
}
