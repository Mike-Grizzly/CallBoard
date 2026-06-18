import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./marketing.css";
import { Nav } from "./_components/nav";
import { Footer } from "./_components/footer";
import { MarketingInteractions } from "./_components/marketing-interactions";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proscene — The one place your show lives",
  description:
    "Proscene keeps cast, crew, and creative teams in sync. Calls, calendar, script, blocking, and reports, all in one place. Stop scattering the production across drives, inboxes, and group chats.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`ps-site ${geist.variable}`}>
      <Nav />
      <main>{children}</main>
      <Footer />
      <MarketingInteractions />
    </div>
  );
}
