import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { THEME_COOKIE, THEME_EFFECTIVE_COOKIE } from "@/lib/theme";

// Google Tag Manager. Container ID is public (visible in page source). Loads
// site-wide; all tracking tags / ad pixels / conversions are then managed in
// the GTM web UI with no code changes. Overridable via NEXT_PUBLIC_GTM_ID.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-PLR3RW32";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Proscene — Production Hub",
  description:
    "A lightweight production portal for small theatre companies.",
  applicationName: "Proscene",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
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
// light-mode flash on load (the server can't know the OS preference). It also
// writes the resolved theme back to a cookie the server CAN read, so the next
// SSR paints the right theme directly — this is what eliminates the "System"
// flash on refresh (server would otherwise default to light, then flip here).
const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)proscene-theme=([^;]+)/);var p=m?decodeURIComponent(m[1]):"system";var e=p==="dark"?"dark":p==="dusk"?"dusk":p==="light"?"warm":(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"warm");document.body.dataset.theme=e;document.cookie="proscene-theme-eff="+e+"; path=/; max-age=31536000; samesite=lax";var c=e==="dark"?"#1d1b18":e==="dusk"?"#3b3632":"#fbf8f3";var t=document.querySelector('meta[name="theme-color"]');if(t)t.setAttribute("content",c);}catch(e){}})();`;

// Runs before paint: restores the collapsed-rail preference so the sidebar
// doesn't flash full-width before the client toggle mounts.
const RAIL_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("rail-collapsed")==="1"){document.body.dataset.railCollapsed="1";}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Render the theme the client last resolved (the "eff" cookie), so "System"
  // users paint dark/light correctly on load instead of flashing from light.
  // Fall back to the explicit pref when the resolved cookie isn't present yet
  // (first-ever visit); the inline script then corrects + seeds it before paint.
  const cookieStore = await cookies();
  const pref = cookieStore.get(THEME_COOKIE)?.value;
  const eff = cookieStore.get(THEME_EFFECTIVE_COOKIE)?.value;
  const initialTheme =
    eff === "dark" || eff === "dusk" || eff === "warm"
      ? eff
      : pref === "dark"
        ? "dark"
        : pref === "dusk"
          ? "dusk"
          : "warm";

  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {GTM_ID && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}
      <body
        data-theme={initialTheme}
        data-density="regular"
        suppressHydrationWarning
      >
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: RAIL_INIT_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
