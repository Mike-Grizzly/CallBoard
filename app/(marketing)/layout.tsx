import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./marketing.css";
import { Nav } from "./_components/nav";
import { Footer } from "./_components/footer";
import { MarketingInteractions } from "./_components/marketing-interactions";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <div className={`ps-site ${inter.variable}`}>
      <Nav />
      <main>{children}</main>
      <Footer />
      <MarketingInteractions />
    </div>
  );
}
