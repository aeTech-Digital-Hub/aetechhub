import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/store/StoreProvider";
import { ChromeShell } from "@/components/marketing/ChromeShell";
import { Tracker } from "@/components/marketing/Tracker";
import { ToastViewport } from "@/components/ui/Toast";
import { OrgJsonLd } from "@/components/seo/JsonLd";

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
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "aeTech Digital Hub — Engineering for ambitious businesses",
    template: "%s · aeTech Digital Hub",
  },
  description:
    "aeTech Digital Hub is an engineering studio in Accra. We build custom websites, SaaS platforms, and the secure systems beneath them — for teams that need it done right.",
  applicationName: "aeTech Digital Hub",
  authors: [{ name: "aeTech Digital Hub", url: SITE_URL }],
  generator: "Next.js",
  keywords: [
    "aeTech",
    "aeTech Digital Hub",
    "web development Ghana",
    "SaaS development Accra",
    "penetration testing Ghana",
    "data analysis agency",
    "machine learning agency",
    "Next.js studio",
    "engineering studio Accra",
    "security audit Ghana",
  ],
  formatDetection: { email: false, address: false, telephone: false },
  icons: { icon: "/icon.png", apple: "/icon.png" },
  manifest: "/site.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: "aeTech Digital Hub",
    description: "Engineering for ambitious businesses.",
    url: SITE_URL,
    siteName: "aeTech Digital Hub",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "aeTech Digital Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "aeTech Digital Hub",
    description: "Engineering for ambitious businesses.",
    images: ["/og-default.png"],
  },
  robots: { index: true, follow: true },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="bg-white text-ink antialiased">
        <OrgJsonLd />
        <StoreProvider>
          <ChromeShell>{children}</ChromeShell>
          <Tracker />
          <ToastViewport />
        </StoreProvider>
      </body>
    </html>
  );
}
