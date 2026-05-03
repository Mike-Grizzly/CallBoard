import type { ReactNode } from "react";
import { Topbar } from "@/components/app-shell/topbar";
import { Sidebar } from "@/components/app-shell/sidebar";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const role = user?.role ?? "cast";

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar role={role} />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
