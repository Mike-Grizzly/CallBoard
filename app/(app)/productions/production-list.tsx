import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Lock, Theater } from "lucide-react";
import type { Production } from "@/db/schema";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    archived: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`}
    >
      {status}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProductionList({
  productions,
  accessibleIds,
}: {
  productions: Production[];
  accessibleIds: Set<string> | null;
}) {
  if (productions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Theater className="mb-3 h-10 w-10 text-[color:var(--muted-foreground)]" />
          <p className="text-sm font-medium">No productions yet</p>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Create your first production to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {productions.map((production) => {
        const hasAccess =
          accessibleIds === null || accessibleIds.has(production.id);

        if (hasAccess) {
          return (
            <Link key={production.id} href={`/productions/${production.slug}`}>
              <Card className="transition-colors hover:bg-[color:var(--accent)]">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="truncate text-sm font-semibold">
                        {production.title}
                      </h2>
                      <StatusBadge status={production.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[color:var(--muted-foreground)]">
                      <Calendar className="h-3 w-3" aria-hidden />
                      <span>
                        {formatDate(production.openingDate)}
                        {production.closingDate &&
                          ` — ${formatDate(production.closingDate)}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        }

        return (
          <Card key={production.id} className="opacity-60">
            <CardContent className="flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="truncate text-sm font-semibold">
                    {production.title}
                  </h2>
                  <StatusBadge status={production.status} />
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-[color:var(--muted-foreground)]">
                  <Calendar className="h-3 w-3" aria-hidden />
                  <span>
                    {formatDate(production.openingDate)}
                    {production.closingDate &&
                      ` — ${formatDate(production.closingDate)}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[color:var(--muted-foreground)]">
                <Lock className="h-3 w-3" aria-hidden />
                <span>Not assigned</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
