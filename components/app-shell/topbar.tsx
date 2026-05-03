import { Theater } from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function Topbar() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex h-14 items-center justify-between border-b border-[color:var(--border)] bg-[color:var(--background)] px-4 md:px-6">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Theater className="h-5 w-5" aria-hidden />
        <span className="text-base font-semibold tracking-tight">
          Show Portal
        </span>
      </Link>

      <div className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <span className="hidden text-[color:var(--muted-foreground)] sm:inline">
              {user.email}
            </span>
            <LogoutButton />
          </>
        ) : (
          <span className="text-[color:var(--muted-foreground)]">
            Not signed in
          </span>
        )}
      </div>
    </header>
  );
}
