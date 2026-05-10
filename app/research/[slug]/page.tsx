import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Research } from '@/models';
import { formatDate } from '@/lib/utils';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    await dbConnect();
    const articles = await Research.find({ published: true }).select('slug').lean<any[]>();
    return articles.map((a) => ({ slug: a.slug }));
  } catch { return []; }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    await dbConnect();
    const a: any = await Research.findOne({ slug, published: true }).lean();
    if (!a) return { title: 'Article not found' };
    return {
      title: a.title,
      description: a.excerpt || a.body?.slice(0, 160),
      alternates: { canonical: `/research/${slug}` },
      authors: a.author ? [{ name: a.author }] : undefined,
      keywords: a.tags,
      openGraph: {
        title: a.title,
        description: a.excerpt,
        type: 'article',
        url: `/research/${slug}`,
        publishedTime: a.publishedAt,
        authors: a.author ? [a.author] : undefined,
        tags: a.tags,
        images: a.cover ? [{ url: a.cover, width: 1200, height: 630 }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: a.title,
        description: a.excerpt,
        images: a.cover ? [a.cover] : undefined,
      },
    };
  } catch { return { title: 'Article' }; }
}

export default async function ResearchDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await dbConnect();
  const a: any = await Research.findOne({ slug, published: true }).lean();
  if (!a) return notFound();

  return (
    <>
      <ArticleJsonLd
        title={a.title}
        description={a.excerpt || ''}
        slug={slug}
        publishedAt={a.publishedAt}
        author={a.author}
        image={a.cover}
      />
      <BreadcrumbJsonLd trail={[
        { name: 'Home',     href: '/' },
        { name: 'Research', href: '/research' },
        { name: a.title,    href: `/research/${slug}` },
      ]} />

      <article className="container-px pt-20 lg:pt-28 pb-32 max-w-3xl mx-auto">
        <Link href="/research" className="eyebrow text-purple-700 hover:opacity-70 mb-8 inline-block">← All research</Link>
        <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-3">{a.category}</p>
        <h1 className="h-display text-5xl lg:text-7xl leading-[0.95] mb-6">{a.title}</h1>
        <p className="text-sm text-ink/50">By {a.author || 'aeTech'} · {a.publishedAt && formatDate(a.publishedAt)} · {a.readTime} min read</p>

        {a.cover && <div className="aspect-[16/9] bg-ink overflow-hidden my-12"><img src={a.cover} alt={a.title} className="w-full h-full object-cover" loading="lazy" /></div>}

        <div className="prose prose-lg max-w-none mt-12 text-lg leading-relaxed text-ink/80 whitespace-pre-wrap font-serif">
          {a.body || a.excerpt}
        </div>

        {a.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-16 pt-8 border-t border-rule">
            {a.tags.map((t: string) => <span key={t} className="text-xs text-ink/50 border border-rule px-2.5 py-1 rounded-full">#{t}</span>)}
          </div>
        )}
      </article>
    </>
  );
}
