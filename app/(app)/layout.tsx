import type { ReactNode } from "react";
import { Rail } from "@/components/app-shell/rail";
import { AppFrame } from "@/components/app-shell/app-frame";
import { AnnouncementBanner } from "@/components/app-shell/announcement-banner";
import { TrialBanner } from "@/components/app-shell/trial-banner";
import { TrialCountdown } from "@/components/app-shell/trial-countdown";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TrialCountdown />
      <AppFrame
        rail={<Rail />}
        banner={
          <>
            <TrialBanner />
            <AnnouncementBanner />
          </>
        }
      >
        {children}
      </AppFrame>
    </>
  );
}
