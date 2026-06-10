import { getCurrentUser } from "@/lib/auth";
import { getUserProductionIds } from "@/features/members/queries";
import { getUnacknowledgedAnnouncements } from "@/features/announcements/queries";
import { AnnouncementBannerClient } from "./announcement-banner-client";

/**
 * Top-of-content banner that surfaces announcements the current user hasn't
 * acknowledged yet. It appears only when there's something to act on and
 * clears as each item is acknowledged — acknowledging here records the same
 * ack managers see on the announcements page. Lives in the content column so
 * it shows on phones too (where the rail is hidden).
 */
export async function AnnouncementBanner() {
  const user = await getCurrentUser();
  if (!user) return null;

  const productionIds = [...(await getUserProductionIds(user.id))];
  const rows = await getUnacknowledgedAnnouncements(
    user.id,
    user.organizationId,
    productionIds,
  );
  if (rows.length === 0) return null;

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    scope: r.scopeLabel,
    href: r.href,
  }));

  return <AnnouncementBannerClient items={items} />;
}
