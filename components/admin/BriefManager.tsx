"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Trash2,
  ArrowLeft,
  Loader2,
  Check,
  Clock,
  UserCheck,
  Wand2,
  ExternalLink,
  FileText,
} from "lucide-react";

/**
 * Brief lifecycle statuses — from the Brief schema.
 * Ordered as a pipeline for the horizontal picker.
 */
const STATUS_FLOW = [
  { value: "submitted", label: "Submitted", color: "#B45309" },
  { value: "reviewing", label: "Reviewing", color: "#2563EB" },
  { value: "in-discussion", label: "In discussion", color: "#7C3AED" },
  { value: "quoted", label: "Quoted", color: "#0891B2" },
  { value: "won", label: "Won", color: "#15803D" },
  { value: "lost", label: "Lost", color: "#B91C1C" },
] as const;

const OTHER_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "abandoned", label: "Abandoned" },
  { value: "archived", label: "Archived" },
] as const;

export type BriefLean = {
  _id: string;
  briefId?: string;
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  projectType?: string;
  services?: string[];
  budget?: string;
  timeline?: string;
  summary?: string;
  suggestedPackage?: string;
  estimatedCost?: number;
  structured?: {
    aboutYou?: string;
    problem?: string;
    success?: string;
    tried?: string;
    constraints?: string;
    risks?: string;
    anythingElse?: string;
  };
  completionPercent?: number;
  source?: string;
  status?: string;
  notes?: string;
  submittedAt?: string;
  followedUpAt?: string;
  abandonedAt?: string;
  convertedTo?:
    | {
        _id: string;
        title?: string;
        slug?: string;
      }
    | string;
  createdAt?: string;
  updatedAt?: string;
};

