import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Eye, EyeOff, Calendar, Edit } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Research } from "@/models";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Research",
  robots: { index: false, follow: false },
};

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
  excerpt?: string;
  category?: string;
  author?: string;
  readTime?: number;
  published?: boolean;
  publishedAt?: Date;
  updatedAt?: Date;
  createdAt?: Date;
};

async function getAll(): Promise<ArticleLean[]> {
  try {
    await dbConnect();
    const items = await Research.find({})
      .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
      .limit(500)
      .lean<ArticleLean[]>();
    return JSON.parse(JSON.stringify(items));
  } catch (err) {
    console.error("[admin/research] fetch failed:", err);
    return [];
  }
}

function fmtDate(d: Date | string | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminResearchPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/sign-in?next=/admin/research");

  const items = await getAll();
  const drafts = items.filter((a) => !a.published);
  const published = items.filter((a) => a.published);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="h-display text-[28px] tracking-tighter mb-2">
            Research
          </h1>
          <p className="text-[13.5px] text-ink-2 max-w-2xl leading-relaxed">
            Studio writing. Drafts stay private; publishing makes an article
            visible on <span className="font-mono text-[12px]">/research</span>.
          </p>
        </div>
        <Link href="/admin/research/new" className="btn-primary !py-2 !text-xs">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} /> New article
        </Link>
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 rounded-xl border border-rule bg-tint-1">
          <p className="text-[13.5px] text-ink-3 italic mb-4">
            No articles yet.
          </p>
          <Link
            href="/admin/research/new"
            className="btn-primary !py-2 !text-xs inline-flex"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Write your first
          </Link>
        </div>
      )}

      {drafts.length > 0 && (
        <Section
          title="Drafts"
          subtitle={`${drafts.length} unpublished ${drafts.length === 1 ? "item" : "items"}`}
          items={drafts}
        />
      )}

      {published.length > 0 && (
        <Section
          title="Published"
          subtitle={`${published.length} live ${published.length === 1 ? "item" : "items"}`}
          items={published}
        />
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: ArticleLean[];
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="h-display text-[18px] tracking-tighter">{title}</h2>
          <p className="text-[11.5px] font-mono text-ink-3 mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-rule bg-white overflow-hidden">
        <ul className="divide-y divide-rule">
          {items.map((item) => (
            <li key={item._id}>
              <Link
                href={`/admin/research/${item._id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-tint-1 transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded-full grid place-items-center flex-shrink-0"
                  style={{
                    background: item.published ? "#DCFCE7" : "var(--rule)",
                  }}
                >
                  {item.published ? (
                    <Eye
                      className="w-3.5 h-3.5"
                      strokeWidth={2}
                      style={{ color: "#15803D" }}
                    />
                  ) : (
                    <EyeOff
                      className="w-3.5 h-3.5 text-ink-3"
                      strokeWidth={2}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.category && (
                      <span
                        className="text-[9.5px] font-mono uppercase tracking-wider"
                        style={{ color: "var(--brand)" }}
                      >
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                    )}
                    {item.author && (
                      <>
                        <span className="text-[9.5px] font-mono text-ink-3">
                          ·
                        </span>
                        <span className="text-[10.5px] text-ink-2 truncate">
                          {item.author}
                        </span>
                      </>
                    )}
                    {item.readTime ? (
                      <>
                        <span className="text-[9.5px] font-mono text-ink-3">
                          ·
                        </span>
                        <span className="text-[10.5px] text-ink-3 font-mono">
                          {item.readTime} min
                        </span>
                      </>
                    ) : null}
                  </div>
                  <p className="text-[14.5px] font-medium truncate group-hover:text-brand transition-colors">
                    {item.title || (
                      <span className="italic text-ink-3">Untitled</span>
                    )}
                  </p>
                  {item.excerpt && (
                    <p className="text-[12.5px] text-ink-2 truncate mt-0.5">
                      {item.excerpt}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-[11px] font-mono text-ink-3 flex items-center gap-1 justify-end">
                    <Calendar className="w-2.5 h-2.5" strokeWidth={2} />
                    {fmtDate(
                      item.published
                        ? item.publishedAt || item.updatedAt
                        : item.updatedAt || item.createdAt,
                    )}
                  </p>
                </div>

                <Edit
                  className="w-3.5 h-3.5 text-ink-3 group-hover:text-brand transition-colors flex-shrink-0"
                  strokeWidth={2}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
