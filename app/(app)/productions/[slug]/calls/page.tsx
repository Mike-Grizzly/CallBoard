import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getCallsForUserInRange } from "@/features/calls/queries";
import {
  resolveProductionColorToken,
  colorVarForToken,
} from "@/features/productions/constants";
import { CalendarClient } from "@/app/(app)/calendar/calendar-client";
import { callToEvent, ymd, addDays } from "@/app/(app)/calendar/utils";

/**
 * Production-scoped calendar. Renders the same `<CalendarClient />` as
 * the workspace `/calendar` page, filtered to events for this single
 * production — same UI, same views, same drawer; only the data set is
 * narrower. Per user direction (2026-05-24): no UX divergence between
 * workspace and production contexts.
 */
export default async function ProductionCallsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const [{ slug }, { view, date }] = await Promise.all([params, searchParams]);

  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);
  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }
  const canEdit = can(user.role, "reports:create");

  const today = new Date();
  const rangeStart = addDays(today, -45);
  const rangeEnd = addDays(today, 120);

  const allCalls = await getCallsForUserInRange({
    userId: user.id,
    organizationId: org.id,
    startDate: ymd(rangeStart),
    endDate: ymd(rangeEnd),
    manageAll: canManage,
  });
  const calls = allCalls.filter((c) => c.productionId === production.id);

  const token = resolveProductionColorToken({
    id: production.id,
    color: production.color,
  });
  const colorVar = colorVarForToken(token);
  const productions = [
    {
      id: production.id,
      title: production.title,
      slug: production.slug,
      colorVar,
    },
  ];
  const events = calls.map((c) => callToEvent(c, colorVar));

  return (
    <CalendarClient
      events={events}
      productions={productions}
      initialView={view}
      initialDate={date}
      canEdit={canEdit}
    />
  );
}
