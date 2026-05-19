"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createProduction,
  type CreateProductionResult,
} from "@/features/productions/actions";
import { Button } from "@/components/ui/button";
import { PRODUCTION_COLOR_PALETTE } from "@/features/productions/constants";

export function CreateProductionForm() {
  const [state, formAction, pending] = useActionState<
    CreateProductionResult | undefined,
    FormData
  >(createProduction, undefined);
  const [color, setColor] = useState<string>(PRODUCTION_COLOR_PALETTE[0].value);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm"
    >
      {state?.error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="e.g. A Midsummer Night's Dream"
        />
        {state?.errors?.title && (
          <p className="mt-1 text-sm text-red-600">{state.errors.title}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue="draft"
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium">Color</label>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-wrap gap-2">
          {PRODUCTION_COLOR_PALETTE.map((c) => {
            const selected = c.value === color;
            return (
              <button
                key={c.value}
                type="button"
                aria-label={c.name}
                aria-pressed={selected}
                onClick={() => setColor(c.value)}
                className={`h-7 w-7 rounded-full transition-shadow focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] ${
                  selected
                    ? "ring-2 ring-offset-2 ring-[color:var(--ring)] ring-offset-[color:var(--card)]"
                    : ""
                }`}
                style={{ background: c.value }}
              />
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-[color:var(--muted-foreground)]">
          Used as this production&apos;s dot in the sidebar and on the
          calendar.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="opening_date"
            className="mb-1.5 block text-sm font-medium"
          >
            Opening date
          </label>
          <input
            id="opening_date"
            name="opening_date"
            type="date"
            className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          />
          {state?.errors?.opening_date && (
            <p className="mt-1 text-sm text-red-600">
              {state.errors.opening_date}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="closing_date"
            className="mb-1.5 block text-sm font-medium"
          >
            Closing date
          </label>
          <input
            id="closing_date"
            name="closing_date"
            type="date"
            className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          />
          {state?.errors?.closing_date && (
            <p className="mt-1 text-sm text-red-600">
              {state.errors.closing_date}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Link href="/productions">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create production"}
        </Button>
      </div>
    </form>
  );
}
