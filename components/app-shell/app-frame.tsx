import type { ReactNode } from "react";
import { MobileTabBar } from "./mobile-tab-bar";

/**
 * Outer app shell. The desktop rail is rendered by the parent layout
 * and shows at >720px (CSS gates it). At phone widths the rail is
 * hidden and a fixed bottom tab bar takes over — primary navigation
 * uses a 5-tab pattern (Today / Calendar / Reports / Notes / More)
 * matching the mobile demo. See `globals.css` for the breakpoint logic.
 */
export function AppFrame({
  rail,
  children,
}: {
  rail: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app">
      {rail}
      <main className="main">{children}</main>
      <MobileTabBar />
    </div>
  );
}
