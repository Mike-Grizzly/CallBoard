import { redirect } from "next/navigation";

/**
 * Root entry. Phase 1: always send visitors to /dashboard.
 * Phase 2 will add auth gating and redirect unauthenticated users to /login.
 */
export default function RootPage() {
  redirect("/dashboard");
}
