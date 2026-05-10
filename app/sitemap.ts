import type { MetadataRoute } from 'next';
import { dbConnect } from '@/lib/db';
import { Project } from '@/models/Project';
import { Research, Announcement } from '@/models';
import { SERVICES } from '@/lib/services';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://aetechdigitalhub.com';

export const revalidate = 3600; // Re-build the sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`,                lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE}/services`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE}/projects`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE}/research`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE}/announcements`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE}/about`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/contact`,         lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.6 },
    { url: `${SITE}/start-project`,   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.9 },
    { url: `${SITE}/book`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.7 },
  ];

  // Service detail pages
  const serviceRoutes: MetadataRoute.Sitemap = SERVICES.map((s) => ({
    url: `${SITE}/services/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Dynamic routes from MongoDB
  let projectRoutes: MetadataRoute.Sitemap = [];
  let articleRoutes: MetadataRoute.Sitemap = [];
  let announcementRoutes: MetadataRoute.Sitemap = [];

  try {
    await dbConnect();
    const [projects, articles, announcements] = await Promise.all([
      Project.find({ published: true }).select('slug updatedAt').lean<any[]>(),
      Research.find({ published: true }).select('slug updatedAt').lean<any[]>(),
      Announcement.find({ published: true }).select('slug updatedAt').lean<any[]>(),
    ]);

    projectRoutes = projects.map((p) => ({
      url: `${SITE}/projects/${p.slug}`,
      lastModified: new Date(p.updatedAt || Date.now()),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
    articleRoutes = articles.map((a) => ({
      url: `${SITE}/research/${a.slug}`,
      lastModified: new Date(a.updatedAt || Date.now()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
    announcementRoutes = announcements.map((a) => ({
      url: `${SITE}/announcements/${a.slug}`,
      lastModified: new Date(a.updatedAt || Date.now()),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    }));
  } catch {
    // DB unavailable at build → still return static routes
  }

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...articleRoutes, ...announcementRoutes];
}
