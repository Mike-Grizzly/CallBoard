import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getUserProductions } from "@/features/productions/queries";
import { getCallsForUserInRange } from "@/features/calls/queries";
import {
  resolveProductionColorToken,
  colorVarForToken,
} from "@/features/productions/constants";
import { CalendarClient } from "./calendar-client";
import { callToEvent, ymd, addDays } from "./utils";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const manageAll = can(user.role, "productions:manage");
  // Same gate as the per-production call edit page — admin, producer,
  // director, choreographer, stage_manager.
  const canEdit = can(user.role, "reports:create");

  const userProductions = await getUserProductions(user.id);
  if (userProductions.length === 0) {
    return <EmptyState />;
  }

  // Fetch a generous window so client-side navigation between
  // month/week/day/agenda views stays snappy without round-trips.
  const today = new Date();
  const rangeStart = addDays(today, -45);
  const rangeEnd = addDays(today, 120);

  const calls = await getCallsForUserInRange({
    userId: user.id,
    organizationId: org.id,
    startDate: ymd(rangeStart),
    endDate: ymd(rangeEnd),
    manageAll,
  });

  const productions = userProductions.map((p) => {
    const token = resolveProductionColorToken({ id: p.id, color: p.color });
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      colorVar: colorVarForToken(token),
    };
  });

  const prodColorMap = new Map(productions.map((p) => [p.id, p.colorVar]));

  const events = calls.map((c) =>
    callToEvent(c, prodColorMap.get(c.productionId) ?? "var(--ink-3)"),
  );

  return (
    <CalendarClient
      events={events}
      productions={productions}
      initialView={params.view}
      initialDate={params.date}
      canEdit={canEdit}
    />
  );
}

function EmptyState() {
  return (
    <div className="page cal-page">
      <div className="cal-empty">
        <Icon name="CalendarDays" className="ico" />
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 500,
            margin: 0,
          }}
        >
          Your calendar is empty
        </h1>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "var(--ink-3)",
          }}
        >
          You aren&apos;t a member of any productions yet. Once a stage manager
          adds you, calls will show up here.
        </p>
        <Link
          href="/productions"
          className="btn"
          style={{ marginTop: 16, display: "inline-flex" }}
        >
          Browse productions
        </Link>
      </div>
    </div>
  );
}
