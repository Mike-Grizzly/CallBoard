import type { ReactNode } from "react";

/**
 * Wraps non-production pages in the demo's `.page` scroll container so
 * they pick up the warm padding and scrollbar styling. The production
 * tree has its own layout that renders the topbar + tabs above its own
 * `.page` wrapper, so it deliberately sits outside this group.
 */
export default function DefaultLayout({ children }: { children: ReactNode }) {
  return <div className="page">{children}</div>;
}
