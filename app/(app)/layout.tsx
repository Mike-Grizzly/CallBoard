import type { ReactNode } from "react";
import { Rail } from "@/components/app-shell/rail";
import { AppFrame } from "@/components/app-shell/app-frame";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppFrame rail={<Rail />}>{children}</AppFrame>;
}
