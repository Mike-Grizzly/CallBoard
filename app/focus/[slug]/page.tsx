import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import {
  getDefaultScript,
  getScriptAnnotations,
} from "@/features/scripts/queries";
import { getScriptUrl, ensureMemberBookmarks } from "@/features/scripts/actions";
import type {
  Annotation,
  Bookmark,
  PageOverrides,
} from "@/features/scripts/constants";
import { ScriptViewer } from "@/app/(app)/productions/[slug]/script/script-viewer";
import { FocusShell } from "./focus-shell";

type CurrentUserLike = {
  firstName: string | null;
  lastName: string | null;
  email: string;
};

function userInitials(user: CurrentUserLike): string {
  const a = user.firstName?.trim()?.[0] ?? "";
  const b = user.lastName?.trim()?.[0] ?? "";
  const combined = `${a}${b}`.toUpperCase();
  return combined || user.email.trim().charAt(0).toUpperCase() || "?";
}

/**
 * Full-screen Focus View route. Lives OUTSIDE the `(app)` group on purpose so it
 * escapes the app rail AND the production topbar/tabs — the whole point of focus
 * mode. Auth + production access mirror the script page; data fetching is reused
 * verbatim so the embedded ScriptViewer behaves exactly as on its own tab.
 */
export default async function FocusPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { slug } = await params;
  const { mode: modeParam } = await searchParams;
  const mode = modeParam === "blocking" ? "blocking" : "script";

  const user = await requireCurrentUser();
  const production = await getProductionBySlug(user.organizationId, slug);
  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  const shellProps = {
    slug,
    showTitle: production.title,
    orgName: user.organizationName,
    posterInitial: production.title.trim().charAt(0).toUpperCase() || "•",
    userInitials: userInitials(user),
  };

  // Blocking focus is a later phase — keep the toggle live but route here.
  if (mode === "blocking") {
    return (
      <FocusShell {...shellProps} mode="blocking">
        <div className="fx-soon">
          <p>Blocking focus mode is coming soon.</p>
          <a href={`/productions/${slug}/blocking`}>Open the Blocking tool →</a>
        </div>
      </FocusShell>
    );
  }

  const script = await getDefaultScript(production.id);
  if (!script) {
    return (
      <FocusShell {...shellProps} mode="script">
        <div className="fx-soon">
          <p>No script uploaded yet.</p>
          <a href={`/productions/${slug}/documents`}>
            Upload one in Documents and set it as the default →
          </a>
        </div>
      </FocusShell>
    );
  }

  const [annotationRow, pdfUrl] = await Promise.all([
    getScriptAnnotations(script.id, user.id),
    getScriptUrl(script.storagePath),
  ]);

  const annotations = (annotationRow?.annotations ?? []) as Annotation[];
  let bookmarks = (annotationRow?.bookmarks ?? []) as Bookmark[];
  if (
    script.processingStatus === "applied" &&
    !bookmarks.some((b) => b.id?.startsWith("ai-"))
  ) {
    const seeded = await ensureMemberBookmarks(script.id, production.id);
    if (seeded) bookmarks = seeded;
  }
  const pageOverrides = (annotationRow?.pageOverrides ?? {}) as PageOverrides;
  const hasStalePages = annotationRow?.hasStalePages ?? false;

  return (
    <FocusShell {...shellProps} mode="script">
      <ScriptViewer
        script={script}
        productionId={production.id}
        pdfUrl={pdfUrl}
        initialAnnotations={annotations}
        initialBookmarks={bookmarks}
        initialPageOverrides={pageOverrides}
        initialHasStalePages={hasStalePages}
        slug={slug}
        canManage={can(user.role, "documents:upload")}
      />
    </FocusShell>
  );
}
