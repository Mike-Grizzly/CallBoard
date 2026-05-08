import type { ReactNode } from "react";
import { Rail } from "@/components/app-shell/rail";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <Rail />
      <main className="main">
        {/* Default page wrapper. Pages porting to the new design system can
            opt out by rendering their own .topbar / .page structure. */}
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
