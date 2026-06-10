import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  getAnnouncementsForUser,
  getAckInfoForAnnouncements,
  getComposerAudience,
  announcementScope,
} from "@/features/announcements/queries";
import { getOrganizationMembers } from "@/features/members/queries";
import {
  avatarColor,
  initials,
  relativeTime,
  roleLabel as toRoleLabel,
} from "@/features/announcements/format";
import {
  AnnouncementsCenter,
  type CenterItem,
} from "@/components/announcements/announcements-center";
import type { MentionMember } from "@/components/ui/mention-textarea";

export default async function AnnouncementsPage() {
  const user = await requireCurrentUser();
  const canManage = can(user.role, "productions:manage");
  const canCreate = can(user.role, "announcements:create");

  const items = await getAnnouncementsForUser(
    user.id,
    user.organizationId,
    canManage,
  );
  const [ackInfo, audience, orgMembers] = await Promise.all([
    getAckInfoForAnnouncements(
      items.map((i) => i.id),
      user.id,
      user.organizationId,
    ),
    getComposerAudience(user.organizationId),
    canCreate ? getOrganizationMembers(user.organizationId) : Promise.resolve([]),
  ]);

  const authorName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
  const roleLabel = toRoleLabel(user.role);

  const centerItems: CenterItem[] = items.map((a) => {
    const name =
      [a.authorFirstName, a.authorLastName].filter(Boolean).join(" ") ||
      a.authorEmail;
    const scope = announcementScope(a.orgWide, a.targets.length);
    const scopeLabel =
      scope === "org"
        ? "Company-wide"
        : scope === "multi"
          ? `${a.targets.length} productions`
          : (a.targets[0]?.title ?? "Production");
    const info = ackInfo[a.id];
    const isAuthor = a.createdById === user.id;
    return {
      id: a.id,
      title: a.title,
      bodyHtml: a.body ? sanitizeHtml(a.body) : "",
      scope,
      scopeLabel,
      priority: a.priority as "normal" | "important" | "urgent",
      requireAck: a.requireAck,
      pinned: a.pinned,
      authorName: name,
      authorInitials: initials(name),
      authorColor: avatarColor(name),
      relativeTime: relativeTime(new Date(a.createdAt)),
      acked: info?.acked ?? 0,
      total: info?.total ?? 0,
      mine: info?.mine ?? false,
      canPin: canManage,
      canDelete: isAuthor || canManage,
    };
  });

  const mentionMembers: MentionMember[] = orgMembers.map((m) => ({
    id: m.userId,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role,
  }));

  return (
    <AnnouncementsCenter
      eyebrow="Broadcast"
      heading="Announcements"
      lede="Send a message to one production, a few, or everyone working a show right now. It lands on dashboards and phones instantly."
      items={centerItems}
      canCreate={canCreate}
      showOrgFilter
      permissionBanner={
        canCreate
          ? {
              text: canManage
                ? "You can broadcast company-wide because you can manage productions. Production roles post to their own shows only."
                : "You can post announcements to the productions you're part of.",
              roleChip: roleLabel,
              name: authorName,
            }
          : null
      }
      composer={{
        productions: audience.productions,
        orgMemberCount: audience.orgMemberCount,
        canBroadcastOrg: canManage,
        canPin: canManage,
        authorName,
        authorRole: roleLabel,
        mentionMembers,
      }}
    />
  );
}
