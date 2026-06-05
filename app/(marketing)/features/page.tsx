import type { Metadata } from "next";
import "./dash-hero.css";
import "./feature-demos.css";
import "./features.css";
import { FEATURES_HTML } from "./content";
import { FeaturesInteractions } from "./features-interactions";

export const metadata: Metadata = {
  title: "Features — ProScene",
  description:
    "Your whole production, at a glance. Calls, calendar, script, blocking, reports, people, and mobile — every part of the prompt book, connected.",
};

export default function FeaturesPage() {
  return (
    <>
      <div data-page="features" dangerouslySetInnerHTML={{ __html: FEATURES_HTML }} />
      <FeaturesInteractions />
    </>
  );
}
