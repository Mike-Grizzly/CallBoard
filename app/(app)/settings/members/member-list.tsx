"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/types/roles";
import {
  updateMemberRole,
  removeMember,
  type MemberActionResult,
} from "@/features/members/actions";
import type { OrgMember } from "@/features/members/queries";
import { Users } from "lucide-react";

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    producer: "bg-blue-100 text-blue-700",
    director: "bg-indigo-100 text-indigo-700",
    stage_manager: "bg-teal-100 text-teal-700",
    cast: "bg-gray-100 text-gray-700",
    crew: "bg-gray-100 text-gray-700",
  };

  const labels: Record<string, string> = {
    admin: "Admin",
    producer: "Producer",
    director: "Director",
    stage_manager: "Stage Manager",
    cast: "Cast",
    crew: "Crew",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[role] ?? colors.cast}`}
    >
      {labels[role] ?? role}
    </span>
  );
}

function MemberRow({
  member,
  isCurrentUser,
}: {
  member: OrgMember;
  isCurrentUser: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState<
    MemberActionResult | undefined,
    FormData
  >(updateMemberRole, undefined);

  const [removeState, removeAction, removePending] = useActionState<
    MemberActionResult | undefined,
    FormData
  >(removeMember, undefined);

  const displayName =
    member.firstName || member.lastName
      ? `${member.firstName} ${member.lastName}`.trim()
      : member.email;

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="truncate text-sm font-semibold">
              {displayName}
            </span>
            <RoleBadge role={member.role} />
            {isCurrentUser && (
              <span className="text-xs text-[color:var(--muted-foreground)]">
                (you)
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[color:var(--muted-foreground)]">
            {member.email}
          </p>
          {(roleState?.error || removeState?.error) && (
            <p className="mt-1 text-xs text-red-600">
              {roleState?.error || removeState?.error}
            </p>
          )}
        </div>

        {!isCurrentUser && (
          <div className="ml-4 flex items-center gap-2">
            <form action={roleAction}>
              <input
                type="hidden"
                name="membership_id"
                value={member.id}
              />
              <select
                name="role"
                defaultValue={member.role}
                className="rounded-md border border-[color:var(--border)] bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                onChange={(e) => {
                  const form = e.currentTarget.form;
                  if (form) form.requestSubmit();
                }}
                disabled={rolePending}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === "stage_manager" ? "Stage Manager" : r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </form>

            <form action={removeAction}>
              <input
                type="hidden"
                name="membership_id"
                value={member.id}
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={removePending}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Remove
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MemberList({
  members,
  currentUserId,
}: {
  members: OrgMember[];
  currentUserId: string;
}) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="mb-3 h-10 w-10 text-[color:var(--muted-foreground)]" />
          <p className="text-sm font-medium">No team members yet</p>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Team members will appear here as they sign up.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          isCurrentUser={member.userId === currentUserId}
        />
      ))}
    </div>
  );
}
