import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getTemplatesForProduction } from "@/features/call-templates/queries";

function timeRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    redirect(`/productions/${slug}/calls`);
  }

  const production = await getProductionBySlug(user.organizationId, slug);
  if (!production) notFound();

  if (!can(user.role, "productions:manage")) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  const templates = await getTemplatesForProduction(production.id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-[color:var(--muted-foreground)]">
          <Link
            href={`/productions/${slug}/calls`}
            className="hover:text-[color:var(--foreground)] transition-colors"
          >
            Calendar
          </Link>
          <span>/</span>
          <span className="text-[color:var(--foreground)]">Templates</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Rehearsal templates
            </h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Reusable call defaults for {production.title}. Apply one to
              generate a recurring schedule.
            </p>
          </div>
          <Link href={`/productions/${slug}/calls/templates/new`}>
            <Button>
              <Icon name="Plus" width={16} height={16} className="mr-1.5" />
              New template
            </Button>
          </Link>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] p-10 text-center">
          <Icon
            name="CalendarDays"
            width={28}
            height={28}
            className="mx-auto mb-3 text-[color:var(--muted-foreground)]"
          />
          <p className="text-sm text-[color:var(--muted-foreground)]">
            No templates yet. Create one to speed up scheduling repeat
            rehearsals.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {templates.map((t) => {
            const time = timeRange(t.callTime, t.endTime);
            return (
              <li
                key={t.id}
                className="rounded-lg border border-[color:var(--border)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{t.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[color:var(--muted-foreground)]">
                      {time && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="Clock" width={14} height={14} />
                          {time}
                        </span>
                      )}
                      {t.location && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="MapPin" width={14} height={14} />
                          {t.location}
                        </span>
                      )}
                      {t.focus && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="PenLine" width={14} height={14} />
                          {t.focus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/productions/${slug}/calls/generate?template=${t.id}`}
                    >
                      <Button variant="outline" size="sm">
                        Generate
                      </Button>
                    </Link>
                    <Link
                      href={`/productions/${slug}/calls/templates/${t.id}/edit`}
                    >
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
