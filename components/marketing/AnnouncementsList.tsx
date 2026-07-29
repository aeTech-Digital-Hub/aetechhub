"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Pin, Calendar } from "lucide-react";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";

/**
 * Client component wrapper for the announcements list.
 *
 * The parent server component fetches announcements from MongoDB and passes them
 * to this component, which handles the interactive "Read more" behaviour.
 *
 * Rules for the Read more toggle:
 *   - Summaries under 200 chars display in full, no toggle
 *   - Summaries over 200 chars show first 200 chars, then "…", then "Read more"
 *   - "Read more" is INTENTIONALLY not a link to the detail page — it just
 *     expands the summary in-place. Users who want the full article click the
 *     card. This separates "let me see more of this preview" from "let me
 *     read the whole thing".
 *
 * Design decision: no absolute char count shown ("165/200"). Users don't need
 * to see the number — they either see everything or see the toggle.
 */

const SUMMARY_LIMIT = 200;

export type AnnouncementLean = {
  _id: string;
  slug: string;
  title: string;
  summary?: string;
  cover?: string;
  category?: string;
  pinned?: boolean;
  publishedAt?: string;
  createdAt?: string;
};

function fmtDate(d: string | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Truncate at a word boundary near the limit, so we don't end mid-word.
 * If the whole summary is under limit, returns null (caller shows the whole thing).
 */
function truncateAtWord(text: string, limit: number): string | null {
  if (text.length <= limit) return null;
  // Find the last space at or before the limit
  const chunk = text.slice(0, limit);
  const lastSpace = chunk.lastIndexOf(" ");
  const cutoff = lastSpace > limit * 0.7 ? lastSpace : limit;
  return chunk.slice(0, cutoff).trimEnd();
}

export function AnnouncementsList({
  pinned,
  regular,
}: {
  pinned: AnnouncementLean[];
  regular: AnnouncementLean[];
}) {
  return (
    <>
      {/* Pinned — hero card treatment */}
      {pinned.length > 0 && (
        <section className="container-px pb-16 lg:pb-24 bg-base">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="flex items-center gap-2 mb-5">
                <Pin
                  className="w-3.5 h-3.5"
                  strokeWidth={2}
                  style={{ color: "var(--brand)" }}
                />
                <p className="eyebrow" style={{ color: "var(--brand)" }}>
                  Pinned
                </p>
              </div>
            </Reveal>

            <StaggerReveal
              className={
                pinned.length === 1
                  ? "block"
                  : "grid md:grid-cols-2 gap-5 lg:gap-6"
              }
            >
              {pinned.slice(0, 2).map((a, i) => (
                <StaggerItem key={a._id}>
                  <PinnedCard item={a} large={pinned.length === 1 || i === 0} />
                </StaggerItem>
              ))}
            </StaggerReveal>
          </div>
        </section>
      )}

      {/* Regular list */}
      <section className="container-px pb-32 lg:pb-40 bg-tint-1 border-t border-rule">
        <div className="max-w-6xl mx-auto pt-16 lg:pt-24">
          {regular.length === 0 && pinned.length === 0 ? (
            <EmptyState />
          ) : regular.length === 0 ? null : (
            <>
              <Reveal>
                <div className="flex items-baseline justify-between mb-8 lg:mb-10">
                  <div>
                    <p className="eyebrow mb-3">All updates</p>
                    <h2 className="h-display text-[26px] lg:text-[32px] tracking-tighter">
                      More from the studio.
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-ink-3">
                    {regular.length}{" "}
                    {regular.length === 1 ? "update" : "updates"}
                  </span>
                </div>
              </Reveal>

              <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {regular.map((a) => (
                  <StaggerItem key={a._id}>
                    <AnnouncementCard item={a} />
                  </StaggerItem>
                ))}
              </StaggerReveal>
            </>
          )}
        </div>
      </section>
    </>
  );
}

// ─────────────────────────────────────────
// CARDS with Read more toggle
// ─────────────────────────────────────────

function ExpandableSummary({
  text,
  size,
}: {
  text: string;
  size: "sm" | "lg";
}) {
  const [expanded, setExpanded] = useState(false);
  const truncated = truncateAtWord(text, SUMMARY_LIMIT);
  const isLong = truncated !== null;

  const classes =
    size === "lg"
      ? "text-[16px] lg:text-[17px] text-ink-2 leading-relaxed"
      : "text-[13.5px] text-ink-2 leading-relaxed";

  if (!isLong) {
    return <p className={`${classes} mb-5`}>{text}</p>;
  }

  return (
    <p className={`${classes} mb-5`}>
      {expanded ? text : `${truncated}…`}{" "}
      <button
        type="button"
        onClick={(e) => {
          // Stop the parent card's link navigation
          e.preventDefault();
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="link-brand text-[13px] font-medium inline underline-offset-2 hover:underline transition-colors"
        aria-expanded={expanded}
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </p>
  );
}

function PinnedCard({
  item,
  large,
}: {
  item: AnnouncementLean;
  large: boolean;
}) {
  return (
    <Link
      href={`/announcements/${item.slug}`}
      className="group block border border-rule rounded-2xl bg-white lift overflow-hidden h-full"
    >
      <div
        className={`${large ? "aspect-[16/9]" : "aspect-[4/3]"} relative overflow-hidden`}
        style={{
          background:
            "linear-gradient(135deg, var(--brand-50) 0%, var(--brand-100) 100%)",
        }}
      >
        {item.cover ? (
          <Image
            src={item.cover}
            alt={item.title}
            fill
            sizes={
              large
                ? "(max-width: 1024px) 100vw, 1200px"
                : "(max-width: 768px) 100vw, 50vw"
            }
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            priority={large}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span
              className="h-display text-8xl float-slow opacity-30"
              style={{ color: "var(--brand)" }}
            >
              {item.category?.charAt(0)?.toUpperCase() || "N"}
            </span>
          </div>
        )}
      </div>

      <div className={`p-6 lg:p-8 ${large ? "lg:p-10" : ""}`}>
        <div className="flex items-center gap-3 mb-4">
          {item.category && (
            <span
              className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded"
              style={{ background: "var(--brand-100)", color: "var(--brand)" }}
            >
              {item.category}
            </span>
          )}
          <span className="text-[11px] font-mono text-ink-3 flex items-center gap-1">
            <Calendar className="w-3 h-3" strokeWidth={2} />
            {fmtDate(item.publishedAt || item.createdAt)}
          </span>
        </div>

        <h3
          className={`h-display tracking-tighter mb-3 group-hover:text-brand transition-colors ${
            large
              ? "text-[32px] lg:text-[42px] leading-[1.05]"
              : "text-[24px] leading-tight"
          }`}
        >
          {item.title}
        </h3>

        {item.summary && (
          <ExpandableSummary text={item.summary} size={large ? "lg" : "sm"} />
        )}

        <span className="inline-flex items-center gap-1.5 text-[13px] link-brand">
          Read update
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

function AnnouncementCard({ item }: { item: AnnouncementLean }) {
  return (
    <Link
      href={`/announcements/${item.slug}`}
      className="group block border border-rule rounded-2xl bg-white lift overflow-hidden h-full"
    >
      <div className="p-4">
        <div
          className="aspect-[4/3] rounded-xl relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-50) 0%, var(--brand-100) 100%)",
          }}
        >
          {item.cover ? (
            <Image
              src={item.cover}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <span
                className="h-display text-6xl float-slow opacity-30"
                style={{ color: "var(--brand)" }}
              >
                {item.category?.charAt(0)?.toUpperCase() || "N"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-7">
        <div className="flex items-center gap-2 mb-3">
          {item.category && (
            <span
              className="text-[10px] font-mono uppercase tracking-wider"
              style={{ color: "var(--brand)" }}
            >
              {item.category}
            </span>
          )}
          <span className="text-[10px] font-mono text-ink-3">·</span>
          <span className="text-[10px] font-mono text-ink-3">
            {fmtDate(item.publishedAt || item.createdAt)}
          </span>
        </div>

        <h3 className="h-display text-[19px] tracking-tight mb-2 leading-tight group-hover:text-brand transition-colors">
          {item.title}
        </h3>

        {item.summary && <ExpandableSummary text={item.summary} size="sm" />}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <p className="text-[15px] text-ink-3 italic mb-6">
        No announcements yet. Check back soon.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] link-brand"
      >
        Back home
        <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
      </Link>
    </div>
  );
}
