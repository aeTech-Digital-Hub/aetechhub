import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Calendar, Pin } from "lucide-react";
import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Announcement } from "@/models";
import { Reveal } from "@/components/motion/Reveal";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getAnnouncement(slug);
  if (!item) return { title: "Announcement not found" };

  return {
    title: item.title,
    description:
      item.summary || `Studio update from aeTech Digital Hub — ${item.title}`,
    alternates: { canonical: `/announcements/${slug}` },
    openGraph: {
      title: item.title,
      description: item.summary,
      images: item.cover ? [{ url: item.cover }] : undefined,
      type: "article",
      publishedTime: item.publishedAt
        ? new Date(item.publishedAt).toISOString()
        : undefined,
    },
  };
}

type AnnouncementLean = {
  _id: string;
  slug: string;
  title: string;
  summary?: string;
  body?: string;
  cover?: string;
  category?: string;
  pinned?: boolean;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

async function getAnnouncement(slug: string): Promise<AnnouncementLean | null> {
  try {
    await dbConnect();
    const item = await Announcement.findOne({
      slug,
      published: true,
    }).lean<AnnouncementLean>();
    return item ? JSON.parse(JSON.stringify(item)) : null;
  } catch (err) {
    console.error("[announcement] fetch failed:", err);
    return null;
  }
}

async function getRelated(currentSlug: string): Promise<AnnouncementLean[]> {
  try {
    await dbConnect();
    const items = await Announcement.find({
      published: true,
      slug: { $ne: currentSlug },
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3)
      .lean<AnnouncementLean[]>();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

function fmtDate(d: Date | string | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Render the body content. Supports plain text (with paragraph breaks) or
 * simple markdown-like conventions. If your announcements store rich HTML,
 * swap this out for a sanitised HTML renderer.
 */
function BodyContent({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/).filter((b) => b.trim());
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        // H2 — line starting with ##
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
        // H3 — line starting with ###
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
        // Bullet list — lines starting with - or *
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
        // Blockquote — line starting with >
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
        // Regular paragraph
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

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [item, related] = await Promise.all([
    getAnnouncement(slug),
    getRelated(slug),
  ]);

  if (!item) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Announcements", href: "/announcements" },
          { name: item.title, href: `/announcements/${slug}` },
        ]}
      />

      {/* Header meta strip */}
      <section className="container-px pt-28 pb-6 lg:pt-36 lg:pb-8 bg-base">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <Link
              href="/announcements"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              All announcements
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              {item.pinned && (
                <span
                  className="inline-flex items-center gap-1 text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded"
                  style={{
                    background: "var(--brand-100)",
                    color: "var(--brand)",
                  }}
                >
                  <Pin className="w-2.5 h-2.5" strokeWidth={2} />
                  Pinned
                </span>
              )}
              {item.category && (
                <span
                  className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded"
                  style={{
                    background: "var(--bg-tint-2)",
                    color: "var(--brand)",
                  }}
                >
                  {item.category}
                </span>
              )}
              <span className="text-[11px] font-mono text-ink-3 flex items-center gap-1">
                <Calendar className="w-3 h-3" strokeWidth={2} />
                {fmtDate(item.publishedAt || item.createdAt)}
              </span>
            </div>

            <h1 className="h-display text-[36px] sm:text-[44px] lg:text-[56px] tracking-tightest leading-[1.05] mb-6">
              {item.title}
            </h1>

            {item.summary && (
              <p className="text-[17px] lg:text-[19px] text-ink-2 leading-relaxed max-w-2xl">
                {item.summary}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      {/* Hero image */}
      {item.cover && (
        <section className="container-px pb-10 lg:pb-14 bg-base">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div
                className="aspect-[16/9] rounded-2xl overflow-hidden relative"
                style={{ background: "var(--brand-50)" }}
              >
                <Image
                  src={item.cover}
                  alt={item.title}
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

      {/* Body */}
      {item.body && (
        <section className="container-px pb-20 lg:pb-24 bg-base">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <BodyContent text={item.body} />
            </Reveal>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="container-px pb-32 lg:pb-40 bg-tint-1 border-t border-rule">
          <div className="max-w-6xl mx-auto pt-16 lg:pt-24">
            <Reveal>
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <p className="eyebrow mb-3">More updates</p>
                  <h2 className="h-display text-[24px] lg:text-[28px] tracking-tighter">
                    Keep reading.
                  </h2>
                </div>
                <Link
                  href="/announcements"
                  className="text-[13px] link-brand inline-flex items-center gap-1.5"
                >
                  All announcements
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {related.map((r) => (
                <Link
                  key={r._id}
                  href={`/announcements/${r.slug}`}
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
                            {r.category?.charAt(0)?.toUpperCase() || "N"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-2">
                      {fmtDate(r.publishedAt || r.createdAt)}
                    </p>
                    <h3 className="h-display text-[17px] tracking-tight leading-tight group-hover:text-brand transition-colors">
                      {r.title}
                    </h3>
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
