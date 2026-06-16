import type { ReactNode } from "react";
import { Rail } from "@/components/app-shell/rail";
import { AppFrame } from "@/components/app-shell/app-frame";
import { BannerSlot } from "@/components/app-shell/banner-slot";
import { AnnouncementBanner } from "@/components/app-shell/announcement-banner";
import { TrialBanner } from "@/components/app-shell/trial-banner";
import { TrialCountdown } from "@/components/app-shell/trial-countdown";
import { TourController } from "@/components/tour/tour-controller";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // cache()-deduped with the Rail's own getCurrentUser() — no extra queries.
  const user = await getCurrentUser();

  return (
    <>
      <TrialCountdown />
      <AppFrame
        rail={<Rail />}
        banner={
          <BannerSlot>
            <AnnouncementBanner />
            <TrialBanner />
          </BannerSlot>
        }
      >
        {children}
      </AppFrame>
      {user && <TourController seen={user.toursSeen} />}
    </>
  );
}
