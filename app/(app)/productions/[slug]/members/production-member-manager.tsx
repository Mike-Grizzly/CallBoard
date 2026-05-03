"use client";

import { useActionState } from "react";
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

function AssignForm({
  productionId,
  availableMembers,
}: {
  productionId: string;
  availableMembers: OrgMember[];
}) {
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

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="production_id" value={productionId} />

      <div className="min-w-[200px] flex-1">
        <label
          htmlFor="user_id"
          className="mb-1.5 block text-sm font-medium"
        >
          Member
        </label>
        <select
          id="user_id"
          name="user_id"
          required
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
        >
          <option value="">Select a member...</option>
          {availableMembers.map((m) => {
            const name =
              m.firstName || m.lastName
                ? `${m.firstName} ${m.lastName}`.trim()
                : m.email;
            return (
              <option key={m.userId} value={m.userId}>
                {name} ({m.email})
              </option>
            );
          })}
        </select>
      </div>

      <div className="min-w-[160px]">
        <label htmlFor="role" className="mb-1.5 block text-sm font-medium">
          Role
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue="cast"
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
        >
          {PRODUCTION_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={pending}>
        <UserPlus className="h-4 w-4" aria-hidden />
        {pending ? "Assigning..." : "Assign"}
      </Button>

      {state?.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}

function CurrentMemberRow({ member }: { member: ProductionMember }) {
  const [state, formAction, pending] = useActionState<
    MemberActionResult | undefined,
    FormData
  >(removeProductionMember, undefined);

  const displayName =
    member.firstName || member.lastName
      ? `${member.firstName} ${member.lastName}`.trim()
      : member.email;

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-3">
        <div>
          <span className="text-sm font-medium">{displayName}</span>
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
        <h2 className="mb-3 text-lg font-semibold">Add Member</h2>
        <Card>
          <CardContent className="p-4">
            <AssignForm
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
