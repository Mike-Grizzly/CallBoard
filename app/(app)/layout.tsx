import type { ReactNode } from "react";
import { Rail } from "@/components/app-shell/rail";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <Rail />
      <main className="main">{children}</main>
    </div>
  );
}
