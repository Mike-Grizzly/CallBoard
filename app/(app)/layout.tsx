import type { ReactNode } from "react";
import { Topbar } from "@/components/app-shell/topbar";
import { Sidebar } from "@/components/app-shell/sidebar";

/**
 * Shared app shell layout for all authenticated sections.
 *
 * Phase 1: there is no real auth yet, so this simply renders the shell
 * for every route in the (app) group. Phase 2 will add a redirect to
 * /login for unauthenticated users at this layer.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
