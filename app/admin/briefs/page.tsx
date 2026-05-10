import Link from "next/link";
import { dbConnect } from "@/lib/db";
import { Brief, BriefVisit } from "@/models/Project";
import { ArrowUpRight, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getData() {
  await dbConnect();
  const since48h = new Date(Date.now() - 48 * 3600 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [submitted, drafts, abandoned, anonVisits, allCount] =
    await Promise.all([
      Brief.find({ status: "submitted", structured: { $exists: true } })
        .sort({ submittedAt: -1, createdAt: -1 })
        .limit(50)
        .lean(),
      Brief.find({ status: "draft", lastEditedAt: { $gte: since48h } })
        .sort({ lastEditedAt: -1 })
        .limit(50)
        .lean(),
      // "Abandoned" = draft, contact info present, last edit >48h ago
      Brief.find({ status: "draft", lastEditedAt: { $lt: since48h } })
        .sort({ lastEditedAt: -1 })
        .limit(50)
        .lean(),
      BriefVisit.countDocuments({ visitedAt: { $gte: since30d } }),
      Brief.countDocuments(),
    ]);

  return {
    submitted: JSON.parse(JSON.stringify(submitted)) as any[],
    drafts: JSON.parse(JSON.stringify(drafts)) as any[],
    abandoned: JSON.parse(JSON.stringify(abandoned)) as any[],
    anonVisits,
    allCount,
  };
}

export default async function AdminBriefsPage() {
  const { submitted, drafts, abandoned, anonVisits, allCount } =
    await getData();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="h-display text-[28px] tracking-tighter mb-2">Briefs</h1>
        <p className="text-[14px] text-ink-2">
          Structured briefs from prospective clients. Drafts older than 48 hours
          fall to &ldquo;Abandoned&rdquo; for follow-up.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="All-time briefs" value={allCount} />
        <Stat label="Submitted" value={submitted.length} accent />
        <Stat label="Active drafts" value={drafts.length} />
        <Stat label="Anon visits · 30d" value={anonVisits} />
      </div>

      <Section
        title="Submitted"
        items={submitted}
        emptyText="No submitted briefs yet."
        showCompletion
      />
      <Section
        title="Active drafts"
        items={drafts}
        emptyText="No drafts in progress right now."
        showCompletion
      />
      <Section
        title="Abandoned · for follow-up"
        items={abandoned}
        emptyText="Nothing abandoned. Healthy."
        showCompletion
        emphasiseFollowUp
      />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-rule bg-white p-4">
      <p className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">
        {label}
      </p>
      <p
        className="h-display text-[28px] tracking-tighter leading-none"
        style={{ color: accent ? "var(--brand)" : "var(--ink)" }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Section({
  title,
  items,
  emptyText,
  showCompletion,
  emphasiseFollowUp,
}: {
  title: string;
  items: any[];
  emptyText: string;
  showCompletion?: boolean;
  emphasiseFollowUp?: boolean;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="h-display text-[18px] tracking-tighter">{title}</h2>
        <span className="text-[11px] font-mono text-ink-3">
          {items.length} items
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-ink-3 italic py-8 text-center bg-tint-1 rounded-xl">
          {emptyText}
        </p>
      ) : (
        <div className="rounded-xl border border-rule bg-white overflow-hidden">
          <ul className="divide-y divide-rule">
            {items.map((b) => (
              <li key={b._id}>
                <Link
                  href={`/admin/briefs/${b._id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-tint-1 transition-colors group"
                >
                  <span
                    className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0"
                    style={{ background: "var(--brand-100)" }}
                  >
                    <FileText
                      className="w-4 h-4"
                      strokeWidth={2}
                      style={{ color: "var(--brand)" }}
                    />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2.5 mb-0.5">
                      <p className="text-[14px] font-medium truncate">
                        {b.name}
                      </p>
                      {b.briefId && (
                        <span className="text-[10.5px] font-mono text-ink-3">
                          {b.briefId}
                        </span>
                      )}
                      {emphasiseFollowUp && (
                        <span
                          className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(217, 119, 6, 0.10)",
                            color: "#B45309",
                          }}
                        >
                          Follow up
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] text-ink-2 truncate">
                      {b.email}
                      {b.company && ` · ${b.company}`}
                    </p>
                  </div>

                  {showCompletion && (
                    <div className="hidden sm:block flex-shrink-0 w-24">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[10px] font-mono text-ink-3">
                          {b.completionPercent || 0}%
                        </span>
                      </div>
                      <div className="h-0.5 bg-rule rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${b.completionPercent || 0}%`,
                            background: "var(--brand)",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <span className="text-[11px] font-mono text-ink-3 flex-shrink-0 hidden sm:inline">
                    {formatDate(b.lastEditedAt || b.submittedAt || b.createdAt)}
                  </span>

                  <ArrowUpRight
                    className="w-3.5 h-3.5 text-ink-3 group-hover:text-brand transition-colors flex-shrink-0"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
