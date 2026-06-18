// Post-trial lifecycle engine, driven by a daily cron (see
// app/api/cron/billing-lifecycle/route.ts). For each free, non-grandfathered,
// non-subscribed org it advances through milestone emails (nudge → warning →
// read-only → purge warnings) and finally purges uploaded files at day 180.
//
// Idempotency: organizations.billing_lifecycle_stage records the last milestone
// reached, so each email fires once and the purge runs once even if the cron
// runs many times (or catches up after downtime).

import { and, eq, inArray, isNotNull, lt } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import {
  organizations,
  productions,
  documents,
  reportAttachments,
  rehearsalReports,
  customSetPieces,
  stageConfigurations,
} from "@/db/schema";
import { getOrganizationMembers } from "@/features/members/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  BILLING_ENABLED,
  LIFECYCLE,
  LIFECYCLE_DAY,
  TRIAL_DISCOUNT_PCT,
  PURGE_DAY,
} from "./constants";

const DAY = 86_400_000;
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.proscene.app";

export type LifecycleOrg = {
  id: string;
  name: string;
  trialStartedAt: Date | null;
  billingLifecycleStage: number;
  grandfathered: boolean;
  subscriptionStatus: string | null;
};

/** Highest milestone whose day has been reached for this dayN. */
function targetStage(dayN: number): number {
  let target: number = LIFECYCLE.NONE;
  for (const stage of [
    LIFECYCLE.NUDGE,
    LIFECYCLE.WARNING,
    LIFECYCLE.READ_ONLY,
    LIFECYCLE.PURGE_WARN_60,
    LIFECYCLE.PURGE_WARN_30,
    LIFECYCLE.PURGE_WARN_7,
    LIFECYCLE.PURGED,
  ]) {
    if (dayN >= LIFECYCLE_DAY[stage]) target = stage;
  }
  return target;
}

function emailForStage(
  stage: number,
  orgName: string,
): { subject: string; text: string } | null {
  const billing = `${APP_URL}/settings/billing`;
  switch (stage) {
    case LIFECYCLE.NUDGE:
      return {
        subject: `How's your Proscene trial going, ${orgName}?`,
        text:
          `Hi there,\n\nYou're 30 days into your free Proscene trial — hope the ` +
          `company's loving it. As a thank-you for trying us early, you can take ` +
          `${TRIAL_DISCOUNT_PCT}% off your first term. Just reply to this email and ` +
          `we'll send your code, or subscribe any time here:\n\n${billing}\n\n— Proscene`,
      };
    case LIFECYCLE.WARNING:
      return {
        subject: `Your Proscene trial ends in a few days`,
        text:
          `Hi there,\n\nYour 60-day free trial for ${orgName} ends soon. Subscribe ` +
          `before it does to keep full access — your script, blocking, reports, and ` +
          `uploads stay live:\n\n${billing}\n\n— Proscene`,
      };
    case LIFECYCLE.READ_ONLY:
      return {
        subject: `${orgName} is now read-only — but you can still finish your run`,
        text:
          `Hi there,\n\nYour Proscene trial has ended. You can still view and export ` +
          `everything, and you've kept rehearsal reports, announcements, and ` +
          `schedules so far to finish your current run. Editing tools are paused ` +
          `until you subscribe:\n\n${billing}\n\nYour uploaded files stay available ` +
          `to download for the next 90 days.\n\n— Proscene`,
      };
    case LIFECYCLE.PURGE_WARN_60:
    case LIFECYCLE.PURGE_WARN_30:
    case LIFECYCLE.PURGE_WARN_7: {
      const days =
        stage === LIFECYCLE.PURGE_WARN_60 ? 60 : stage === LIFECYCLE.PURGE_WARN_30 ? 30 : 7;
      return {
        subject: `Your Proscene files will be removed in ${days} days`,
        text:
          `Hi there,\n\nThe uploaded files for ${orgName} are scheduled to be ` +
          `removed in ${days} days to free up space, since the subscription hasn't ` +
          `been renewed. Before then you can:\n\n` +
          `  • Download anything you want to keep (everything is still available), or\n` +
          `  • Re-subscribe to keep your files and unlock editing again:\n\n${billing}\n\n` +
          `Your reports and production data stay readable either way — this only ` +
          `affects uploaded files (documents, attachments, images).\n\n— Proscene`,
      };
    }
    case LIFECYCLE.PURGED:
      return {
        subject: `Your Proscene uploaded files have been removed`,
        text:
          `Hi there,\n\nAs scheduled, the uploaded files for ${orgName} have been ` +
          `removed to free up space. Your productions, reports, and schedules remain ` +
          `readable. If you'd like to come back, re-subscribe any time and start ` +
          `fresh:\n\n${billing}\n\n— Proscene`,
      };
    default:
      return null;
  }
}

async function adminEmails(orgId: string): Promise<string[]> {
  const members = await getOrganizationMembers(orgId);
  return members
    .filter((m) => m.role === "admin" && m.email)
    .map((m) => m.email as string);
}

