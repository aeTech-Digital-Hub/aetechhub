import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Announcement } from "@/models";
import { Reveal } from "@/components/motion/Reveal";
import {
  AnnouncementsList,
  type AnnouncementLean,
} from "@/components/marketing/AnnouncementsList";

export const revalidate = 300;

export const metadata = {
  title: "Announcements",
  description:
    "Studio news, project launches, and updates from aeTech Digital Hub.",
  alternates: { canonical: "/announcements" },
};

type RawAnnouncement = {
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
      .lean<RawAnnouncement[]>();
    return items.map((a) => ({
      _id: String(a._id),
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      cover: a.cover,
      category: a.category,
      pinned: a.pinned,
      publishedAt: a.publishedAt
        ? new Date(a.publishedAt).toISOString()
        : undefined,
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : undefined,
    }));
  } catch (err) {
    console.error("[announcements] fetch failed:", err);
    return [];
  }
}

export default async function AnnouncementsPage() {
  const items = await getAnnouncements();
  const pinned = items.filter((a) => a.pinned);
  const regular = items.filter((a) => !a.pinned);

  return (
    <>
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
              <span className="italic font-light gradient-text">
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

      <AnnouncementsList pinned={pinned} regular={regular} />
    </>
  );
}
