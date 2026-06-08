import type { Metadata } from "next";
import "./faq.css";
import { FAQ_HTML } from "./content";
import { FaqInteractions } from "./faq-interactions";
import { getFaqItems } from "@/lib/sanity/queries";
import { SanityFaq } from "./sanity-faq";

export const metadata: Metadata = {
  title: "FAQ — Proscene",
  description:
    "Everything stage managers ask before their first show — getting started, the company, features, billing, and data & privacy.",
};

export const revalidate = 60;

export default async function FaqPage() {
  const items = await getFaqItems();
  return (
    <>
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
