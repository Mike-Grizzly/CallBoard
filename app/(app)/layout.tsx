import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { buildBrandStyles } from "@/lib/brand-colors";
import { Rail } from "@/components/app-shell/rail";
import { AppFrame } from "@/components/app-shell/app-frame";
import { BannerSlot } from "@/components/app-shell/banner-slot";
import { AnnouncementBanner } from "@/components/app-shell/announcement-banner";
import { TrialBanner } from "@/components/app-shell/trial-banner";
import { TrialCountdown } from "@/components/app-shell/trial-countdown";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Inject brand color overrides when the org has set custom colors.
  // getCurrentUser() is cache()-deduped so this doesn't add a round trip.
  let brandStyles: string | null = null;
  const user = await getCurrentUser();
  if (user) {
    const [org] = await db
      .select({
        brandColor: organizations.brandColor,
        brandColorSecondary: organizations.brandColorSecondary,
        brandColorHighlight: organizations.brandColorHighlight,
      })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);
    if (org) {
      brandStyles = buildBrandStyles(
        org.brandColor,
        org.brandColorSecondary,
        org.brandColorHighlight,
      );
    }
  }

  return (
    <>
      {brandStyles && (
        // eslint-disable-next-line react/no-danger
        <style dangerouslySetInnerHTML={{ __html: brandStyles }} />
      )}
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
