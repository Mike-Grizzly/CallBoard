import type { Metadata } from "next";
import "./faq.css";
import { FAQ_HTML } from "./content";
import { FaqInteractions } from "./faq-interactions";

export const metadata: Metadata = {
  title: "FAQ — ProScene",
  description:
    "Everything stage managers ask before their first show — getting started, the company, features, billing, and data & privacy.",
};

export default function FaqPage() {
  return (
    <>
      <div data-page="faq" dangerouslySetInnerHTML={{ __html: FAQ_HTML }} />
      <FaqInteractions />
    </>
  );
}
