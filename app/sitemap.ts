import type { MetadataRoute } from "next";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/Project";
import { Research, Announcement } from "@/models";
import { SERVICES } from "@/lib/services";

/**
 * Sitemap generator for aeTech Digital Hub.
 *
 * Rules I'm following to avoid Search Console errors:
 *   1. HTTPS, canonical domain, NO trailing slashes (matches Next.js behaviour)
 *   2. `lastModified` as ISO-8601 strings — never raw Date objects (timezone drift)
 *   3. `changeFrequency` uses only allowed enum values
 *   4. `priority` strictly 0.0 - 1.0
 *   5. Deduplicated
 *   6. Excludes auth-gated / private routes
 *   7. DB failures degrade gracefully — static routes still returned
 *   8. Bounded query result count so a huge collection can't blow memory
 */

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://aetechdigitalhub.com"
).replace(/\/$/, "");

const MAX_ITEMS_PER_COLLECTION = 500;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE}/services`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE}/projects`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE}/research`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE}/announcements`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${SITE}/start-project`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.9,
    },
    {
      url: `${SITE}/book`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${SITE}/brief/guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = SERVICES.map((s) => ({
    url: `${SITE}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  let projectRoutes: MetadataRoute.Sitemap = [];
  let researchRoutes: MetadataRoute.Sitemap = [];
  let announcementRoutes: MetadataRoute.Sitemap = [];

  try {
    await dbConnect();
    const [projects, research, announcements] = await Promise.all([
      Project.find({ published: true })
        .select("slug updatedAt")
        .limit(MAX_ITEMS_PER_COLLECTION)
        .lean<Array<{ slug: string; updatedAt?: Date }>>(),
      Research.find({ published: true })
        .select("slug updatedAt")
        .limit(MAX_ITEMS_PER_COLLECTION)
        .lean<Array<{ slug: string; updatedAt?: Date }>>(),
      Announcement.find({ published: true })
        .select("slug updatedAt")
        .limit(MAX_ITEMS_PER_COLLECTION)
        .lean<Array<{ slug: string; updatedAt?: Date }>>(),
    ]);

    projectRoutes = projects
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${SITE}/projects/${p.slug}`,
        lastModified: (p.updatedAt
          ? new Date(p.updatedAt)
          : new Date()
        ).toISOString(),
        changeFrequency: "monthly",
        priority: 0.7,
      }));

    researchRoutes = research
      .filter((r) => r.slug)
      .map((r) => ({
        url: `${SITE}/research/${r.slug}`,
        lastModified: (r.updatedAt
          ? new Date(r.updatedAt)
          : new Date()
        ).toISOString(),
        changeFrequency: "monthly",
        priority: 0.6,
      }));

    announcementRoutes = announcements
      .filter((a) => a.slug)
      .map((a) => ({
        url: `${SITE}/announcements/${a.slug}`,
        lastModified: (a.updatedAt
          ? new Date(a.updatedAt)
          : new Date()
        ).toISOString(),
        changeFrequency: "yearly",
        priority: 0.5,
      }));
  } catch (err) {
    console.error(
      "[sitemap] DB fetch failed, returning static routes only:",
      err,
    );
  }

  const all = [
    ...staticRoutes,
    ...serviceRoutes,
    ...projectRoutes,
    ...researchRoutes,
    ...announcementRoutes,
  ];
  const seen = new Set<string>();
  return all.filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}
