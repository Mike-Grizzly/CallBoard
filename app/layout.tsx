import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Show Portal",
  description:
    "A lightweight production portal for small theatre companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
