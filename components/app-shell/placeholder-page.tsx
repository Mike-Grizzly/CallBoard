import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Generic placeholder page used by every section in Phase 1.
 * Each feature slice will replace its own usage with a real page.
 */
export function PlaceholderPage({
  title,
  description,
  comingSoon = "This section will be built in a later phase of the MVP.",
}: {
  title: string;
  description: string;
  comingSoon?: string;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          {description}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>{comingSoon}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            This placeholder confirms the route, shell, and navigation are
            wired up correctly. No feature logic exists here yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
