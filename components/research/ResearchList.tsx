"use client";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";

type Article = {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string;
  cover?: string;
  author?: string;
  category?: string;
  tags?: string[];
  readTime?: number;
  publishedAt?: string | Date;
};

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  research: "Research",
  engineering: "Software Engineering",
  design: "Design",
  business: "Business",
};

export function ResearchList({ articles }: { articles: Article[] }) {
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");

  // Categories present in the data, prefixed by "all"
  const categories = useMemo(() => {
    const present = new Set<string>();
    articles.forEach((a) => a.category && present.add(a.category));
    return ["all", ...Array.from(present)];
  }, [articles]);

  // Counts per category
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: articles.length };
    articles.forEach((a) => {
      if (!a.category) return;
      c[a.category] = (c[a.category] || 0) + 1;
    });
    return c;
  }, [articles]);

  // Filter articles
  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (activeCat !== "all" && a.category !== activeCat) return false;
      if (query) {
        const q = query.toLowerCase();
        const haystack = [a.title, a.excerpt, a.author, ...(a.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [articles, activeCat, query]);

  return (
    <>
      {/* Filter bar */}
      <div className="container-px max-w-7xl mx-auto pt-2 pb-12 lg:pb-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-rule">
          {/* Category chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => {
              const active = cat === activeCat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`
                    inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] transition-colors
                    ${
                      active
                        ? "bg-white border border-rule text-ink shadow-sm"
                        : "text-ink-2 hover:text-ink"
                    }
                  `}
                >
                  {CATEGORY_LABELS[cat] || cat}
                  {active && counts[cat] > 0 && (
                    <span
                      className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[11px] font-medium text-white"
                      style={{ background: "var(--brand)" }}
                    >
                      {counts[cat]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3"
              strokeWidth={2}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles…"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-rule text-[13px] placeholder:text-ink-3 focus:outline-none focus:border-ink-2 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="container-px max-w-7xl mx-auto pb-24 lg:pb-32">
        {filtered.length === 0 ? (
          <p className="text-center text-ink-2 py-20 text-[15px]">
            {query ? (
              <>
                No articles match{" "}
                <span className="text-ink">&ldquo;{query}&rdquo;</span>.
              </>
            ) : (
              <>No articles in this category yet.</>
            )}
          </p>
        ) : (
          <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {filtered.map((a) => (
              <StaggerItem key={a._id}>
                <Link
                  href={`/research/${a.slug}`}
                  className="group block rounded-2xl overflow-hidden border border-rule lift bg-white h-full"
                >
                  {/* Image */}
                  <div className="aspect-[16/10] relative overflow-hidden bg-rule-2">
                    {a.cover ? (
                      <Image
                        src={a.cover}
                        alt={a.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover cine-image"
                      />
                    ) : (
                      <div
                        className="w-full h-full grid place-items-center"
                        style={{
                          background:
                            "linear-gradient(135deg, #F8F2FB 0%, #EDE3F4 100%)",
                        }}
                      >
                        <span
                          className="h-display text-4xl"
                          style={{ color: "var(--brand)" }}
                        >
                          {a.title
                            ?.split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 lg:p-6">
                    {a.category && (
                      <p
                        className="font-mono text-[11px] mb-2 tracking-wide"
                        style={{ color: "var(--brand)" }}
                      >
                        {CATEGORY_LABELS[a.category] || a.category}
                      </p>
                    )}
                    <h3 className="text-[17px] font-medium tracking-tight mb-2 leading-snug">
                      {a.title}
                    </h3>
                    {a.excerpt && (
                      <p className="text-[14px] text-ink-2 leading-relaxed line-clamp-2 mb-5">
                        {a.excerpt}
                      </p>
                    )}

                    {/* Footer: author + read time */}
                    <div className="flex items-center justify-between pt-4 border-t border-rule text-[12px] text-ink-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-medium text-white"
                          style={{ background: "var(--brand)" }}
                        >
                          {(a.author || "aT").charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-ink-2">
                          {a.author || "aeTech"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        {a.readTime && <span>{a.readTime} min read</span>}
                        <ArrowUpRight
                          className="w-3.5 h-3.5 group-hover:text-brand transition-colors"
                          strokeWidth={2}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerReveal>
        )}
      </div>
    </>
  );
}
