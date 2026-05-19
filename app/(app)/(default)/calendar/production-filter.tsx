"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  colorVarForToken,
  resolveProductionColorToken,
} from "@/features/productions/constants";

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
    <div className="cal-filters">
      <button
        type="button"
        onClick={showAll}
        className="cal-filter"
        data-active={allSelected ? "1" : "0"}
      >
        All
      </button>
      {productions.map((p) => {
        const isOn = selected.has(p.id);
        const token = resolveProductionColorToken(p);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className="cal-filter"
            data-active={isOn ? "1" : "0"}
            aria-pressed={isOn}
          >
            <span
              className="prod-dot"
              style={{ background: colorVarForToken(token) }}
              aria-hidden
            />
            {p.title}
          </button>
        );
      })}
    </div>
  );
}
