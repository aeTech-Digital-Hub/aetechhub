import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Pin, Calendar } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Announcement } from "@/models";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";

export const revalidate = 300; // 5 minutes

export const metadata = {
  title: "Announcements",
  description:
    "Studio news, project launches, and updates from aeTech Digital Hub.",
  alternates: { canonical: "/announcements" },
};

type AnnouncementLean = {
  _id: string;
  slug: string;
  title: string;
  summary?: string;
  cover?: string;
  category?: string;
  pinned?: boolean;
  publishedAt?: Date;
  createdAt?: Date;
};

async function getAnnouncements(): Promise<AnnouncementLean[]> {
  try {
    await dbConnect();
    const items = await Announcement.find({ published: true })
      .sort({ pinned: -1, publishedAt: -1, createdAt: -1 })
      .limit(100)
      .lean<AnnouncementLean[]>();
    return JSON.parse(JSON.stringify(items));
  } catch (err) {
    console.error("[announcements] fetch failed:", err);
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

export default async function AnnouncementsPage() {
  const items = await getAnnouncements();
  const pinned = items.filter((a) => a.pinned);
  const regular = items.filter((a) => !a.pinned);

  return (
    <>
      {/* Header */}
      <section className="container-px pt-28 pb-10 lg:pt-36 lg:pb-14 bg-base">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              Back home
            </Link>
            <p className="eyebrow mb-5">Announcements</p>
            <h1 className="h-display text-[40px] sm:text-[52px] lg:text-[64px] tracking-tightest mb-5 leading-[1.02]">
              What&apos;s new{" "}
              <span className=" font-light gradient-text">
                at the studio.
              </span>
            </h1>
            <p className="text-[15px] lg:text-[17px] text-ink-2 leading-relaxed max-w-xl mx-auto">
              Project launches, studio milestones, thoughts on the work. Not
              marketing — just what we&apos;re shipping.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Pinned — hero card */}
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
// CARDS
// ─────────────────────────────────────────

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
      {/* Image or fallback gradient */}
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

      {/* Body */}
      <div className={`p-6 lg:p-8 ${large ? "lg:p-10" : ""}`}>
        <div className="flex items-center gap-3 mb-4">
          {item.category && (
            <span
              className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded"
              style={{
                background: "var(--brand-100)",
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
          <p
            className={`text-ink-2 leading-relaxed mb-5 ${
              large ? "text-[16px] lg:text-[17px]" : "text-[14.5px]"
            }`}
          >
            {item.summary}
          </p>
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
      {/* Image (padded, Hims-style inset) */}
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

      {/* Body */}
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

        {item.summary && (
          <p className="text-[13.5px] text-ink-2 leading-relaxed line-clamp-3">
            {item.summary}
          </p>
        )}
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
