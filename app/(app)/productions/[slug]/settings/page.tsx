import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  getProductionBySlug,
  getResolvedDepartments,
} from "@/features/productions/queries";
import { DepartmentSettings } from "./department-settings";

export default async function ProductionSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();

  if (!can(user.role, "productions:manage")) {
    redirect(`/productions/${slug}`);
  }

  const production = await getProductionBySlug(user.organizationId, slug);
  if (!production) {
    notFound();
  }

  const departments = await getResolvedDepartments(production.id);

  return (
    <div className="page-narrow anim-in">
      <Link href={`/productions/${slug}`} className="pp-back">
        <Icon name="ChevronLeft" size={14} />
        <span>Back to {production.title}</span>
      </Link>

      <div style={{ margin: "10px 0 18px" }}>
        <div className="h-eyebrow">Production</div>
        <h1 className="h-section">Settings</h1>
      </div>

      <DepartmentSettings
        productionId={production.id}
        initial={departments.map((d) => ({
          key: d.key,
          label: d.label,
          custom: d.custom,
        }))}
      />
    </div>
  );
}
