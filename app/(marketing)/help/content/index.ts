import type { DocLink, DocPage, DocSection } from "./types";
import { getStarted } from "./get-started";
import { productions } from "./productions";
import { people } from "./people";
import { scheduling } from "./scheduling";
import { reports } from "./reports";
import { script } from "./script";
import { blocking } from "./blocking";
import { troubleshooting } from "./troubleshooting";

export const DOC_SECTIONS: DocSection[] = [
  getStarted,
  productions,
  people,
  scheduling,
  reports,
  script,
  blocking,
  troubleshooting,
];

export function getSection(slug: string): DocSection | undefined {
  return DOC_SECTIONS.find((s) => s.slug === slug);
}

export function getPage(
  sectionSlug: string,
  pageSlug: string,
): { section: DocSection; page: DocPage } | undefined {
  const section = getSection(sectionSlug);
  const page = section?.pages.find((p) => p.slug === pageSlug);
  return section && page ? { section, page } : undefined;
}

// Hand-picked for the hub's "Most-read articles" list — the pages the SEO
// plan expects to carry the most search and support traffic.
export const POPULAR_PAGES: DocLink[] = [
  {
    label: "Set up your first production",
    href: "/help/get-started/set-up-your-first-production",
  },
  {
    label: "Create a rehearsal report",
    href: "/help/reports/creating-a-rehearsal-report",
  },
  {
    label: "Create and send a rehearsal call",
    href: "/help/scheduling/creating-calls",
  },
  {
    label: "Import a cast list from a spreadsheet",
    href: "/help/people/importing-cast-csv",
  },
  {
    label: "Capture blocking beat by beat",
    href: "/help/blocking/capturing-blocking-beats",
  },
  {
    label: "Invite and sign-in problems",
    href: "/help/troubleshooting/invites-and-access",
  },
];
