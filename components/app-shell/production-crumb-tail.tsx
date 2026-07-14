"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

/**
 * N6 — positional breadcrumbs for deep production routes.
 *
 * The production layout renders a static `Productions › <Show>` crumb for
 * every sub-route, so a page five levels deep (e.g.
 * `calls/templates/[id]/edit`) gave no sense of where you were or how to get
 * back. This client tail reads the current path and appends the tab and any
 * intermediate segments as links, so from any depth one visible click returns
 * to the parent list. The leaf (current page) renders as plain text.
 *
 * Labels are static and mirror the tab strip; dynamic id segments (report ids,
 * call ids, template ids) carry no human-readable label and are skipped as
 * crumbs — their href still threads through the cumulative path so the
 * following crumb links correctly.
 */
const TAB_LABELS: Record<string, string> = {
  members: "Cast & Crew",
  reports: "Rehearsal Reports",
  notes: "My Notes",
  calls: "Rehearsal Schedule",
  documents: "Documents",
  announcements: "Announcements",
  videos: "Rehearsal Video",
  blocking: "Blocking",
  script: "Your Script",
  settings: "Settings",
};

const SUB_LABELS: Record<string, string> = {
  new: "New",
  edit: "Edit",
  templates: "Templates",
  generate: "Generate",
};

type Crumb = { label: string; href: string };

export function ProductionCrumbTail({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/productions/${slug}`;

  if (!pathname || !pathname.startsWith(base)) return null;

  const rest = pathname.slice(base.length).split("/").filter(Boolean);
  if (rest.length === 0) return null; // Overview — the static crumb is enough.

  const crumbs: Crumb[] = [];
  let href = base;

  // First segment is always a tab.
  const [tabSeg, ...deeper] = rest;
  href += `/${tabSeg}`;
  const tabLabel = TAB_LABELS[tabSeg];
  if (!tabLabel) return null; // Unknown tab — don't guess.
  crumbs.push({ label: tabLabel, href });

  // Remaining segments: label the ones we recognise, thread ids silently.
  for (const seg of deeper) {
    href += `/${seg}`;
    const label = SUB_LABELS[seg];
    if (label) crumbs.push({ label, href });
  }

  return (
    <>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={c.href} style={{ display: "contents" }}>
            <ChevronRight className="sep" size={12} aria-hidden />
            {isLast ? (
              <span className="now" aria-current="page">
                {c.label}
              </span>
            ) : (
              <Link href={c.href}>{c.label}</Link>
            )}
          </span>
        );
      })}
    </>
  );
}
