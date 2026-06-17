import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireCurrentUser, isDesignerOnly } from "@/lib/auth";
import { Rail } from "@/components/app-shell/rail";
import { AppFrame } from "@/components/app-shell/app-frame";
import { BannerSlot } from "@/components/app-shell/banner-slot";
import { AnnouncementBanner } from "@/components/app-shell/announcement-banner";
import { TrialBanner } from "@/components/app-shell/trial-banner";
import { TrialCountdown } from "@/components/app-shell/trial-countdown";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Designer-package subscribers live entirely in the self-contained Focus
  // View — they never see the dashboard shell. Bounce them out of the whole
  // (app) group. (requireCurrentUser is request-deduped, so this is free.)
  const user = await requireCurrentUser();
  if (isDesignerOnly(user)) redirect("/focus");

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
    </>
  );
}
