import Link from "next/link";
import { dbConnect } from "@/lib/db";
import { Brief, Scope } from "@/models/Project";
import { Invoice } from "@/models/Invoice";
import { Booking, Track, Message } from "@/models";
import {
  ArrowUpRight,
  FileText,
  Receipt,
  MessageSquare,
  CalendarClock,
  Send,
  Plus,
  Newspaper,
  BookOpen,
  Briefcase,
  Eye,
  Users,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ────────────────────────────────────────────
// Status meta — mirrors /admin/briefs for visual consistency
// ────────────────────────────────────────────
const BRIEF_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; text: string }
> = {
  submitted: {
    label: "Submitted",
    color: "#B45309",
    bg: "#FEF3C7",
    text: "#92400E",
  },
  reviewing: {
    label: "Reviewing",
    color: "#2563EB",
    bg: "#DBEAFE",
    text: "#1E40AF",
  },
  "in-discussion": {
    label: "In discussion",
    color: "#7C3AED",
    bg: "#EDE9FE",
    text: "#5B21B6",
  },
  quoted: {
    label: "Quoted",
    color: "#0891B2",
    bg: "#CFFAFE",
    text: "#164E63",
  },
  won: { label: "Won", color: "#15803D", bg: "#DCFCE7", text: "#14532D" },
  lost: { label: "Lost", color: "#B91C1C", bg: "#FEE2E2", text: "#7F1D1D" },
  draft: {
    label: "Draft",
    color: "#525252",
    bg: "var(--rule)",
    text: "var(--ink-2)",
  },
  abandoned: {
    label: "Abandoned",
    color: "#a3a3a3",
    bg: "var(--rule)",
    text: "var(--ink-3)",
  },
  archived: {
    label: "Archived",
    color: "#525252",
    bg: "var(--rule)",
    text: "var(--ink-3)",
  },
};

const INVOICE_STATUS_META: Record<string, { bg: string; text: string }> = {
  draft: { bg: "var(--rule)", text: "var(--ink-2)" },
  sent: { bg: "#DBEAFE", text: "#1E40AF" },
  viewed: { bg: "#EDE9FE", text: "#5B21B6" },
  paid: { bg: "#DCFCE7", text: "#14532D" },
  partial: { bg: "#FEF3C7", text: "#92400E" },
  overdue: { bg: "#FEE2E2", text: "#7F1D1D" },
  void: { bg: "var(--rule)", text: "var(--ink-3)" },
};

const SCOPE_STATUS_META: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  draft: { label: "Draft", bg: "var(--rule)", text: "var(--ink-2)" },
  sent: { label: "Sent", bg: "#DBEAFE", text: "#1E40AF" },
  viewed: { label: "Viewed", bg: "#EDE9FE", text: "#5B21B6" },
  accepted: { label: "Accepted", bg: "#DCFCE7", text: "#14532D" },
  rejected: { label: "Rejected", bg: "#FEE2E2", text: "#7F1D1D" },
  expired: { label: "Expired", bg: "var(--rule)", text: "var(--ink-3)" },
};

const PIPELINE_STATUSES = [
  "submitted",
  "reviewing",
  "in-discussion",
  "quoted",
  "won",
  "lost",
] as const;

// ────────────────────────────────────────────
// Defensive query wrappers — if a model is missing or a query fails,
// the dashboard still renders (just with 0s instead of a full 500)
// ────────────────────────────────────────────
async function safeCount(fn: () => Promise<number>): Promise<number> {
  try {
    return await fn();
  } catch (err) {
    console.error("[dashboard.count]", err);
    return 0;
  }
}

async function safeAggregate<T = any>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    console.error("[dashboard.aggregate]", err);
    return [];
  }
}

async function safeFind<T = any>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    console.error("[dashboard.find]", err);
    return [];
  }
}

