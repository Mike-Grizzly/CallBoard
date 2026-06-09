import { after } from "next/server";
import { db } from "@/db";
import { scriptParses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { runScriptParse } from "@/features/scripts/parse";

// PDF parsing + a model call can take a while; run on Node with generous
// headroom. The work itself happens in `after()` so the request returns
// immediately and the parse survives the client navigating away.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ parseId: string }> },
) {
  const { parseId } = await params;

  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [parse] = await db
    .select({
      productionId: scriptParses.productionId,
      status: scriptParses.status,
    })
    .from(scriptParses)
    .where(eq(scriptParses.id, parseId))
    .limit(1);

  if (!parse) return new Response("Not found", { status: 404 });
  if (!(await userCanAccessProduction(user, parse.productionId))) {
    return new Response("Forbidden", { status: 403 });
  }
  // Only kick a freshly-staged parse — guards against double-runs.
  if (parse.status !== "processing") {
    return new Response("Already processed", { status: 409 });
  }

  after(() => runScriptParse(parseId));
  return new Response(null, { status: 202 });
}
