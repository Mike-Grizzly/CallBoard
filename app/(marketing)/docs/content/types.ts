// Typed content model for the public help manual at /docs.
// Content is static, first-party HTML authored in this repo (same pattern as
// the other marketing `content.ts` files) — it never contains user input, so
// it renders via dangerouslySetInnerHTML without the app's sanitize path.

export type DocLink = { label: string; href: string };

export type DocStep = {
  title: string;
  /** One action per step, stated imperatively, with the expected result. HTML. */
  body: string;
};

export type DocBlock = { heading: string; body: string };

export type DocFaq = {
  /** Phrased as the symptom or question someone would actually search. */
  question: string;
  answer: string;
};

export type DocPage = {
  slug: string;
  /** H1 — matches the task exactly as someone would search it. */
  title: string;
  /** Meta description, 120–155 characters. */
  description: string;
  kind: "how-to" | "concept" | "troubleshooting";
  /** One or two sentences: what this page covers and who it's for. HTML. */
  intro: string;
  /** Numbered steps (how-to pages). Emits HowTo structured data. */
  steps?: DocStep[];
  /** Free-form sections — the body of concept pages, or context after steps. */
  blocks?: DocBlock[];
  /** Symptom → fix Q&A (troubleshooting pages). Emits FAQPage structured data. */
  faqs?: DocFaq[];
  /** "If you hit this problem, here's the fix" callout. HTML. */
  tip?: string;
  /** 2–3 links to the logical next actions. */
  nextSteps?: DocLink[];
  /** 3–4 cross-links to related manual pages or blog posts. */
  related?: DocLink[];
};

export type DocSection = {
  slug: string;
  title: string;
  /** One-liner for hub cards and the overview lede. */
  blurb: string;
  /** Meta description for the section overview page. */
  description: string;
  /** Overview prose: what this feature area does and who it's for. */
  overview: DocBlock[];
  /** Marketing feature anchor (e.g. "/features#reports") — never the homepage. */
  featureHref: string;
  /** CTA label for featureHref. Defaults to "See the feature". */
  featureLinkLabel?: string;
  pages: DocPage[];
};
