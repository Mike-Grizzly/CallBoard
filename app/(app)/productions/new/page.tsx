import Link from "next/link";
import { CreateProductionForm } from "./create-production-form";

export default function NewProductionPage() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <Link
          href="/productions"
          className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
        >
          &larr; Back to productions
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          New production
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Create a new show workspace for your team.
        </p>
      </div>

      <CreateProductionForm />
    </div>
  );
}
