import type { Metadata } from "next";
import "./contact.css";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact · Proscene",
  description:
    "Questions, feedback, a demo, or student verification: get in touch. We're former stage managers and we answer fast.",
};

const COPY: Record<string, { eyebrow: string; title: string; lede: string }> = {
  demo: {
    eyebrow: "Book a demo",
    title: "See Proscene on <em>your show.</em>",
    lede: "Tell us a bit about your production and we'll set up a walkthrough.",
  },
  school: {
    eyebrow: "Students & educators",
    title: "Get Proscene <em>free</em> for your school.",
    lede: "Verified students and educators get the Company plan free for school productions. Send us a note and we'll set you up.",
  },
  general: {
    eyebrow: "Get in touch",
    title: "Talk to a <em>human.</em>",
    lede: "Questions, feedback, or anything else: we're former stage managers and we answer in hours, not days.",
  },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const r = reason === "demo" ? "demo" : reason === "school" ? "school" : "general";
  const copy = COPY[r];
  const scheduler = process.env.NEXT_PUBLIC_DEMO_SCHEDULER_URL;

  return (
    <div data-page="contact">
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow no-rule" style={{ justifyContent: "center" }}>
            {copy.eyebrow}
          </span>
          <h1
            className="display"
            style={{ marginTop: 16, fontSize: "clamp(34px,5vw,56px)" }}
            dangerouslySetInnerHTML={{ __html: copy.title }}
          />
          <p className="lede" style={{ margin: "16px auto 0", maxWidth: "48ch" }}>
            {copy.lede}
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="wrap cf-wrap">
          {r === "demo" && scheduler && (
            <p className="cf-demo-note">
              Prefer to pick a time?{" "}
              <a className="btn-link" href={scheduler} target="_blank" rel="noopener noreferrer">
                Book a slot directly →
              </a>
            </p>
          )}
          <ContactForm reason={r} />
        </div>
      </section>
    </div>
  );
}
