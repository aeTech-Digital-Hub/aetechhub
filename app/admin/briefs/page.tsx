import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Inbox,
  Clock,
  ArrowUpRight,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Brief, BriefVisit } from "@/models/Project";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Briefs",
  robots: { index: false, follow: false },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  submitted: { label: "Submitted", color: "#B45309" },
  reviewing: { label: "Reviewing", color: "#2563EB" },
  "in-discussion": { label: "In discussion", color: "#7C3AED" },
  quoted: { label: "Quoted", color: "#0891B2" },
  won: { label: "Won", color: "#15803D" },
  lost: { label: "Lost", color: "#B91C1C" },
  draft: { label: "Draft", color: "#525252" },
  abandoned: { label: "Abandoned", color: "#a3a3a3" },
  archived: { label: "Archived", color: "#525252" },
};

const PIPELINE_STATUSES = [
  "submitted",
  "reviewing",
  "in-discussion",
  "quoted",
  "won",
  "lost",
] as const;

type BriefLean = {
  _id: string;
  briefId?: string;
  name?: string;
  email?: string;
  company?: string;
  projectType?: string;
  budget?: string;
  summary?: string;
  status?: string;
  completionPercent?: number;
  submittedAt?: Date;
  followedUpAt?: Date;
  lastEditedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Fetches briefs grouped by workflow section.
 *
 * IMPORTANT: this uses `createdAt` as a fallback for older briefs that
 * were created before we started stamping lastEditedAt/submittedAt.
 * Prevents "invisible briefs" from being filtered out of the list.
 */
async function getData() {
  try {
    await dbConnect();
    const since48h = new Date(Date.now() - 48 * 3600 * 1000);
    const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [
      needsReview,
      activePipeline,
      activeDrafts,
      abandoned,
      won,
      lost,
      archived,
      orphaned,
      allCount,
      anonVisits,
      statusCounts,
    ] = await Promise.all([
      // Submitted briefs waiting for admin action
      Brief.find({ status: "submitted" })
        .sort({ submittedAt: -1, createdAt: -1 })
        .limit(50)
        .lean<BriefLean[]>(),

      // Mid-pipeline
      Brief.find({
        status: { $in: ["reviewing", "in-discussion", "quoted"] },
      })
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean<BriefLean[]>(),

      // Active drafts — recent OR (recently created but no lastEditedAt)
      Brief.find({
        $or: [
          { status: "draft", lastEditedAt: { $gte: since48h } },
          {
            status: "draft",
            lastEditedAt: { $exists: false },
            createdAt: { $gte: since48h },
          },
        ],
      })
        .sort({ lastEditedAt: -1, createdAt: -1 })
        .limit(50)
        .lean<BriefLean[]>(),

      // Abandoned — explicit OR stale draft (with email) OR stale draft w/o lastEditedAt
      Brief.find({
        $or: [
          { status: "abandoned" },
          {
            status: "draft",
            lastEditedAt: { $lt: since48h },
            email: { $exists: true, $ne: "" },
          },
          {
            status: "draft",
            lastEditedAt: { $exists: false },
            createdAt: { $lt: since48h },
            email: { $exists: true, $ne: "" },
          },
        ],
      })
        .sort({ lastEditedAt: -1, createdAt: -1 })
        .limit(50)
        .lean<BriefLean[]>(),

      Brief.find({ status: "won" })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean<BriefLean[]>(),
      Brief.find({ status: "lost" })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean<BriefLean[]>(),
      Brief.find({ status: "archived" })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean<BriefLean[]>(),

      // Orphaned — status not in any known bucket. Safety net.
      Brief.find({
        status: {
          $nin: [
            "submitted",
            "reviewing",
            "in-discussion",
            "quoted",
            "won",
            "lost",
            "draft",
            "abandoned",
            "archived",
          ],
        },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean<BriefLean[]>(),

      Brief.countDocuments(),
      BriefVisit.countDocuments({
        visitedAt: { $gte: since30d },
      }).catch(() => 0),

      Brief.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]).catch(() => []),
    ]);

    const counts: Record<string, number> = {};
    for (const row of statusCounts as { _id: string; count: number }[]) {
      if (row._id) counts[row._id] = row.count;
    }

    return {
      needsReview: JSON.parse(JSON.stringify(needsReview)) as BriefLean[],
      activePipeline: JSON.parse(JSON.stringify(activePipeline)) as BriefLean[],
      activeDrafts: JSON.parse(JSON.stringify(activeDrafts)) as BriefLean[],
      abandoned: JSON.parse(JSON.stringify(abandoned)) as BriefLean[],
      won: JSON.parse(JSON.stringify(won)) as BriefLean[],
      lost: JSON.parse(JSON.stringify(lost)) as BriefLean[],
      archived: JSON.parse(JSON.stringify(archived)) as BriefLean[],
      orphaned: JSON.parse(JSON.stringify(orphaned)) as BriefLean[],
      allCount,
      anonVisits,
      counts,
    };
  } catch (err) {
    console.error("[admin/briefs] fetch failed:", err);
    return {
      needsReview: [] as BriefLean[],
      activePipeline: [] as BriefLean[],
      activeDrafts: [] as BriefLean[],
      abandoned: [] as BriefLean[],
      won: [] as BriefLean[],
      lost: [] as BriefLean[],
      archived: [] as BriefLean[],
      orphaned: [] as BriefLean[],
      allCount: 0,
      anonVisits: 0,
      counts: {} as Record<string, number>,
    };
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

function daysSince(d: Date | string | undefined): number | null {
  if (!d) return null;
  return Math.floor(
    (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export default async function AdminBriefsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/sign-in?next=/admin/briefs");

  const data = await getData();
  const totalActive =
    data.needsReview.length +
    data.activePipeline.length +
    data.activeDrafts.length +
    data.abandoned.length;

  const displayedTotal =
    data.needsReview.length +
    data.activePipeline.length +
    data.activeDrafts.length +
    data.abandoned.length +
    data.won.length +
    data.lost.length +
    data.archived.length +
    data.orphaned.length;
  const hidden = Math.max(0, data.allCount - displayedTotal);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h-display text-[28px] tracking-tighter mb-2">Briefs</h1>
        <p className="text-[13.5px] text-ink-2 max-w-2xl leading-relaxed">
          Inbound leads and their pipeline state. Sections at the top need your
          action; sections below track deals in motion, closed, or archived.
        </p>
      </div>

      {/* Diagnostic warning — only shows if some briefs are unaccounted for */}
      {hidden > 0 && (
        <div
          className="rounded-lg border px-4 py-3 flex items-start gap-3"
          style={{ background: "#FEF3C7", borderColor: "#FDE68A" }}
        >
          <AlertTriangle
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            strokeWidth={2}
            style={{ color: "#92400E" }}
          />
          <div className="text-[12.5px]" style={{ color: "#92400E" }}>
            <p className="font-medium">
              {hidden} brief{hidden === 1 ? "" : "s"} not shown in any section
            </p>
            <p className="mt-0.5">
              These briefs have a status not matched by any bucket, or fields
              missing. Check MongoDB Compass or run the backfill query.
            </p>
          </div>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="All-time" value={data.allCount} />
        <Stat
          label="Needs review"
          value={data.needsReview.length}
          accent={data.needsReview.length > 0}
        />
        <Stat label="Active drafts" value={data.activeDrafts.length} />
        <Stat
          label="Abandoned"
          value={data.abandoned.length}
          warn={data.abandoned.length > 0}
        />
        <Stat label="Anon visits · 30d" value={data.anonVisits} />
      </div>

      {/* Pipeline pill grid */}
      <div className="rounded-2xl border border-rule bg-white p-5">
        <div className="flex items-baseline justify-between mb-4">
          <p className="eyebrow">Pipeline</p>
          <p className="text-[11px] font-mono text-ink-3">
            {totalActive} active
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PIPELINE_STATUSES.map((status) => {
            const meta = STATUS_META[status];
            const n = data.counts[status] || 0;
            return (
              <div
                key={status}
                className="rounded-lg border border-rule p-3"
                style={{
                  background: n > 0 ? "var(--brand-50)" : "transparent",
                }}
              >
                <p
                  className="text-[9.5px] font-mono uppercase tracking-wider mb-1.5"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </p>
                <p className="h-display text-[22px] tracking-tighter leading-none">
                  {n}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {data.allCount === 0 && (
        <div className="text-center py-16 rounded-xl border border-rule bg-tint-1">
          <Inbox
            className="w-6 h-6 mx-auto mb-3 text-ink-3"
            strokeWidth={1.75}
          />
          <p className="text-[13.5px] text-ink-3 italic">
            No briefs yet — leads will appear here as they come in.
          </p>
        </div>
      )}

      {data.needsReview.length > 0 && (
        <Section
          title="Needs review"
          subtitle={`${data.needsReview.length} submitted ${data.needsReview.length === 1 ? "brief" : "briefs"} awaiting your first response`}
          items={data.needsReview}
          showCompletion
          urgent
        />
      )}

      {data.activePipeline.length > 0 && (
        <Section
          title="Active pipeline"
          subtitle={`${data.activePipeline.length} ${data.activePipeline.length === 1 ? "brief" : "briefs"} being worked`}
          items={data.activePipeline}
          showCompletion
        />
      )}

      {data.activeDrafts.length > 0 && (
        <Section
          title="Active drafts"
          subtitle={`${data.activeDrafts.length} in progress right now`}
          items={data.activeDrafts}
          showCompletion
          useLastEditedAt
        />
      )}

      {data.abandoned.length > 0 && (
        <Section
          title="Abandoned · follow-up worthwhile"
          subtitle={`${data.abandoned.length} ${data.abandoned.length === 1 ? "brief" : "briefs"} — visitor started but stopped`}
          items={data.abandoned}
          showCompletion
          useLastEditedAt
          showFollowUpFlag
        />
      )}

      {data.won.length > 0 && (
        <Section
          title="Won"
          subtitle={`${data.won.length} converted ${data.won.length === 1 ? "brief" : "briefs"}`}
          items={data.won}
        />
      )}

      {data.lost.length > 0 && (
        <Section
          title="Lost"
          subtitle={`${data.lost.length} closed ${data.lost.length === 1 ? "brief" : "briefs"}`}
          items={data.lost}
        />
      )}

      {data.archived.length > 0 && (
        <Section
          title="Archived"
          subtitle={`${data.archived.length} archived ${data.archived.length === 1 ? "brief" : "briefs"}`}
          items={data.archived}
        />
      )}

      {data.orphaned.length > 0 && (
        <Section
          title="Unknown status"
          subtitle={`${data.orphaned.length} ${data.orphaned.length === 1 ? "brief" : "briefs"} with unrecognized status \u2014 investigate manually`}
          items={data.orphaned}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-rule bg-white p-4">
      <p className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">
        {label}
      </p>
      <p
        className="h-display text-[26px] tracking-tighter leading-none"
        style={{
          color: accent ? "var(--brand)" : warn ? "#B45309" : "var(--ink)",
        }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  items,
  showCompletion,
  useLastEditedAt,
  showFollowUpFlag,
  urgent,
}: {
  title: string;
  subtitle: string;
  items: BriefLean[];
  showCompletion?: boolean;
  useLastEditedAt?: boolean;
  showFollowUpFlag?: boolean;
  urgent?: boolean;
}) {
  return (
    <section>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="h-display text-[18px] tracking-tighter">{title}</h2>
          {urgent && (
            <span
              className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: "var(--brand)", color: "white" }}
            >
              Priority
            </span>
          )}
        </div>
        <p className="text-[11.5px] font-mono text-ink-3 mt-0.5">{subtitle}</p>
      </div>

      <div className="rounded-xl border border-rule bg-white overflow-hidden">
        <ul className="divide-y divide-rule">
          {items.map((item) => (
            <BriefRow
              key={item._id}
              item={item}
              showCompletion={showCompletion}
              useLastEditedAt={useLastEditedAt}
              showFollowUpFlag={showFollowUpFlag}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function BriefRow({
  item,
  showCompletion,
  useLastEditedAt,
  showFollowUpFlag,
}: {
  item: BriefLean;
  showCompletion?: boolean;
  useLastEditedAt?: boolean;
  showFollowUpFlag?: boolean;
}) {
  const status = item.status || "submitted";
  const meta = STATUS_META[status] || STATUS_META.submitted;
  const dateField = useLastEditedAt
    ? item.lastEditedAt || item.updatedAt || item.createdAt
    : item.submittedAt || item.createdAt;
  const days = daysSince(dateField);
  const stale = days !== null && days > 3;

  return (
    <li>
      <Link
        href={`/admin/briefs/${item._id}`}
        className="flex items-center gap-4 px-5 py-4 hover:bg-tint-1 transition-colors group"
      >
        <span
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ background: meta.color }}
        />
        <span
          className="w-8 h-8 rounded-full grid place-items-center flex-shrink-0"
          style={{ background: "var(--brand-100)" }}
        >
          <FileText
            className="w-3.5 h-3.5"
            strokeWidth={2}
            style={{ color: "var(--brand)" }}
          />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span
              className="text-[9.5px] font-mono uppercase tracking-wider"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
            {item.briefId && (
              <span className="text-[10px] font-mono text-ink-3">
                #{item.briefId}
              </span>
            )}
            {showFollowUpFlag && !item.followedUpAt && (
              <span
                className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: "#FEF3C7", color: "#92400E" }}
              >
                Follow up
              </span>
            )}
            {stale && !showFollowUpFlag && (
              <span
                className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: "#FEF3C7", color: "#92400E" }}
                title={`${days} days without action`}
              >
                Stale
              </span>
            )}
          </div>

          <p className="text-[14px] font-medium truncate group-hover:text-brand transition-colors">
            {item.name || <span className="italic text-ink-3">No name</span>}
            {item.company && (
              <span className="text-ink-2 font-normal ml-2 text-[13px]">
                · {item.company}
              </span>
            )}
          </p>
          {item.summary ? (
            <p className="text-[12.5px] text-ink-2 truncate mt-0.5">
              {item.summary}
            </p>
          ) : item.email ? (
            <p className="text-[12px] text-ink-3 truncate mt-0.5">
              {item.email}
              {item.projectType && ` · ${item.projectType}`}
            </p>
          ) : null}
        </div>

        {showCompletion && (
          <div className="hidden md:block flex-shrink-0 w-24">
            <div className="flex items-baseline justify-end mb-1">
              <span className="text-[10px] font-mono text-ink-3">
                {item.completionPercent || 0}%
              </span>
            </div>
            <div className="h-0.5 bg-rule rounded-full overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${item.completionPercent || 0}%`,
                  background: "var(--brand)",
                }}
              />
            </div>
          </div>
        )}

        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="text-[11px] font-mono text-ink-3 flex items-center gap-1 justify-end">
            <Clock className="w-2.5 h-2.5" strokeWidth={2} />
            {fmtDate(dateField)}
          </p>
        </div>

        <ArrowUpRight
          className="w-3.5 h-3.5 text-ink-3 group-hover:text-brand transition-colors flex-shrink-0"
          strokeWidth={2}
        />
      </Link>
    </li>
  );
}
