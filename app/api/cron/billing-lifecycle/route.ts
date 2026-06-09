import { NextResponse, type NextRequest } from "next/server";
import { candidateOrgs, processOrg } from "@/features/billing/lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily billing-lifecycle job. Vercel Cron invokes this (with an
 * `Authorization: Bearer <CRON_SECRET>` header it adds automatically when the
 * CRON_SECRET env var is set). Advances each eligible org through its milestone
 * emails and, at day 180, purges uploaded files. Idempotent and safe to re-run.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await candidateOrgs();
  let advanced = 0;
  let emailed = 0;
  let filesPurged = 0;

  for (const org of orgs) {
    try {
      const r = await processOrg(org);
      if (r) {
        advanced += 1;
        emailed += r.emailed;
        filesPurged += r.filesPurged;
      }
    } catch {
      // One bad org must not abort the whole run; skip and continue.
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: orgs.length,
    advanced,
    emailed,
    filesPurged,
  });
}
