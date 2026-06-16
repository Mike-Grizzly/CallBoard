import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import type { ReactNode } from "react";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import {
  getProductionMembers,
  getProductionMembership,
} from "@/features/members/queries";
import { getReportCountByProduction, getDeletedReportCountByProduction } from "@/features/reports/queries";
import { getDocumentCountByProduction, getDeletedDocumentCountByProduction } from "@/features/documents/queries";
import { getVideoCountByProduction } from "@/features/videos/queries";
import { getAnnouncementCountByProduction } from "@/features/announcements/queries";
import { TrashDrawer } from "./trash-drawer";
import { ProductionTabsNav, type ProductionTab } from "./production-tabs";

const STATUS_COPY: Record<
  string,
  { label: string; tone: "sage" | "amber" | "dusk" }
> = {
  active: { label: "In rehearsal", tone: "sage" },
  draft: { label: "Draft", tone: "dusk" },
  archived: { label: "Archived", tone: "amber" },
};

function memberDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string,
): string {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || email;
}

function formatOpening(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Render the show title with the last word italicized in the curtain
 * accent ("The Pirates of <em>Penzance</em>"). Falls back to the whole
 * title if it's a single word.
 */
function ShowTitle({ title }: { title: string }) {
  const trimmed = title.trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace === -1) return <>{trimmed}</>;
  return (
    <>
      {trimmed.slice(0, lastSpace)} <em>{trimmed.slice(lastSpace + 1)}</em>
    </>
  );
}

export default async function ProductionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const production = await getProductionBySlug(user.organizationId, slug);

  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  const canCreateReports = can(user.role, "reports:create");
  const canViewBlocking = can(user.role, "blocking:view");
  const canViewNotes = can(user.role, "notes:view");
  const canViewVideos = can(user.role, "videos:view");

  const [
    members,
    reportCount,
    documentCount,
    videoCount,
    announcementCount,
    deletedDocCount,
    deletedReportCount,
  ] = await Promise.all([
    getProductionMembers(production.id),
    getReportCountByProduction(production.id),
    getDocumentCountByProduction(production.id),
    getVideoCountByProduction(production.id),
    getAnnouncementCountByProduction(production.id, user.organizationId),
    getDeletedDocumentCountByProduction(production.id),
    getDeletedReportCountByProduction(production.id),
  ]);

  const initialTrashCount = deletedDocCount + deletedReportCount;

  const director = members.find((m) => m.role === "director");
  const directorName = director
    ? memberDisplayName(director.firstName, director.lastName, director.email)
    : null;

  const status = STATUS_COPY[production.status] ?? STATUS_COPY.draft;

  const tabs: ProductionTab[] = [
    {
      label: "Overview",
      href: `/productions/${slug}`,
      icon: "Layout",
    },
    {
      label: "Rehearsal Reports",
      href: `/productions/${slug}/reports`,
      icon: "FileText",
      count: reportCount,
    },
  ];
  if (canViewNotes) {
    tabs.push({
      label: "My Notes",
      href: `/productions/${slug}/notes`,
      icon: "PenLine",
    });
  }
  tabs.push(
    {
      label: "Rehearsal Schedule",
      href: `/productions/${slug}/calls`,
      icon: "Phone",
    },
    {
      label: "Documents",
      href: `/productions/${slug}/documents`,
      icon: "FolderOpen",
      count: documentCount,
    },
    {
      label: "Announcements",
      href: `/productions/${slug}/announcements`,
      icon: "Megaphone",
      count: announcementCount,
    },
  );

  if (canViewVideos) {
    tabs.push({
      label: "Rehearsal Video",
      href: `/productions/${slug}/videos`,
      icon: "Clapperboard",
      count: videoCount,
    });
  }

  if (canViewBlocking) {
    tabs.push({
      label: "Blocking",
      href: `/productions/${slug}/blocking`,
      icon: "Layout",
    });
  }

  tabs.push({
    label: "Your Script",
    href: `/productions/${slug}/script`,
    icon: "BookOpen",
  });

  if (canManage) {
    tabs.push({
      label: "Settings",
      href: `/productions/${slug}/settings`,
      icon: "Settings",
    });
  }

  return (
    <>
      <header className="topbar">
        <div className="crumbs">
          <Link href="/productions">Productions</Link>
          <ChevronRight className="sep" size={12} aria-hidden />
          <span className="now">{production.title}</span>
        </div>

        <div className="topbar-row">
          <div>
            <h1 className="show-title">
              <ShowTitle title={production.title} />
            </h1>
            <div className="show-sub">
              <span
                className="show-status"
                style={{ color: `var(--c-${status.tone})` }}
              >
                <span
                  className="dot"
                  style={{ background: `var(--c-${status.tone})` }}
                />
                {status.label}
              </span>
              {production.openingDate && (
                <>
                  <span className="pip" aria-hidden />
                  <span>Opens {formatOpening(production.openingDate)}</span>
                </>
              )}
              {production.closingDate && (
                <>
                  <span className="pip" aria-hidden />
                  <span>
                    Closes{" "}
                    {new Date(
                      `${production.closingDate}T00:00:00`,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
              {directorName && (
                <>
                  <span className="pip" aria-hidden />
                  <span>
                    Dir.{" "}
                    <b style={{ color: "var(--ink-2)", fontWeight: 500 }}>
                      {directorName}
                    </b>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="btn ghost btn-icon"
              title="Search"
              aria-label="Search"
            >
              <Search className="ico" aria-hidden />
            </button>
            <TrashDrawer productionId={production.id} initialTrashCount={initialTrashCount} />
            {canManage && (
              <Link
                href={`/productions/${slug}/members`}
                className="btn"
              >
                <Icon name="Users" className="ico" aria-hidden />
                <span>Cast &amp; Crew</span>
              </Link>
            )}
            {canCreateReports && (
              <Link
                href={`/productions/${slug}/reports/new`}
                className="btn primary"
              >
                <Icon name="Plus" className="ico" aria-hidden />
                <span>New report</span>
              </Link>
            )}
          </div>
        </div>

        <ProductionTabsNav tabs={tabs} />
      </header>

      <div className="page">{children}</div>
    </>
  );
}