// ────────────────────────────────────────────
// Data
// ────────────────────────────────────────────
async function getStats() {
  await dbConnect();
  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [
    briefsTotal,
    briefsNeedsReview,
    briefsRecent,
    briefStatusCounts,
    invoicesTotal,
    invoicesPaid,
    invoicesOutstanding,
    invoicesRecent,
    scopesRecent,
    scopeOutstanding,
    scopeAccepted,
    bookingsUpcoming,
    messagesUnread,
    pageViews30,
  ] = await Promise.all([
    safeCount(() => Brief.countDocuments()),
    // "Needs review" = the submitted-and-waiting bucket, NOT status 'new'
    safeCount(() => Brief.countDocuments({ status: "submitted" })),
    safeFind(() =>
      Brief.find().sort({ submittedAt: -1, createdAt: -1 }).limit(5).lean(),
    ),
    safeAggregate<{ _id: string; count: number }>(() =>
      Brief.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ),
    safeCount(() => Invoice.countDocuments()),
    safeAggregate<{ _id: null; sum: number }>(() =>
      Invoice.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, sum: { $sum: "$total" } } },
      ]),
    ),
    safeAggregate<{ _id: null; sum: number }>(() =>
      Invoice.aggregate([
        {
          $match: {
            status: { $in: ["sent", "viewed", "overdue", "partial"] },
          },
        },
        { $group: { _id: null, sum: { $sum: "$total" } } },
      ]),
    ),
    safeFind(() => Invoice.find().sort({ createdAt: -1 }).limit(5).lean()),
    safeFind(() =>
      Scope.find()
        .sort({ sentAt: -1, updatedAt: -1, createdAt: -1 })
        .limit(5)
        .lean(),
    ),
    safeAggregate<{ _id: null; sum: number }>(() =>
      Scope.aggregate([
        {
          $match: {
            status: { $in: ["sent", "viewed"] },
          },
        },
        {
          $group: {
            _id: null,
            sum: {
              $sum: {
                $subtract: [
                  {
                    $reduce: {
                      input: { $ifNull: ["$deliverables", []] },
                      initialValue: 0,
                      in: {
                        $add: ["$$value", { $ifNull: ["$$this.priceUsd", 0] }],
                      },
                    },
                  },
                  { $ifNull: ["$discountUsd", 0] },
                ],
              },
            },
          },
        },
      ]),
    ),
    safeCount(() => Scope.countDocuments({ status: "accepted" })),
    safeCount(() =>
      Booking.countDocuments({
        date: { $gte: new Date() },
        status: { $in: ["requested", "confirmed"] },
      }),
    ),
    safeCount(() => Message.countDocuments({ sender: "client", read: false })),
    safeCount(() =>
      Track.countDocuments({
        event: "page_view",
        createdAt: { $gte: since30d },
      }),
    ),
  ]);

  const briefCounts: Record<string, number> = {};
  for (const row of briefStatusCounts) {
    if (row._id) briefCounts[row._id] = row.count;
  }

  return {
    briefsTotal,
    briefsNeedsReview,
    briefsRecent,
    briefCounts,
    invoicesTotal,
    paidTotal: invoicesPaid[0]?.sum || 0,
    outstandingTotal: invoicesOutstanding[0]?.sum || 0,
    invoicesRecent,
    scopesRecent,
    scopeOutstandingTotal: scopeOutstanding[0]?.sum || 0,
    scopeAccepted,
    bookingsUpcoming,
    messagesUnread,
    pageViews30,
  };
}

