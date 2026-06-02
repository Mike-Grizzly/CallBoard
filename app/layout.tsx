import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proscene — Production Hub",
  description:
    "A lightweight production portal for small theatre companies.",
  applicationName: "Proscene",
  icons: {
    icon: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Proscene",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before paint: reads the theme cookie, resolves "system" against the OS
// preference, and sets body[data-theme] + the status-bar color so there is no
// light-mode flash on load (the server can't know the OS preference).
const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)proscene-theme=([^;]+)/);var p=m?decodeURIComponent(m[1]):"system";var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.body.dataset.theme=d?"dark":"warm";var t=document.querySelector('meta[name="theme-color"]');if(t)t.setAttribute("content",d?"#1d1b18":"#fbf8f3");}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side default to minimise flash for explicit light/dark choices;
  // the inline script corrects "system" before paint.
  const pref = (await cookies()).get("proscene-theme")?.value;
  const initialTheme = pref === "dark" ? "dark" : "warm";

  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        data-theme={initialTheme}
        data-density="regular"
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
