import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileText, ArrowUpRight, Clock } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Scope } from "@/models/Project";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scopes",
  robots: { index: false, follow: false },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "#525252" },
  sent: { label: "Sent", color: "#2563EB" },
  viewed: { label: "Viewed", color: "#7C3AED" },
  accepted: { label: "Accepted", color: "#15803D" },
  rejected: { label: "Rejected", color: "#B91C1C" },
  expired: { label: "Expired", color: "#a3a3a3" },
};

type ScopeLean = {
  _id: string;
  scopeRef?: string;
  clientName?: string;
  clientCompany?: string;
  projectTitle?: string;
  status?: string;
  deliverables?: { priceUsd: number }[];
  discountUsd?: number;
  sentAt?: Date;
  acceptedAt?: Date;
  updatedAt?: Date;
  createdAt?: Date;
  validUntil?: Date;
};

async function getAll(): Promise<ScopeLean[]> {
  try {
    await dbConnect();
    const items = await Scope.find({})
      .sort({ sentAt: -1, updatedAt: -1, createdAt: -1 })
      .limit(500)
      .lean<ScopeLean[]>();
    return JSON.parse(JSON.stringify(items));
  } catch (err) {
    console.error("[admin/scopes] fetch failed:", err);
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

function computeTotal(item: ScopeLean): number {
  const subtotal = (item.deliverables || []).reduce(
    (s, d) => s + (Number(d.priceUsd) || 0),
    0,
  );
  return Math.max(0, subtotal - (item.discountUsd || 0));
}

export default async function AdminScopesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/sign-in?next=/admin/scopes");

  const items = await getAll();

  const drafts = items.filter((s) => s.status === "draft");
  const outstanding = items.filter(
    (s) => s.status === "sent" || s.status === "viewed",
  );
  const accepted = items.filter((s) => s.status === "accepted");
  const closed = items.filter(
    (s) => s.status === "rejected" || s.status === "expired",
  );

  const totalPipeline = outstanding.reduce((s, i) => s + computeTotal(i), 0);
  const totalAccepted = accepted.reduce((s, i) => s + computeTotal(i), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <h1 className="h-display text-[28px] tracking-tighter mb-2">
            Scopes
          </h1>
          <p className="text-[13.5px] text-ink-2 max-w-2xl leading-relaxed">
            Client proposals. Send from a submitted project request, or create
            standalone. Round 2 adds public shareable links + accept/reject +
            PDF export.
          </p>
        </div>
        <Link href="/admin/scopes/new" className="btn-primary !py-2 !text-xs">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          New scope
        </Link>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Drafts" value={drafts.length} />
        <Stat
          label="Outstanding"
          value={outstanding.length}
          accent={outstanding.length > 0}
        />
        <Stat
          label="Pipeline $"
          value={`$${totalPipeline.toLocaleString()}`}
          isCurrency
        />
        <Stat
          label="Accepted $"
          value={`$${totalAccepted.toLocaleString()}`}
          isCurrency
          highlight
        />
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 rounded-xl border border-rule bg-tint-1">
          <FileText
            className="w-6 h-6 mx-auto mb-3 text-ink-3"
            strokeWidth={1.75}
          />
          <p className="text-[13.5px] text-ink-3 italic mb-4">
            No scopes yet — create one manually or from a brief.
          </p>
          <Link
            href="/admin/scopes/new"
            className="btn-primary !py-2 !text-xs inline-flex"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Create scope
          </Link>
        </div>
      )}

      {drafts.length > 0 && (
        <Section
          title="Drafts"
          subtitle={`${drafts.length} unsent`}
          items={drafts}
        />
      )}

      {outstanding.length > 0 && (
        <Section
          title="Outstanding"
          subtitle={`${outstanding.length} awaiting client response`}
          items={outstanding}
          urgent
        />
      )}

      {accepted.length > 0 && (
        <Section
          title="Accepted"
          subtitle={`${accepted.length} won`}
          items={accepted}
        />
      )}

      {closed.length > 0 && (
        <Section
          title="Closed"
          subtitle={`${closed.length} rejected or expired`}
          items={closed}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  highlight,
  isCurrency,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  highlight?: boolean;
  isCurrency?: boolean;
}) {
  return (
    <div className="rounded-xl border border-rule bg-white p-4">
      <p className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">
        {label}
      </p>
      <p
        className={`h-display tracking-tighter leading-none ${
          isCurrency ? "text-[20px]" : "text-[26px]"
        }`}
        style={{
          color: highlight ? "#15803D" : accent ? "var(--brand)" : "var(--ink)",
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  items,
  urgent,
}: {
  title: string;
  subtitle: string;
  items: ScopeLean[];
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
          {items.map((item) => {
            const meta = STATUS_META[item.status || "draft"];
            const total = computeTotal(item);
            return (
              <li key={item._id}>
                <Link
                  href={`/admin/scopes/${item._id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-tint-1 transition-colors group"
                >
                  <span
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ background: meta.color }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[9.5px] font-mono uppercase tracking-wider"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "var(--brand)" }}
                      >
                        {item.scopeRef}
                      </span>
                    </div>
                    <p className="text-[14.5px] font-medium truncate group-hover:text-brand transition-colors">
                      {item.projectTitle || (
                        <span className="italic text-ink-3">Untitled</span>
                      )}
                    </p>
                    <p className="text-[12.5px] text-ink-2 truncate mt-0.5">
                      {item.clientName || "—"}
                      {item.clientCompany && ` · ${item.clientCompany}`}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p
                      className="h-display text-[18px] tracking-tighter leading-none"
                      style={{ color: "var(--brand)" }}
                    >
                      ${total.toLocaleString()}
                    </p>
                    <p className="text-[10.5px] font-mono text-ink-3 mt-1 flex items-center gap-1 justify-end">
                      <Clock className="w-2.5 h-2.5" strokeWidth={2} />
                      {fmtDate(item.sentAt || item.updatedAt || item.createdAt)}
                    </p>
                  </div>

                  <ArrowUpRight
                    className="w-3.5 h-3.5 text-ink-3 group-hover:text-brand transition-colors flex-shrink-0"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