export function BriefManager({ initial }: { initial: BriefLean }) {
  const router = useRouter();
  const [brief, setBrief] = useState<BriefLean>(initial);
  const [notes, setNotes] = useState(initial.notes || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const currentStatus = brief.status || "submitted";
  const convertedTo =
    brief.convertedTo && typeof brief.convertedTo === "object"
      ? brief.convertedTo
      : null;

  async function patchBrief(
    changes: Record<string, unknown>,
    actionLabel?: string,
  ) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/briefs/${brief._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Update failed.");
        return;
      }
      setBrief((prev) => ({ ...prev, ...json.item }));
      setMsg(actionLabel || "Saved ✓");
    } catch (err: any) {
      setMsg(err?.message || "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(newStatus: string) {
    if (newStatus === currentStatus) return;
    await patchBrief({ status: newStatus }, `Status → ${newStatus}`);
  }

  async function markFollowedUp() {
    await patchBrief(
      { followedUpAt: new Date().toISOString() },
      "Marked as followed up",
    );
  }

  async function saveNotes() {
    await patchBrief({ notes }, "Notes saved ✓");
  }

  async function convertToProject() {
    if (convertedTo) {
      setMsg("Already converted — see the project link above.");
      return;
    }
    const ok = window.confirm(
      "Create a new project draft from this brief? The project will start as a draft you can flesh out and publish later.",
    );
    if (!ok) return;

    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/briefs/${brief._id}/convert`, {
        method: "POST",
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Conversion failed.");
        return;
      }
      // Redirect straight to the new project editor
      router.push(`/admin/projects/${json.project._id}`);
    } catch (err: any) {
      setMsg(err?.message || "Conversion failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = window.confirm(
      `Delete this brief from ${brief.name || brief.email || "unknown"}? This cannot be undone.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/briefs/${brief._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Delete failed.");
        return;
      }
      router.push("/admin/briefs");
    } catch (err: any) {
      setMsg(err?.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  const isOtherStatus = OTHER_STATUSES.some((s) => s.value === currentStatus);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/briefs"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink transition-colors mr-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          All briefs
        </Link>

        <button
          onClick={markFollowedUp}
          disabled={busy}
          className="btn-ghost !py-2 !text-xs"
          title="Stamp followed-up date"
        >
          <UserCheck className="w-3.5 h-3.5" strokeWidth={2} />
          Mark followed up
        </button>

        <Link
          href={`/admin/scopes/new?briefId=${brief._id}`}
          className="btn-ghost !py-2 !text-xs"
          title="Create a client-facing scope proposal from this brief"
        >
          <FileText className="w-3.5 h-3.5" strokeWidth={2} />
          Create scope
        </Link>

        {!convertedTo && (
          <button
            onClick={convertToProject}
            disabled={busy}
            className="btn-primary !py-2 !text-xs"
            title="Create project draft from this brief"
            style={{ background: "var(--brand)" }}
          >
            <Wand2 className="w-3.5 h-3.5" strokeWidth={2} />
            Create project
          </button>
        )}

        <button
          onClick={remove}
          disabled={busy}
          className="btn-ghost !py-2 !text-xs text-red-600 hover:text-red-700"
          title="Delete brief"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          Delete
        </button>
      </div>

      {msg && (
        <div
          className="text-[12.5px] inline-flex items-center gap-1.5 px-3 py-2 rounded-md"
          style={{
            background: msg.includes("failed") ? "#FEE2E2" : "#DCFCE7",
            color: msg.includes("failed") ? "#B91C1C" : "#15803D",
          }}
        >
          {!msg.includes("failed") && (
            <Check className="w-3 h-3" strokeWidth={2.5} />
          )}
          {msg}
        </div>
      )}

      {/* Contact + brief meta card */}
      <section className="rounded-2xl border border-rule bg-white p-6 lg:p-7 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="h-display text-[24px] lg:text-[28px] tracking-tighter leading-tight">
              {brief.name || <span className="italic text-ink-3">No name</span>}
            </h1>
            {brief.company && (
              <p className="text-[14px] text-ink-2 mt-1">{brief.company}</p>
            )}
          </div>
          {brief.briefId && (
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3">
              #{brief.briefId}
            </span>
          )}
        </div>

        <dl className="grid sm:grid-cols-2 gap-4">
          <MetaField
            label="Email"
            value={
              brief.email ? (
                <a
                  href={`mailto:${brief.email}`}
                  className="link-brand break-all"
                >
                  {brief.email}
                </a>
              ) : (
                "—"
              )
            }
          />
          <MetaField
            label="Phone"
            value={
              brief.phone ? (
                <a href={`tel:${brief.phone}`} className="link-brand">
                  {brief.phone}
                </a>
              ) : (
                "—"
              )
            }
          />
          <MetaField
            label="Submitted"
            value={fmtDate(brief.submittedAt || brief.createdAt)}
          />
          <MetaField
            label="Followed up"
            value={brief.followedUpAt ? fmtDate(brief.followedUpAt) : "Not yet"}
          />
          {brief.source && <MetaField label="Source" value={brief.source} />}
          {typeof brief.completionPercent === "number" && (
            <MetaField
              label="Completion"
              value={`${brief.completionPercent}%`}
            />
          )}
        </dl>

        {/* Converted project link */}
        {convertedTo && (
          <Link
            href={`/admin/projects/${convertedTo._id}`}
            className="flex items-center justify-between rounded-lg border border-rule bg-tint-1 p-4 hover:border-ink-3 transition-colors group"
          >
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-1">
                Converted to project
              </p>
              <p className="text-[14px] font-medium">
                {convertedTo.title || "Untitled"}
              </p>
            </div>
            <ExternalLink
              className="w-4 h-4 text-ink-3 group-hover:text-brand transition-colors"
              strokeWidth={2}
            />
          </Link>
        )}
      </section>

      {/* Status control */}
      <section className="rounded-2xl border border-rule bg-white p-6 lg:p-7">
        <p className="eyebrow mb-4">Pipeline</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_FLOW.map((s) => (
            <button
              key={s.value}
              onClick={() => changeStatus(s.value)}
              disabled={busy}
              className="text-[12px] font-mono uppercase tracking-wider px-3 py-1.5 rounded transition-all"
              style={{
                background: s.value === currentStatus ? s.color : "var(--rule)",
                color: s.value === currentStatus ? "#fff" : "var(--ink-2)",
                opacity: s.value === currentStatus ? 1 : 0.85,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Non-pipeline statuses (draft, abandoned, archived) — smaller */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-rule">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3 pt-1.5">
            Or:
          </span>
          {OTHER_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => changeStatus(s.value)}
              disabled={busy}
              className={`text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded transition-colors ${
                s.value === currentStatus
                  ? "bg-ink text-white"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {isOtherStatus && (
          <p className="text-[11px] text-ink-3 mt-3 italic">
            Currently: <span className="font-mono">{currentStatus}</span>
          </p>
        )}
      </section>

      {/* Brief content */}
      <section className="rounded-2xl border border-rule bg-white p-6 lg:p-7 space-y-5">
        <p className="eyebrow">Quick form</p>
        <dl className="grid sm:grid-cols-2 gap-4">
          <MetaField label="Project type" value={brief.projectType || "—"} />
          <MetaField label="Budget" value={brief.budget || "—"} />
          <MetaField label="Timeline" value={brief.timeline || "—"} />
          {brief.suggestedPackage && (
            <MetaField
              label="Suggested package"
              value={brief.suggestedPackage}
            />
          )}
          {typeof brief.estimatedCost === "number" && (
            <MetaField
              label="Estimated cost"
              value={`$${brief.estimatedCost.toLocaleString()}`}
            />
          )}
          {brief.services && brief.services.length > 0 && (
            <MetaField
              label="Services"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {brief.services.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] px-2 py-0.5 rounded"
                      style={{
                        background: "var(--brand-100)",
                        color: "var(--brand)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              }
            />
          )}
        </dl>

        {brief.summary && (
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-2">
              Summary
            </p>
            <p className="text-[14.5px] text-ink leading-relaxed">
              {brief.summary}
            </p>
          </div>
        )}
      </section>

      {/* Structured brief sections */}
      {brief.structured && Object.keys(brief.structured).length > 0 && (
        <section className="rounded-2xl border border-rule bg-white p-6 lg:p-7 space-y-5">
          <p className="eyebrow">Structured brief</p>
          {(
            [
              ["aboutYou", "About you / your team"],
              ["problem", "The problem"],
              ["success", "What success looks like"],
              ["tried", "What you've tried"],
              ["constraints", "Constraints"],
              ["risks", "Risks"],
              ["anythingElse", "Anything else"],
            ] as [keyof NonNullable<BriefLean["structured"]>, string][]
          ).map(([key, label]) => {
            const value = brief.structured?.[key];
            if (!value?.trim()) return null;
            return (
              <div key={key}>
                <p className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-2">
                  {label}
                </p>
                <p className="text-[14.5px] text-ink leading-relaxed whitespace-pre-line">
                  {value}
                </p>
              </div>
            );
          })}
        </section>
      )}

      {/* Notes */}
      <section className="rounded-2xl border border-rule bg-white p-6 lg:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Internal notes</p>
          <button
            onClick={saveNotes}
            disabled={busy || notes === (brief.notes || "")}
            className="btn-primary !py-2 !text-xs"
          >
            {busy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" strokeWidth={2} />
                Save notes
              </>
            )}
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Private notes about this lead. Only visible to admins."
          rows={6}
          className="w-full px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3 leading-relaxed resize-y"
        />
        {brief.updatedAt && (
          <p className="text-[11px] font-mono text-ink-3 flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={2} />
            Last updated {fmtDate(brief.updatedAt)}
          </p>
        )}
      </section>
    </div>
  );
}

function MetaField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">
        {label}
      </dt>
      <dd className="text-[13.5px] text-ink">{value}</dd>
    </div>
  );
}

function fmtDate(d: string | Date | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
