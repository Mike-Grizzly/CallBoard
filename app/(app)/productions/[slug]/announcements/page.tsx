import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import {
  getProductionMembership,
  getProductionMembers,
} from "@/features/members/queries";
import { getAnnouncementsByProduction } from "@/features/announcements/queries";
import { AnnouncementForm } from "./announcement-form";
import { AnnouncementDeleteButton } from "./announcement-delete-button";
import { AnnouncementPinButton } from "./announcement-pin-button";

const AVATAR_PALETTE = ["clay", "sage", "dusk", "amber", "plum", "sand"] as const;

function avatarColor(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function authorInitials(
  firstName: string | null,
  lastName: string | null,
  email: string,
): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  return email[0].toUpperCase();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProductionAnnouncementsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);

  if (!production) {
    notFound();
  }

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) {
      redirect("/productions");
    }
  }

  const [items, members] = await Promise.all([
    getAnnouncementsByProduction(production.id, org.id),
    getProductionMembers(production.id),
  ]);
  const canCreate = can(user.role, "announcements:create");
  const mentionMembers = members.map((m) => ({
    id: m.userId,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role,
  }));

  return (
    <div
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div>
        <h2 className="h-section">Announcements</h2>
        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          {items.length} {items.length === 1 ? "announcement" : "announcements"} ·{" "}
          {production.title}
        </div>
      </div>

      {canCreate && (
        <AnnouncementForm productionId={production.id} members={mentionMembers} />
      )}

      {items.length === 0 ? (
        <div
          className="card card-pad"
          style={{ textAlign: "center", padding: "48px 24px" }}
        >
          <Icon
            name="Megaphone"
            style={{
              width: 32,
              height: 32,
              margin: "0 auto 10px",
              color: "var(--ink-4)",
            }}
          />
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-2)" }}>
            No announcements yet
          </p>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {canCreate
              ? "Post an update for the team."
              : "No announcements have been posted yet."}
          </p>
        </div>
      ) : (
        <div className="ann-list">
          {items.map((item) => {
            const authorName =
              item.authorFirstName || item.authorLastName
                ? `${item.authorFirstName ?? ""} ${item.authorLastName ?? ""}`.trim()
                : item.authorEmail;
            const isAuthor = item.createdById === user.id;
            const canDelete = isAuthor || canManage;
            const isOrgWide = item.productionId === null;

            return (
              <article key={item.id} className="ann-card">
                <div className="ann-rail" data-c={isOrgWide ? "amber" : "dusk"} />
                <div className="ann-main">
                  <div className="ann-header">
                    <div className="row" style={{ gap: 10 }}>
                      <div
                        className="avatar"
                        style={{
                          width: 26,
                          height: 26,
                          fontSize: 11,
                          background: `var(--c-${avatarColor(authorName)})`,
                        }}
                      >
                        {authorInitials(
                          item.authorFirstName,
                          item.authorLastName,
                          item.authorEmail,
                        )}
                      </div>
                      <div>
                        <div className="ann-from">{authorName}</div>
                        <div className="ann-meta">
                          {isOrgWide && (
                            <>
                              <span className="pill" data-c="amber">
                                <Icon name="Megaphone" size={10} />
                                Org-wide
                              </span>
                              <span>·</span>
                            </>
                          )}
                          <span>{formatDate(item.createdAt)}</span>
                          {item.pinned && (
                            <>
                              <span>·</span>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <Icon name="Pin" size={10} />
                                Pinned
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {(canManage || canDelete) && (
                      <div className="row" style={{ gap: 4 }}>
                        {canManage && (
                          <AnnouncementPinButton
                            announcementId={item.id}
                            pinned={item.pinned}
                          />
                        )}
                        {canDelete && (
                          <AnnouncementDeleteButton announcementId={item.id} />
                        )}
                      </div>
                    )}
                  </div>
                  <h3 className="ann-title">{item.title}</h3>
                  {item.body && (
                    <div className="ann-body">
                      <RichTextDisplay content={item.body} />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
