import type { Metadata } from "next";
import "./dash-hero.css";
import "./feature-demos.css";
import "./features.css";
import { FEATURES_HTML } from "./content";
import { FeaturesInteractions } from "./features-interactions";

export const metadata: Metadata = {
  title: "Features · Proscene",
  description:
    "One shared home for the whole production. See how Proscene's calls, calendar, script, blocking, reports, and people tools serve cast, crew, and creative teams.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <>
      <div
        data-page="features"
        data-segment="cast"
        dangerouslySetInnerHTML={{ __html: FEATURES_HTML }}
      />
      <FeaturesInteractions />
    </>
  );
}