/** Collect every uploaded-file storage path belonging to an org's productions. */
async function gatherStoragePaths(orgId: string): Promise<string[]> {
  const prods = await db
    .select({ id: productions.id })
    .from(productions)
    .where(eq(productions.organizationId, orgId));
  const pids = prods.map((p) => p.id);
  if (pids.length === 0) return [];

  const paths: string[] = [];

  const docs = await db
    .select({ p: documents.storagePath })
    .from(documents)
    .where(inArray(documents.productionId, pids));
  docs.forEach((d) => d.p && paths.push(d.p));

  const atts = await db
    .select({ p: reportAttachments.storagePath })
    .from(reportAttachments)
    .innerJoin(rehearsalReports, eq(reportAttachments.reportId, rehearsalReports.id))
    .where(inArray(rehearsalReports.productionId, pids));
  atts.forEach((a) => a.p && paths.push(a.p));

  const sets = await db
    .select({ p: customSetPieces.storagePath })
    .from(customSetPieces)
    .where(inArray(customSetPieces.productionId, pids));
  sets.forEach((s) => s.p && paths.push(s.p));

  const cfgs = await db
    .select({ p: stageConfigurations.groundPlanImagePath })
    .from(stageConfigurations)
    .where(inArray(stageConfigurations.productionId, pids));
  cfgs.forEach((c) => c.p && paths.push(c.p));

  return paths;
}

/**
 * Delete an org's uploaded file objects from storage. We intentionally remove
 * only the bytes, not the DB rows — that frees the storage cost (the goal)
 * without breaking references (scripts pointing at documents, etc.). A purged
 * org's download links simply 404; it was warned three times first.
 */
export async function purgeOrgFiles(orgId: string): Promise<number> {
  const raw = await gatherStoragePaths(orgId);
  // Defense-in-depth. Every path here already came from this org's own upload
  // tables (scoped by its production ids), but before deleting anything we:
  //   • dedupe,
  //   • drop empty/null paths,
  //   • never touch workspace logos (org-logos/…) — they're not gathered, but
  //     this guarantees branding survives even if a stray path ever slipped in.
  // So the worst case is "removed a file we already meant to remove"; it can
  // never reach another org or any app/system data (the app's code, schema,
  // and config live in the repo/DB, not this bucket).
  const paths = [...new Set(raw)].filter(
    (p) => typeof p === "string" && p.length > 0 && !p.startsWith("org-logos/"),
  );
  if (paths.length === 0) return 0;
  const supabase = createSupabaseAdminClient();
  for (let i = 0; i < paths.length; i += 100) {
    await supabase.storage.from("attachments").remove(paths.slice(i, i + 100));
  }
  return paths.length;
}

export type LifecycleStepResult = {
  orgId: string;
  fromStage: number;
  toStage: number;
  emailed: number;
  filesPurged: number;
};

/**
 * Advance one org by at most one milestone per run (sends the most recent
 * milestone email it hasn't yet received). Returns null if nothing to do.
 */
export async function processOrg(
  org: LifecycleOrg,
): Promise<LifecycleStepResult | null> {
  if (!org.trialStartedAt) return null;
  const dayN = Math.floor((Date.now() - org.trialStartedAt.getTime()) / DAY);
  const target = targetStage(dayN);
  if (target <= org.billingLifecycleStage) return null;

  let filesPurged = 0;
  if (target === LIFECYCLE.PURGED) {
    filesPurged = await purgeOrgFiles(org.id);
  }

  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;
  const mail = emailForStage(target, org.name);
  let emailed = 0;
  if (resend && mail) {
    const to = await adminEmails(org.id);
    if (to.length > 0) {
      try {
        await resend.emails.send({ from: FROM, to, subject: mail.subject, text: mail.text });
        emailed = to.length;
      } catch {
        // Don't let a send failure block advancing the stage or other orgs —
        // the milestone is best-effort; the read-only/purge state itself is
        // enforced live by the gates regardless of email delivery.
      }
    }
  }

  await db
    .update(organizations)
    .set({ billingLifecycleStage: target, updatedAt: new Date() })
    .where(eq(organizations.id, org.id));

  return {
    orgId: org.id,
    fromStage: org.billingLifecycleStage,
    toStage: target,
    emailed,
    filesPurged,
  };
}

/** Orgs eligible for lifecycle processing today. */
export async function candidateOrgs(): Promise<LifecycleOrg[]> {
  // Open beta: the trial/purge lifecycle is paused entirely.
  if (!BILLING_ENABLED) return [];
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      trialStartedAt: organizations.trialStartedAt,
      billingLifecycleStage: organizations.billingLifecycleStage,
      grandfathered: organizations.grandfathered,
      subscriptionStatus: organizations.subscriptionStatus,
    })
    .from(organizations)
    .where(
      and(
        eq(organizations.grandfathered, false),
        isNotNull(organizations.trialStartedAt),
        lt(organizations.billingLifecycleStage, LIFECYCLE.PURGED),
      ),
    );

  // A subscriber (active/dunning/canceled-in-period) is out of the lifecycle.
  return rows.filter(
    (r) =>
      !["active", "past_due", "canceled"].includes(r.subscriptionStatus ?? ""),
  );
}

export { PURGE_DAY };
