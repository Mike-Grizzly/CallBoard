"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

/**
 * Small icon-only sign-out trigger that fits inside the rail foot.
 * Submits a server action to clear the Supabase session.
 */
export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" title="Sign out" aria-label="Sign out">
        <LogOut className="ico" aria-hidden />
      </button>
    </form>
  );
}
