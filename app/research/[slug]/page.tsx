import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Calendar, Clock } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Research } from "@/models";
import { formatDate } from "@/lib/utils";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;

const CATEGORY_LABELS: Record<string, string> = {
  research: "Research",
  engineering: "Software Engineering",
  design: "Design",
  business: "Business",
};

type ArticleLean = {
  _id: string;
  slug: string;
  title: string;
  category?: string;
  excerpt?: string;
  body?: string;
  cover?: string;
  gallery?: string[];
  author?: string;
  tags?: string[];
  readTime?: number;
  publishedAt?: Date;
  createdAt?: Date;
};

async function getArticle(slug: string): Promise<ArticleLean | null> {
  try {
    await dbConnect();
    const doc = await Research.findOne({
      slug,
      published: { $ne: false },
    }).lean<ArticleLean>();

    if (!doc) {
      console.warn(
        `[research/${slug}] not found — check slug or published state`,
      );
    }
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  } catch (err) {
    console.error(`[research/${slug}] query failed:`, err);
    return null;
  }
}

async function getRelated(
  currentSlug: string,
  category?: string,
): Promise<ArticleLean[]> {
  try {
    await dbConnect();
    // Prefer same-category articles; fall back to most-recent overall
    const sameCategoryQuery = category
      ? { slug: { $ne: currentSlug }, category, published: { $ne: false } }
      : null;

    let items: ArticleLean[] = [];
    if (sameCategoryQuery) {
      items = await Research.find(sameCategoryQuery)
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(3)
        .lean<ArticleLean[]>();
    }
    if (items.length < 3) {
      const fillNeeded = 3 - items.length;
      const excludeIds = [currentSlug, ...items.map((i) => i.slug)];
      const filler = await Research.find({
        slug: { $nin: excludeIds },
        published: { $ne: false },
      })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(fillNeeded)
        .lean<ArticleLean[]>();
      items = [...items, ...filler];
    }

    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  try {
    await dbConnect();
    const articles = await Research.find({ published: true })
      .select("slug")
      .lean<{ slug: string }[]>();
    return articles.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return { title: "Article not found" };

  return {
    title: a.title,
    description: a.excerpt || a.body?.slice(0, 160),
    alternates: { canonical: `/research/${slug}` },
    authors: a.author ? [{ name: a.author }] : undefined,
    keywords: a.tags,
    openGraph: {
      title: a.title,
      description: a.excerpt,
      type: "article",
      url: `/research/${slug}`,
      publishedTime: a.publishedAt
        ? new Date(a.publishedAt).toISOString()
        : undefined,
      authors: a.author ? [a.author] : undefined,
      tags: a.tags,
      images: a.cover
        ? [{ url: a.cover, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: a.title,
      description: a.excerpt,
      images: a.cover ? [a.cover] : undefined,
    },
  };
}

/**
 * Markdown-lite body renderer — matches the announcement and project
 * detail pages exactly. Any admin writing content with ## / ### / - / >
 * will see it rendered as headings / bullets / blockquotes here.
 * Plain paragraphs become paragraphs.
 */
function BodyContent({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/).filter((b) => b.trim());
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="h-display text-[26px] lg:text-[30px] tracking-tighter mt-10 mb-2"
            >
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="h-display text-[20px] lg:text-[22px] tracking-tight mt-8 mb-2"
            >
              {block.slice(4)}
            </h3>
          );
        }
        if (/^[-*] /m.test(block)) {
          const items = block
            .split("\n")
            .filter((l) => /^[-*] /.test(l))
            .map((l) => l.replace(/^[-*] /, ""));
          return (
            <ul key={i} className="space-y-2 pl-1">
              {items.map((it, j) => (
                <li
                  key={j}
                  className="flex gap-3 text-[15.5px] lg:text-[16.5px] text-ink-2 leading-relaxed"
                >
                  <span
                    style={{ color: "var(--brand)" }}
                    className="font-bold flex-shrink-0"
                  >
                    ·
                  </span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 pl-5 py-1 italic text-[16px] lg:text-[17px] text-ink-2"
              style={{ borderColor: "var(--brand)" }}
            >
              {block.slice(2)}
            </blockquote>
          );
        }
        return (
          <p
            key={i}
            className="text-[15.5px] lg:text-[16.5px] text-ink-2 leading-relaxed"
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}

export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const related = await getRelated(slug, article.category);
  const authorInitial = (article.author || "aeTech").charAt(0).toUpperCase();

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        description={article.excerpt || ""}
        slug={slug}
        publishedAt={article.publishedAt}
        author={article.author}
        image={article.cover}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Research", href: "/research" },
          { name: article.title, href: `/research/${slug}` },
        ]}
      />

      {/* HEADER */}
      <section className="container-px pt-28 pb-6 lg:pt-36 lg:pb-8 bg-base">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <Link
              href="/research"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              All research
            </Link>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {article.category && (
                <span
                  className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded"
                  style={{
                    background: "var(--brand-100)",
                    color: "var(--brand)",
                  }}
                >
                  {CATEGORY_LABELS[article.category] || article.category}
                </span>
              )}
              {article.publishedAt && (
                <span className="text-[11px] font-mono text-ink-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" strokeWidth={2} />
                  {formatDate(article.publishedAt)}
                </span>
              )}
              {article.readTime ? (
                <span className="text-[11px] font-mono text-ink-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" strokeWidth={2} />
                  {article.readTime} min read
                </span>
              ) : null}
            </div>

            {/* Title */}
            <h1 className="h-display text-[36px] sm:text-[44px] lg:text-[56px] tracking-tightest leading-[1.05] mb-6">
              {article.title}
            </h1>

            {/* Excerpt as lead paragraph */}
            {article.excerpt && (
              <p className="text-[17px] lg:text-[19px] text-ink-2 leading-relaxed max-w-2xl mb-8">
                {article.excerpt}
              </p>
            )}

            {/* Author strip */}
            <div className="flex items-center gap-3 pt-6 border-t border-rule">
              <span
                className="w-8 h-8 rounded-full grid place-items-center text-[13px] font-medium text-white"
                style={{ background: "var(--brand)" }}
              >
                {authorInitial}
              </span>
              <div>
                <p className="text-[13.5px] font-medium text-ink leading-tight">
                  {article.author || "aeTech"}
                </p>
                <p className="text-[11px] text-ink-3 font-mono">
                  Studio · Accra, Ghana
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HERO IMAGE */}
      {article.cover && (
        <section className="container-px pb-12 lg:pb-16 bg-base">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div
                className="aspect-[16/9] rounded-2xl overflow-hidden relative"
                style={{ background: "var(--brand-50)" }}
              >
                <Image
                  src={article.cover}
                  alt={article.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  className="object-cover"
                  priority
                />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* BODY */}
      {article.body && (
        <section className="container-px pb-16 lg:pb-20 bg-base">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <BodyContent text={article.body} />
            </Reveal>
          </div>
        </section>
      )}

      {/* GALLERY (optional) */}
      {article.gallery && article.gallery.length > 0 && (
        <section className="container-px pb-16 lg:pb-24 bg-base">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="mb-8">
                <p className="eyebrow mb-3">Figures</p>
                <h2 className="h-display text-[24px] lg:text-[30px] tracking-tighter">
                  Additional images.
                </h2>
              </div>
            </Reveal>

            <StaggerReveal className="grid sm:grid-cols-2 gap-5 lg:gap-6">
              {article.gallery.map((url, i) => (
                <StaggerItem key={`${url}-${i}`}>
                  <div
                    className="aspect-[4/3] rounded-2xl overflow-hidden relative border border-rule"
                    style={{ background: "var(--brand-50)" }}
                  >
                    <Image
                      src={url}
                      alt={`${article.title} — figure ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </div>
        </section>
      )}

      {/* TAGS */}
      {article.tags && article.tags.length > 0 && (
        <section className="container-px pb-16 lg:pb-20 bg-base">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <div className="pt-8 border-t border-rule">
                <p className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-3">
                  Tagged
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[12.5px] px-3 py-1 rounded-md bg-tint-1 border border-rule text-ink-2"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* RELATED */}
      {related.length > 0 && (
        <section className="container-px pb-32 lg:pb-40 bg-tint-1 border-t border-rule">
          <div className="max-w-6xl mx-auto pt-16 lg:pt-24">
            <Reveal>
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <p className="eyebrow mb-3">Keep reading</p>
                  <h2 className="h-display text-[24px] lg:text-[30px] tracking-tighter">
                    Related pieces.
                  </h2>
                </div>
                <Link
                  href="/research"
                  className="text-[13px] link-brand inline-flex items-center gap-1.5"
                >
                  All research
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {related.map((r) => (
                <Link
                  key={r._id}
                  href={`/research/${r.slug}`}
                  className="group block border border-rule rounded-2xl bg-white lift overflow-hidden"
                >
                  <div className="p-4">
                    <div
                      className="aspect-[4/3] rounded-xl relative overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--brand-50) 0%, var(--brand-100) 100%)",
                      }}
                    >
                      {r.cover ? (
                        <Image
                          src={r.cover}
                          alt={r.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center">
                          <span
                            className="h-display text-5xl float-slow opacity-30"
                            style={{ color: "var(--brand)" }}
                          >
                            {(r.category || "R").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                      {r.category && (
                        <span
                          className="text-[10px] font-mono uppercase tracking-wider"
                          style={{ color: "var(--brand)" }}
                        >
                          {CATEGORY_LABELS[r.category] || r.category}
                        </span>
                      )}
                      {r.publishedAt && (
                        <>
                          <span className="text-[10px] font-mono text-ink-3">
                            ·
                          </span>
                          <span className="text-[10px] font-mono text-ink-3">
                            {formatDate(r.publishedAt)}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="h-display text-[17px] tracking-tight leading-tight group-hover:text-brand transition-colors">
                      {r.title}
                    </h3>
                    {r.excerpt && (
                      <p className="text-[12.5px] text-ink-2 leading-relaxed mt-2 line-clamp-2">
                        {r.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
