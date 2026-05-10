import Link from 'next/link';
import { dbConnect } from '@/lib/db';
import { Announcement } from '@/models';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;
export const metadata = { title: 'Announcements' };

async function getItems() {
  try { await dbConnect(); return await Announcement.find({ published: true }).sort({ pinned: -1, publishedAt: -1 }).lean(); }
  catch { return []; }
}

const TYPE_LABELS: Record<string, string> = {
  announcement: 'Announcement', launch: 'Launch', patronage: 'Patronage', milestone: 'Milestone',
};

export default async function AnnouncementsPage() {
  const items: any[] = await getItems();

  return (
    <>
      <section className="container-px pt-20 lg:pt-28 pb-20 max-w-5xl">
        <div className="flex items-center gap-3 mb-10">
          <span className="gold-rule" />
          <span className="eyebrow text-purple-700">— Public announcements</span>
        </div>
        <h1 className="h-display text-7xl lg:text-9xl leading-[0.92] mb-8">
          What's<br /><span className="italic font-light text-purple-700">new.</span>
        </h1>
        <p className="text-xl text-ink/70 max-w-2xl font-light leading-relaxed">
          Software releases, partnerships, milestones — quiet news from the studio, posted occasionally.
        </p>
      </section>

      {items.length === 0 ? (
        <section className="container-px py-20 border-t border-rule">
          <p className="text-ink/60 italic">No announcements yet — check back soon.</p>
        </section>
      ) : (
        <section className="container-px pb-32">
          <div className="divide-y divide-rule border-t border-rule">
            {items.map((a) => (
              <Link key={a._id} href={`/announcements/${a.slug}`} className="block py-8 lg:py-12 group">
                <div className="grid lg:grid-cols-12 gap-6 items-baseline">
                  <div className="lg:col-span-3 flex items-baseline gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-purple-700">{TYPE_LABELS[a.type] || a.type}</span>
                    {a.pinned && <span className="text-[10px] text-accent">★ pinned</span>}
                  </div>
                  <div className="lg:col-span-9">
                    <p className="text-xs text-ink/50 mb-1">{a.publishedAt && formatDate(a.publishedAt)}</p>
                    <h3 className="h-display text-3xl lg:text-4xl mb-2 group-hover:text-purple-700 transition-colors">{a.title}</h3>
                    {a.excerpt && <p className="text-ink/60 max-w-2xl">{a.excerpt}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
