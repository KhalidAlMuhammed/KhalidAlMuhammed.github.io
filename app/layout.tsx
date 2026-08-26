import type { Metadata } from "next";
import localFont from "next/font/local";
import { Vazirmatn, JetBrains_Mono } from "next/font/google";
import Header from "@/components/Header";
import Analytics from "@/components/Analytics";
import { SITE } from "@/lib/site";
import "./globals.css";

/**
 * The same two faces reem.chat actually renders. Its stylesheet also declares
 * Poppins, but the browser never loads it — measured against the live site,
 * every heading and control is Thmanyah Sans and every run of body copy is
 * Vazirmatn.
 *
 * Thmanyah Sans is self-hosted (it is not on Google Fonts); the woff2 files
 * come from the reem.chat build.
 */
const sans = localFont({
  src: [
    { path: "../public/fonts/thmanyahsans-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/thmanyahsans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/thmanyahsans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/thmanyahsans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

// Body copy, as on reem.chat.
const body = Vazirmatn({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s — ${SITE.shortName}`,
  },
  description: SITE.description,
  authors: [{ name: SITE.author, url: SITE.url }],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": [{ url: "/feed.xml", title: SITE.title }] },
  },
  openGraph: {
    type: "website",
    siteName: SITE.shortName,
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    creator: "@k_almuhammed",
  },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: "#fefffc" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='42' fill='%232f5d4a'/%3E%3C/svg%3E"
        />
        <link rel="alternate" type="application/rss+xml" title={SITE.title} href="/feed.xml" />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
