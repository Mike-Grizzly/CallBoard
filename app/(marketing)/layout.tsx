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
  title: "Proscene — The production hub for stage managers",
  description:
    "Proscene keeps your whole production on the same page — calls, calendars, scripts, blocking, and reports. One hub for the stage manager, the cast, and the crew.",
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
