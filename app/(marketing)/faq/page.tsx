import type { Metadata } from "next";
import "./faq.css";
import { FAQ_HTML } from "./content";
import { FaqInteractions } from "./faq-interactions";
import { getFaqItems } from "@/lib/sanity/queries";
import { SanityFaq } from "./sanity-faq";
import { JsonLd } from "../_components/json-ld";

export const metadata: Metadata = {
  title: "FAQ · Proscene",
  description:
    "Everything stage managers ask before their first show: getting started, the company, features, billing, and data and privacy.",
  alternates: { canonical: "/faq" },
};

export const revalidate = 60;

export default async function FaqPage() {
  const items = await getFaqItems();
  const faqSchema =
    items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((i) => ({
            "@type": "Question",
            name: i.question,
            acceptedAnswer: { "@type": "Answer", text: i.answer },
          })),
        }
      : null;
  return (
    <>
      {faqSchema && <JsonLd data={faqSchema} />}
      <div data-page="faq">
        {items.length > 0 ? (
          <SanityFaq items={items} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: FAQ_HTML }} />
        )}
      </div>
      <FaqInteractions />
    </>
  );
}
