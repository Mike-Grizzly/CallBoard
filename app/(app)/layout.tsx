import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { buildBrandStyle } from "@/lib/brand-colors";
import { Rail } from "@/components/app-shell/rail";
import { AppFrame } from "@/components/app-shell/app-frame";
import { BannerSlot } from "@/components/app-shell/banner-slot";
import { AnnouncementBanner } from "@/components/app-shell/announcement-banner";
import { TrialBanner } from "@/components/app-shell/trial-banner";
import { TrialCountdown } from "@/components/app-shell/trial-countdown";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // CSS custom properties set via inline style always win over any stylesheet
  // rule, so this reliably overrides the body[data-theme] variable definitions
  // in globals.css regardless of document order or specificity.
  let brandStyle: Record<string, string> | null = null;
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
      brandStyle = buildBrandStyle(
        org.brandColor,
        org.brandColorSecondary,
        org.brandColorHighlight,
      );
    }
  }

  return (
    <div style={(brandStyle as React.CSSProperties) ?? undefined}>
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
    </div>
  );
}
