import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import "./marketing.css";
import { Nav } from "./_components/nav";
import { Footer } from "./_components/footer";
import { MarketingInteractions } from "./_components/marketing-interactions";
import { PreviewBanner } from "./_components/preview-banner";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proscene · The one place your show lives",
  description:
    "Proscene keeps cast, crew, and creative teams in sync. Calls, calendar, script, blocking, and reports, all in one place. Stop scattering the production across drives, inboxes, and group chats.",
};

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // draftMode() is true only when the preview cookie is set — i.e. the page was
  // opened from the Studio's Presentation pane via /api/draft-mode/enable. The
  // overlay + exit banner mount only then; normal visitors ship neither. (No
  // render-mode cost: the app is already dynamic because the root layout reads
  // the theme cookie.)
  const { isEnabled: isPreview } = await draftMode();

  return (
    <div className={`ps-site ${geist.variable}`}>
      <Nav />
      <main>{children}</main>
      <Footer />
      <MarketingInteractions />
      {isPreview && (
        <>
          <PreviewBanner />
          <VisualEditing />
        </>
      )}
    </div>
  );
}
