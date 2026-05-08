import { Megaphone, Pin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getAnnouncementsForUser } from "@/features/announcements/queries";
import { OrgAnnouncementForm } from "./announcement-form";
import { AnnouncementDeleteButton } from "./announcement-delete-button";
import { AnnouncementPinButton } from "./announcement-pin-button";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AnnouncementsPage() {
  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const canManage = can(user.role, "productions:manage");
  const canCreate = can(user.role, "announcements:create");

  const items = await getAnnouncementsForUser(user.id, org.id, canManage);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Company-wide updates and production notices.
        </p>
      </div>

      {canCreate && <OrgAnnouncementForm />}

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="mb-3 h-10 w-10 text-[color:var(--muted-foreground)]" />
            <p className="text-sm font-medium">No announcements yet</p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              {canCreate
                ? "Post an org-wide update, or visit a production to post show-specific notices."
                : "No announcements have been posted yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const authorName =
              item.authorFirstName || item.authorLastName
                ? `${item.authorFirstName} ${item.authorLastName}`.trim()
                : item.authorEmail;
            const isAuthor = item.createdById === user.id;
            const canDelete = isAuthor || canManage;
            const isOrgWide = item.productionId === null;

            return (
              <Card
                key={item.id}
                className={item.pinned ? "border-[color:var(--primary)]/40 bg-[color:var(--primary)]/5" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.pinned && (
                          <Pin className="h-3.5 w-3.5 shrink-0 text-[color:var(--primary)]" aria-hidden />
                        )}
                        <h2 className="text-sm font-semibold">{item.title}</h2>
                        <span className="rounded-full bg-[color:var(--accent)] px-2 py-0.5 text-xs font-medium">
                          {isOrgWide ? "Org-wide" : (item.productionTitle ?? "Production")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[color:var(--muted-foreground)]">
                        {authorName} &middot; {formatDate(item.createdAt)}
                      </p>
                      {item.body && (
                        <div className="mt-2 text-sm">
                          <RichTextDisplay content={item.body} />
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
