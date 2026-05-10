"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WELCOME_FLAG_KEY } from "./WelcomeFlow";

/**
 * Sits in the root layout. On first paint:
 *   - If we're on the homepage AND the visitor hasn't seen the welcome → redirect to /welcome
 *   - Otherwise, do nothing
 *
 * Why client-side and not middleware?
 *   – We want crawlers / direct deep-links to skip the welcome.
 *   – LocalStorage is the simplest "remember once" primitive.
 *   – Bots don't run client JS, so they get the homepage immediately. Good for SEO.
 *
 * Edge cases handled:
 *   – Direct navigation to inner pages (/services, /projects, etc.) is NEVER intercepted.
 *   – If the visitor is already on /welcome, we don't loop redirect them.
 *   – If localStorage is unavailable (private mode, errors), we fail open — they see the site.
 */
export function WelcomeGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only intercept the homepage
    if (pathname !== "/") return;

    // Don't intercept if a query param tells us not to (helps e.g. CMS preview, dev escape hatch)
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("skipwelcome=1")
    ) {
      return;
    }

    // Has this visitor been welcomed already?
    let welcomed = false;
    try {
      welcomed = localStorage.getItem(WELCOME_FLAG_KEY) === "1";
    } catch {
      // localStorage blocked — fail open, show the homepage
      welcomed = true;
    }

    if (!welcomed) {
      router.replace("/welcome");
    }
  }, [pathname, router]);

  return null;
}
