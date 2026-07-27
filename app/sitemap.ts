import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/services";

/**
 * Sitemap generator for aeTech Digital Hub.
 *
 * Rules I'm following to avoid the common Google Search Console errors:
 *
 * 1. All URLs use HTTPS + the canonical domain (no trailing slashes to match Next.js defaults)
 * 2. `lastModified` uses ISO-8601 strings, never raw Date objects (Next.js occasionally
 *    serialises Date objects with timezone drift that Google flags)
 * 3. `changeFrequency` uses only the allowed enum values
 * 4. `priority` values are strictly 0.0 - 1.0
 * 5. No duplicate URLs
 * 6. Only URLs that exist on the current build — no phantom /blog if we don't ship one
 * 7. No URLs that redirect — every URL here is the final destination
 * 8. Excludes admin, portal, brief editor, sign-in — these are auth-gated or noindex
 *
 * If Google Search Console flags an entry, most likely it's because that
 * page returns a 404 or redirect. Verify each URL in the browser first.
 */

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://aetechdigitalhub.com"
).replace(/\/$/, ""); // ensure no trailing slash

// ISO string for "now" — used as a safe default when we don't track per-page mtime
const NOW = new Date().toISOString();

/** Fixed marketing pages — the ones we always want indexed */
const MARKETING_PAGES: Array<{
  path: string;
  changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFreq: "weekly", priority: 1.0 },
  { path: "/services", changeFreq: "monthly", priority: 0.9 },
  { path: "/projects", changeFreq: "monthly", priority: 0.8 },
  { path: "/research", changeFreq: "monthly", priority: 0.7 },
  { path: "/about", changeFreq: "monthly", priority: 0.6 },
  { path: "/book", changeFreq: "monthly", priority: 0.7 },
  { path: "/start-project", changeFreq: "monthly", priority: 0.8 },
  { path: "/brief/guide", changeFreq: "monthly", priority: 0.6 },
  // Legal
  { path: "/privacy", changeFreq: "yearly", priority: 0.3 },
  { path: "/terms", changeFreq: "yearly", priority: 0.3 },
];

/**
 * Deliberately EXCLUDED from the sitemap (these should also carry
 * `robots: { index: false }` in their page metadata):
 *
 *   /sign-in         — auth surface, no SEO value
 *   /login           — redirect to /sign-in
 *   /portal          — auth-gated user dashboard
 *   /brief           — auth-gated editor
 *   /brief/done      — post-submission confirmation
 *   /welcome         — one-time intro flow
 *   /admin/*         — internal admin surface
 *   /api/*           — API endpoints
 *   /i/[token]       — private invoice share links
 *   /r/[token]       — private receipt share links
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // 1. Fixed marketing pages
  for (const p of MARKETING_PAGES) {
    entries.push({
      url: `${SITE}${p.path}`,
      lastModified: NOW,
      changeFrequency: p.changeFreq,
      priority: p.priority,
    });
  }

  // 2. Service detail pages — one per entry in SERVICES
  //    (These are the meaningful long-tail SEO pages — Google finds
  //     "penetration testing Ghana" through these.)
  for (const svc of SERVICES) {
    entries.push({
      url: `${SITE}/services/${svc.slug}`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  // Dedupe defensively — if a bug ever causes the same URL to be added twice,
  // Google flags it hard. Keeping this even though it should be impossible.
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}
