import { redirect } from "next/navigation";

/**
 * Root entry. Redirects to /dashboard.
 * The proxy handles auth gating — unauthenticated users will be
 * redirected to /login before this page even renders.
 */
export default function RootPage() {
  redirect("/dashboard");
}
