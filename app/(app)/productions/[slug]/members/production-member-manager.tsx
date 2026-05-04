"use client";

import { useActionState, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/types/roles";
import {
  assignProductionMember,
  removeProductionMember,
  type MemberActionResult,
} from "@/features/members/actions";
import type {
  ProductionMember,
  OrgMember,
} from "@/features/members/queries";
import { UserPlus, Users } from "lucide-react";

const PRODUCTION_ROLES = ROLES.filter((r) => r !== "admin");

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    producer: "Producer",
    director: "Director",
    stage_manager: "Stage Manager",
    cast: "Cast",
    crew: "Crew",
    admin: "Admin",
  };
  return labels[role] ?? role;
}

function displayName(member: { firstName: string; lastName: string; email: string }) {
  return member.firstName || member.lastName
    ? `${member.firstName} ${member.lastName}`.trim()
    : member.email;
}

function BulkAssignForm({
  productionId,
  availableMembers,
}: {
  productionId: string;
  availableMembers: OrgMember[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [role, setRole] = useState("cast");
  const [state, formAction, pending] = useActionState<
    MemberActionResult | undefined,
    FormData
  >(assignProductionMember, undefined);

  if (availableMembers.length === 0) {
    return (
      <p className="text-sm text-[color:var(--muted-foreground)]">
        All organization members are already assigned to this production.
      </p>
    );
  }

  function toggleMember(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === availableMembers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(availableMembers.map((m) => m.userId)));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.size === availableMembers.length}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="font-medium">Select all</span>
        </label>

        <div className="flex items-center gap-2">
          <label htmlFor="bulk-role" className="text-sm font-medium">
            Role:
          </label>
          <select
            id="bulk-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-md border border-[color:var(--border)] bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          >
            {PRODUCTION_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-[color:var(--border)] p-2">
        {availableMembers.map((m) => (
          <label
            key={m.userId}
            className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-[color:var(--accent)]"
          >
            <input
              type="checkbox"
              checked={selected.has(m.userId)}
              onChange={() => toggleMember(m.userId)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">{displayName(m)}</span>
            <span className="text-xs text-[color:var(--muted-foreground)]">
              {m.email}
            </span>
          </label>
        ))}
      </div>

      <form
        action={(formData) => {
          const userIds = Array.from(selected);
          if (userIds.length === 0) return;
          formData.set("production_id", productionId);
          formData.set("role", role);
          formData.set("user_ids", JSON.stringify(userIds));
          formAction(formData);
        }}
      >
        <Button type="submit" disabled={pending || selected.size === 0}>
          <UserPlus className="h-4 w-4" aria-hidden />
          {pending
            ? "Assigning..."
            : `Assign ${selected.size} member${selected.size !== 1 ? "s" : ""}`}
        </Button>
      </form>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </div>
  );
}

function CurrentMemberRow({ member }: { member: ProductionMember }) {
  const [state, formAction, pending] = useActionState<
    MemberActionResult | undefined,
    FormData
  >(removeProductionMember, undefined);

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-3">
        <div>
          <span className="text-sm font-medium">{displayName(member)}</span>
          <span className="ml-2 text-xs text-[color:var(--muted-foreground)]">
            {member.email}
          </span>
          <span className="ml-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {roleLabel(member.role)}
          </span>
        </div>
        <form action={formAction}>
          <input type="hidden" name="membership_id" value={member.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={pending}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {pending ? "Removing..." : "Remove"}
          </Button>
        </form>
        {state?.error && (
          <p className="text-xs text-red-600">{state.error}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductionMemberManager({
  productionId,
  currentMembers,
  availableMembers,
}: {
  productionId: string;
  currentMembers: ProductionMember[];
  availableMembers: OrgMember[];
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Add Members</h2>
        <Card>
          <CardContent className="p-4">
            <BulkAssignForm
              productionId={productionId}
              availableMembers={availableMembers}
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Current Members ({currentMembers.length})
        </h2>
        {currentMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-2 h-8 w-8 text-[color:var(--muted-foreground)]" />
              <p className="text-sm text-[color:var(--muted-foreground)]">
                No members assigned yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {currentMembers.map((member) => (
              <CurrentMemberRow key={member.id} member={member} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
