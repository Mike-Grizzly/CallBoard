import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionsByOrganization } from "@/features/productions/queries";
import { ProductionList } from "./production-list";

export default async function ProductionsPage() {
  const org = await getOrCreateDefaultOrganization();
  const productionsList = await getProductionsByOrganization(org.id);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productions</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Manage the shows your organization is producing.
          </p>
        </div>
        <Link href="/productions/new">
          <Button>
            <Plus className="h-4 w-4" aria-hidden />
            New production
          </Button>
        </Link>
      </div>

      <ProductionList productions={productionsList} />
    </div>
  );
}