// ────────────────────────────────────────────
// PAGE
// ────────────────────────────────────────────
export default async function AdminDashboard() {
  const s = await getStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="eyebrow mb-3" style={{ color: "var(--brand)" }}>
          Overview
        </p>
        <h1 className="h-display text-[36px] lg:text-[44px] tracking-tighter leading-tight">
          Hub dashboard.
        </h1>
      </div>

      {/* KPI strip — money + attention */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Needs review"
          value={s.briefsNeedsReview}
          sub={`${s.briefsTotal} total briefs`}
          href="/admin/briefs"
          icon={FileText}
          accent={s.briefsNeedsReview > 0}
        />
        <Kpi
          label="Paid revenue"
          value={formatCurrency(s.paidTotal)}
          sub={`${s.invoicesTotal} invoices`}
          href="/admin/invoices"
          icon={Receipt}
          mono
        />
        <Kpi
          label="Outstanding"
          value={formatCurrency(s.outstandingTotal)}
          sub="awaiting payment"
          href="/admin/invoices?status=sent"
          icon={Send}
          mono
          warn={s.outstandingTotal > 0}
        />
        <Kpi
          label="Scope pipeline"
          value={`$${(s.scopeOutstandingTotal || 0).toLocaleString()}`}
          sub={`${s.scopeAccepted} accepted`}
          href="/admin/scopes"
          icon={Briefcase}
          mono
        />
      </div>

      {/* KPI strip — activity */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi
          label="Upcoming calls"
          value={s.bookingsUpcoming}
          href="/admin/bookings"
          icon={CalendarClock}
        />
        <Kpi
          label="Unread messages"
          value={s.messagesUnread}
          href="/admin/chat"
          icon={MessageSquare}
          accent={s.messagesUnread > 0}
        />
        <Kpi
          label="Page views · 30d"
          value={s.pageViews30.toLocaleString()}
          href="/admin/funnel"
          icon={Eye}
        />
      </div>

      {/* Brief pipeline strip — matches /admin/briefs */}
      <div className="rounded-2xl border border-rule bg-white p-5">
        <div className="flex items-baseline justify-between mb-4">
          <p className="eyebrow">Brief pipeline</p>
          <Link
            href="/admin/briefs"
            className="text-[11px] font-mono text-ink-3 hover:text-ink transition-colors inline-flex items-center gap-1"
          >
            View all
            <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PIPELINE_STATUSES.map((status) => {
            const meta = BRIEF_STATUS_META[status];
            const n = s.briefCounts[status] || 0;
            return (
              <Link
                key={status}
                href={`/admin/briefs`}
                className="rounded-lg border border-rule p-3 hover:border-ink-3 transition-colors"
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
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent activity — three columns */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Recent briefs — FIXED ROUTING */}
        <Card title="Recent briefs" href="/admin/briefs" icon={FileText}>
          {s.briefsRecent.length === 0 ? (
            <EmptyRow text="No briefs yet." />
          ) : (
            <div className="divide-y divide-rule">
              {s.briefsRecent.map((b: any) => {
                const meta =
                  BRIEF_STATUS_META[b.status || "submitted"] ||
                  BRIEF_STATUS_META.submitted;
                return (
                  <Link
                    key={b._id}
                    href={`/admin/briefs/${b._id}`}
                    className="flex items-center gap-3 py-3 group"
                  >
                    <span
                      className="w-0.5 self-stretch rounded-full flex-shrink-0"
                      style={{ background: meta.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p
                          className="text-[9.5px] font-mono uppercase tracking-wider"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </p>
                        {b.briefId && (
                          <span className="text-[10px] font-mono text-ink-3">
                            #{b.briefId}
                          </span>
                        )}
                      </div>
                      <p className="text-[13.5px] font-medium truncate group-hover:text-brand transition-colors">
                        {b.name || (
                          <span className="italic text-ink-3">No name</span>
                        )}
                      </p>
                      <p className="text-[11.5px] text-ink-3 truncate">
                        {b.email}
                        {b.projectType && ` · ${b.projectType}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent scopes */}
        <Card title="Recent scopes" href="/admin/scopes" icon={Briefcase}>
          {s.scopesRecent.length === 0 ? (
            <EmptyRow text="No scopes yet." />
          ) : (
            <div className="divide-y divide-rule">
              {s.scopesRecent.map((sc: any) => {
                const meta =
                  SCOPE_STATUS_META[sc.status || "draft"] ||
                  SCOPE_STATUS_META.draft;
                const subtotal = (sc.deliverables || []).reduce(
                  (sum: number, d: any) => sum + (Number(d.priceUsd) || 0),
                  0,
                );
                const total = Math.max(0, subtotal - (sc.discountUsd || 0));
                return (
                  <Link
                    key={sc._id}
                    href={`/admin/scopes/${sc._id}`}
                    className="flex items-center gap-3 py-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: meta.bg,
                            color: meta.text,
                          }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "var(--brand)" }}
                        >
                          {sc.scopeRef}
                        </span>
                      </div>
                      <p className="text-[13.5px] font-medium truncate group-hover:text-brand transition-colors">
                        {sc.projectTitle || (
                          <span className="italic text-ink-3">Untitled</span>
                        )}
                      </p>
                      <p className="text-[11.5px] text-ink-3 truncate">
                        {sc.clientName || "—"}
                      </p>
                    </div>
                    <p
                      className="text-[13px] font-mono flex-shrink-0"
                      style={{ color: "var(--brand)" }}
                    >
                      ${total.toLocaleString()}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent invoices */}
        <Card
          title="Recent invoices"
          href="/admin/invoices"
          icon={Receipt}
          className="lg:col-span-2 xl:col-span-1"
        >
          {s.invoicesRecent.length === 0 ? (
            <EmptyRow text="No invoices yet." />
          ) : (
            <div className="divide-y divide-rule">
              {s.invoicesRecent.map((inv: any) => {
                const meta =
                  INVOICE_STATUS_META[inv.status] || INVOICE_STATUS_META.draft;
                return (
                  <Link
                    key={inv._id}
                    href={`/admin/invoices/${inv._id}`}
                    className="flex items-center gap-3 py-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: meta.bg,
                            color: meta.text,
                          }}
                        >
                          {inv.status}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "var(--brand)" }}
                        >
                          {inv.invoiceNo}
                        </span>
                      </div>
                      <p className="text-[13.5px] font-medium truncate group-hover:text-brand transition-colors">
                        {inv.client?.name || (
                          <span className="italic text-ink-3">No client</span>
                        )}
                      </p>
                      <p className="text-[11.5px] text-ink-3">
                        {formatDate(inv.createdAt)}
                      </p>
                    </div>
                    <p className="text-[13px] font-mono flex-shrink-0">
                      {formatCurrency(inv.total || 0, inv.currency)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-rule bg-white p-5">
        <p className="eyebrow mb-4">Quick actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <QuickAction
            href="/admin/scopes/new"
            icon={Briefcase}
            label="New scope"
          />
          <QuickAction
            href="/admin/invoices/new"
            icon={Receipt}
            label="New invoice"
          />
          <QuickAction
            href="/admin/projects/new"
            icon={Users}
            label="New project"
          />
          <QuickAction
            href="/admin/announcements/new"
            icon={Newspaper}
            label="New announcement"
          />
          <QuickAction
            href="/admin/research/new"
            icon={BookOpen}
            label="New research"
          />
          <QuickAction
            href="/admin/briefs"
            icon={FileText}
            label="View briefs"
          />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function Kpi({
  label,
  value,
  sub,
  href,
  icon: Icon,
  mono,
  accent,
  warn,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href: string;
  icon?: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    style?: React.CSSProperties;
  }>;
  mono?: boolean;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-rule bg-white p-5 hover:border-ink-3 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3">
          {label}
        </p>
        {Icon && (
          <Icon
            className="w-3.5 h-3.5 text-ink-3 group-hover:text-brand transition-colors"
            strokeWidth={1.75}
          />
        )}
      </div>
      <p
        className={`h-display tracking-tighter leading-none ${
          mono ? "text-[22px]" : "text-[28px]"
        }`}
        style={{
          color: accent ? "var(--brand)" : warn ? "#B45309" : "var(--ink)",
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-[11.5px] text-ink-3 mt-2">{sub}</p>}
    </Link>
  );
}

function Card({
  title,
  children,
  href,
  icon: Icon,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  icon?: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    style?: React.CSSProperties;
  }>;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-rule bg-white p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              className="w-3.5 h-3.5"
              strokeWidth={2}
              style={{ color: "var(--brand)" }}
            />
          )}
          <h3 className="h-display text-[16px] tracking-tighter">{title}</h3>
        </div>
        {href && (
          <Link
            href={href}
            className="text-[11px] font-mono text-ink-3 hover:text-ink transition-colors inline-flex items-center gap-1"
          >
            View all
            <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="text-[12.5px] text-ink-3 italic py-6 text-center">{text}</p>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    style?: React.CSSProperties;
  }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-lg border border-rule p-3 hover:border-ink-3 hover:bg-tint-1 transition-colors group text-center"
    >
      <Icon
        className="w-4 h-4"
        strokeWidth={1.75}
        style={{ color: "var(--brand)" }}
      />
      <span className="text-[11.5px] font-medium text-ink-2 group-hover:text-ink transition-colors">
        {label}
      </span>
    </Link>
  );
}
