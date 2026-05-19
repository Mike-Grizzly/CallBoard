"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { resolveProductionColor } from "@/features/productions/constants";

type FilterProduction = {
  id: string;
  title: string;
  color: string | null;
};

export function ProductionFilter({
  productions,
  selected,
}: {
  productions: FilterProduction[];
  selected: Set<string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (next: Set<string>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.size === 0 || next.size === productions.length) {
        params.delete("productions");
      } else {
        params.set("productions", Array.from(next).join(","));
      }
      router.push(`/calendar?${params.toString()}`);
    },
    [router, searchParams, productions.length],
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    update(next);
  };

  const showAll = () => update(new Set(productions.map((p) => p.id)));

  if (productions.length <= 1) return null;

  const allSelected = selected.size === productions.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={showAll}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          allSelected
            ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-[color:var(--background)]"
            : "border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
        }`}
      >
        All
      </button>
      {productions.map((p) => {
        const isOn = selected.has(p.id);
        const color = resolveProductionColor(p);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              isOn
                ? "border-[color:var(--foreground)] text-[color:var(--foreground)]"
                : "border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            }`}
            aria-pressed={isOn}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: isOn ? color : "var(--muted-foreground)" }}
              aria-hidden
            />
            {p.title}
          </button>
        );
      })}
    </div>
  );
}
