import { Icon } from "@/components/ui/icon";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  getAnnouncementsForUser,
  getAckInfoForAnnouncements,
} from "@/features/announcements/queries";
import { OrgAnnouncementForm } from "./announcement-form";
import { AnnouncementDeleteButton } from "./announcement-delete-button";
import { AnnouncementPinButton } from "./announcement-pin-button";
import { AnnouncementAckButton } from "@/app/(app)/(default)/dashboard/announcement-ack-button";
import { AnnouncementTitleTrigger } from "@/components/announcements/announcement-detail-drawer";

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

export default async function AnnouncementsPage() {
  const user = await requireCurrentUser();
  const canManage = can(user.role, "productions:manage");
  const canCreate = can(user.role, "announcements:create");

  const items = await getAnnouncementsForUser(user.id, user.organizationId, canManage);
  const ackInfo = await getAckInfoForAnnouncements(
    items.map((i) => i.id),
    user.id,
    user.organizationId,
  );

  return (
    <div
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div>
        <div className="h-eyebrow">Workspace</div>
        <h1 className="h-section">Announcements</h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          Company-wide updates and production notices.
        </p>
      </div>

      {canCreate && <OrgAnnouncementForm />}

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
              ? "Post an org-wide update, or visit a production to post show-specific notices."
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
                          <span
                            className="pill"
                            data-c={isOrgWide ? "amber" : "dusk"}
                          >
                            {isOrgWide && <Icon name="Megaphone" size={10} />}
                            {isOrgWide
                              ? "Org-wide"
                              : (item.productionTitle ?? "Production")}
                          </span>
                          <span>·</span>
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
                  <AnnouncementTitleTrigger
                    announcementId={item.id}
                    title={item.title}
                  />
                  {item.body && (
                    <div className="ann-body">
                      <RichTextDisplay content={item.body} />
                    </div>
                  )}
                  {ackInfo[item.id] && (
                    <AnnouncementAckButton
                      announcementId={item.id}
                      acked={ackInfo[item.id].mine}
                      count={ackInfo[item.id].acked}
                      total={ackInfo[item.id].total}
                    />
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
