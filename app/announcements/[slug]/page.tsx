import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Announcement } from '@/models';
import { formatDate } from '@/lib/utils';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    await dbConnect();
    const items = await Announcement.find({ published: true }).select('slug').lean<any[]>();
    return items.map((a) => ({ slug: a.slug }));
  } catch { return []; }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    await dbConnect();
    const a: any = await Announcement.findOne({ slug, published: true }).lean();
    if (!a) return { title: 'Announcement not found' };
    return {
      title: a.title,
      description: a.excerpt || a.body?.slice(0, 160),
      alternates: { canonical: `/announcements/${slug}` },
      openGraph: {
        title: a.title,
        description: a.excerpt,
        type: 'article',
        url: `/announcements/${slug}`,
        publishedTime: a.publishedAt,
        images: a.cover ? [{ url: a.cover, width: 1200, height: 630 }] : undefined,
      },
    };
  } catch { return { title: 'Announcement' }; }
}

export default async function AnnouncementDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await dbConnect();
  const a: any = await Announcement.findOne({ slug, published: true }).lean();
  if (!a) return notFound();

  return (
    <>
      <BreadcrumbJsonLd trail={[
        { name: 'Home',          href: '/' },
        { name: 'Announcements', href: '/announcements' },
        { name: a.title,         href: `/announcements/${slug}` },
      ]} />

      <article className="container-px pt-20 lg:pt-28 pb-32 max-w-3xl mx-auto">
        <Link href="/announcements" className="eyebrow text-purple-700 hover:opacity-70 mb-8 inline-block">← All announcements</Link>
        <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-3">{a.type}</p>
        <h1 className="h-display text-5xl lg:text-7xl leading-[0.95] mb-6">{a.title}</h1>
        <p className="text-sm text-ink/50">{a.publishedAt && formatDate(a.publishedAt)}</p>

        {a.cover && <div className="aspect-[16/9] bg-ink overflow-hidden my-12"><img src={a.cover} alt={a.title} className="w-full h-full object-cover" loading="lazy" /></div>}

        <div className="prose prose-lg max-w-none mt-12 text-lg leading-relaxed text-ink/80 whitespace-pre-wrap font-serif">
          {a.body || a.excerpt}
        </div>
      </article>
    </>
  );
}
