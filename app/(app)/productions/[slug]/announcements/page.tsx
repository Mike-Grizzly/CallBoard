import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { sanitizeHtml } from "@/lib/sanitize";
import { getProductionBySlug } from "@/features/productions/queries";
import {
  getProductionMembership,
  getProductionMembers,
} from "@/features/members/queries";
import {
  getAnnouncementsByProduction,
  getAckInfoForAnnouncements,
  announcementScope,
} from "@/features/announcements/queries";
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

export default async function ProductionAnnouncementsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const production = await getProductionBySlug(user.organizationId, slug);

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

  const canCreate = can(user.role, "announcements:create");

  const [items, members] = await Promise.all([
    getAnnouncementsByProduction(production.id, user.organizationId),
    getProductionMembers(production.id),
  ]);
  const ackInfo = await getAckInfoForAnnouncements(
    items.map((i) => i.id),
    user.id,
    user.organizationId,
  );

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
          : (a.targets[0]?.title ?? production.title);
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

  const mentionMembers: MentionMember[] = members.map((m) => ({
    id: m.userId,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role,
  }));

  return (
    <AnnouncementsCenter
      eyebrow={production.title}
      heading="Announcements"
      lede={`Post an update for everyone on ${production.title}. Company-wide notices show here too.`}
      items={centerItems}
      canCreate={canCreate}
      showOrgFilter
      permissionBanner={
        canCreate
          ? {
              text: `Announcements you post here go to everyone working on ${production.title}.`,
              roleChip: roleLabel,
              name: authorName,
            }
          : null
      }
      composer={{
        productions: [
          {
            id: production.id,
            title: production.title,
            slug: production.slug,
            status: production.status,
            color: production.color,
            members: members.length,
          },
        ],
        orgMemberCount: 0,
        canBroadcastOrg: false,
        canPin: canManage,
        authorName,
        authorRole: roleLabel,
        lockedProduction: { id: production.id, title: production.title },
        mentionMembers,
      }}
    />
  );
}
