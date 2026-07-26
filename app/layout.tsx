import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/store/StoreProvider";
import { ChromeShell } from "@/components/marketing/ChromeShell";
import { Tracker } from "@/components/marketing/Tracker";
import { ToastViewport } from "@/components/ui/Toast";
import {
  OrgJsonLd,
  LocalBusinessJsonLd,
  WebSiteJsonLd,
} from "@/components/seo/JsonLd";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://aetechdigitalhub.com";

export const viewport: Viewport = {
  themeColor: "#FCFAF7",
  width: "device-width",
  initialScale: 1,
};

/**
 * Metadata philosophy:
 * - Every default title / description contains "Accra" or "Ghana" to disambiguate
 *   from other "aeTech" companies globally.
 * - No `keywords` field — Google has ignored it since 2009, and it's a common
 *   spam signal on the site quality side.
 * - Canonical URL points to root; per-page canonicals override.
 * - OpenGraph + Twitter descriptions are longer + specific (not the marketing tagline)
 *   because those actually get shown by social platforms and affect click-through.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "aeTech Digital Hub · Engineering Studio in Accra, Ghana",
    template: "%s · aeTech Digital Hub · Accra, Ghana",
  },

  description:
    "aeTech Digital Hub is an engineering studio based in Accra, Ghana. We build custom websites, SaaS platforms, machine learning systems, and cybersecurity engagements for clients across Ghana, the United Kingdom, and the United States.",

  applicationName: "aeTech Digital Hub",
  authors: [{ name: "Ephraim Tetteh Apetorgbor", url: SITE_URL }],
  creator: "aeTech Digital Hub",
  publisher: "aeTech Digital Hub",
  generator: "Next.js",

  // Category helps Google classify the domain
  category: "technology",

  formatDetection: { email: false, address: false, telephone: false },
  icons: { icon: "/icon.png", apple: "/icon.png" },
  manifest: "/site.webmanifest",

  // Root-level canonical. Per-page metadata should override with its own canonical.
  alternates: {
    canonical: "/",
    languages: {
      "en-GH": "/",
      "en-US": "/",
      "en-GB": "/",
    },
  },

  openGraph: {
    title: "aeTech Digital Hub · Engineering Studio in Accra, Ghana",
    description:
      "Custom websites, SaaS platforms, machine learning systems, and cybersecurity engagements — built by a senior-led studio in Accra, Ghana.",
    url: SITE_URL,
    siteName: "aeTech Digital Hub",
    locale: "en_GH",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "aeTech Digital Hub — Engineering studio in Accra, Ghana",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "aeTech Digital Hub · Accra, Ghana",
    description:
      "Custom websites, SaaS platforms, machine learning, and cybersecurity — senior-led engineering studio in Accra.",
    images: ["/og-default.png"],
    // If you get a Twitter/X handle, add it here — helps disambiguation
    // creator: '@aetechdigitalhub',
    // site: '@aetechdigitalhub',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="bg-white text-ink antialiased" suppressHydrationWarning>
        {/*
          suppressHydrationWarning: allows browser extensions (Grammarly, LastPass,
          etc.) to inject attributes into <body> without React screaming about
          hydration mismatch. Scoped to <body> only — does NOT suppress real
          hydration bugs elsewhere in the tree.
        */}

        {/* Structured data — three JSON-LD blocks that tell Google exactly what we are */}
        <OrgJsonLd />
        <LocalBusinessJsonLd />
        <WebSiteJsonLd />

        <StoreProvider>
          <ChromeShell>{children}</ChromeShell>
          <Tracker />
          <ToastViewport />
        </StoreProvider>
      </body>
    </html>
  );
}
