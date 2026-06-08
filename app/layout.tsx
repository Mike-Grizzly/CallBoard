import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";

// Google Tag Manager. Container ID is public (visible in page source). Loads
// site-wide; all tracking tags / ad pixels / conversions are then managed in
// the GTM web UI with no code changes. Overridable via NEXT_PUBLIC_GTM_ID.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-PLR3RW32";

const inter = Inter({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-ui",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)proscene-theme=([^;]+)/);var p=m?decodeURIComponent(m[1]):"system";var e=p==="dark"?"dark":p==="dusk"?"dusk":p==="light"?"warm":(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"warm");document.body.dataset.theme=e;var c=e==="dark"?"#1d1b18":e==="dusk"?"#3b3632":"#fbf8f3";var t=document.querySelector('meta[name="theme-color"]');if(t)t.setAttribute("content",c);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side default to minimise flash for explicit light/dark choices;
  // the inline script corrects "system" before paint.
  const pref = (await cookies()).get("proscene-theme")?.value;
  const initialTheme =
    pref === "dark" ? "dark" : pref === "dusk" ? "dusk" : "warm";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
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
        {children}
      </body>
    </html>
  );
}
