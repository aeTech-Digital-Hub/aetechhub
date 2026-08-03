"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Trash2,
  ArrowLeft,
  Loader2,
  Check,
  Plus,
  X,
  GripVertical,
  ExternalLink,
} from "lucide-react";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────
export type Deliverable = {
  _id?: string;
  title: string;
  description?: string;
  priceUsd: number;
};

export type Milestone = {
  _id?: string;
  title?: string;
  description?: string;
  dueDate?: string;
};

export type ScopeData = {
  _id?: string;
  scopeRef?: string;
  briefId?:
    | {
        _id: string;
        briefId?: string;
        name?: string;
        email?: string;
      }
    | string
    | null;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientPhone?: string;
  projectTitle: string;
  projectDescription?: string;
  deliverables: Deliverable[];
  discountUsd?: number;
  depositPercent?: number;
  timelineDescription?: string;
  milestones?: Milestone[];
  assumptions?: string;
  exclusions?: string[];
  paymentTerms?: string;
  validUntil?: string;
  status?: string;
  notes?: string;
  publicToken?: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  convertedToProjectId?:
    | {
        _id: string;
        title?: string;
        slug?: string;
      }
    | string
    | null;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "#525252" },
  sent: { label: "Sent", color: "#2563EB" },
  viewed: { label: "Viewed", color: "#7C3AED" },
  accepted: { label: "Accepted", color: "#15803D" },
  rejected: { label: "Rejected", color: "#B91C1C" },
  expired: { label: "Expired", color: "#a3a3a3" },
};

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────
function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string | Date | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Convert an ISO date string to a value the <input type="date"> accepts
function toDateInput(d: string | Date | undefined): string {
  if (!d) return "";
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

// ────────────────────────────────────────────
// Editor
// ────────────────────────────────────────────
export function ScopeEditor({
  initial,
  mode,
}: {
  initial: ScopeData;
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const [data, setData] = useState<ScopeData>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [exclusionDraft, setExclusionDraft] = useState("");

  function set<K extends keyof ScopeData>(key: K, value: ScopeData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  // Live pricing calculations
  const pricing = useMemo(() => {
    const subtotal = (data.deliverables || []).reduce(
      (sum, d) => sum + (Number(d.priceUsd) || 0),
      0,
    );
    const discount = Number(data.discountUsd) || 0;
    const total = Math.max(0, subtotal - discount);
    const depositPct = Math.max(
      0,
      Math.min(100, Number(data.depositPercent) ?? 50),
    );
    const deposit = Math.round((total * depositPct) / 100);
    const balance = total - deposit;
    return { subtotal, discount, total, depositPct, deposit, balance };
  }, [data.deliverables, data.discountUsd, data.depositPercent]);

  async function save() {
    if (!data.clientName?.trim()) {
      setMsg("Client name is required.");
      return;
    }
    if (!data.clientEmail?.trim()) {
      setMsg("Client email is required.");
      return;
    }
    if (!data.projectTitle?.trim()) {
      setMsg("Project title is required.");
      return;
    }

    setBusy(true);
    setMsg("");

    try {
      const url =
        mode === "edit" ? `/api/admin/scopes/${data._id}` : "/api/admin/scopes";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!json.ok) {
        setMsg(json.error || "Save failed.");
        return;
      }

      setMsg("Saved ✓");
      if (mode === "new" && json.item?._id) {
        router.push(`/admin/scopes/${json.item._id}`);
      } else {
        setData((prev) => ({ ...prev, ...json.item }));
      }
    } catch (err: any) {
      setMsg(err?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (mode === "new" || !data._id) return;
    const ok = window.confirm(
      `Delete ${data.scopeRef}? This cannot be undone.`,
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/scopes/${data._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Delete failed.");
        return;
      }
      router.push("/admin/scopes");
    } catch (err: any) {
      setMsg(err?.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  // Deliverable operations
  function addDeliverable() {
    set("deliverables", [
      ...(data.deliverables || []),
      { title: "", description: "", priceUsd: 0 },
    ]);
  }

  function updateDeliverable(idx: number, patch: Partial<Deliverable>) {
    const next = [...(data.deliverables || [])];
    next[idx] = { ...next[idx], ...patch };
    set("deliverables", next);
  }

  function removeDeliverable(idx: number) {
    const next = [...(data.deliverables || [])];
    next.splice(idx, 1);
    set("deliverables", next);
  }

  function moveDeliverable(idx: number, dir: -1 | 1) {
    const next = [...(data.deliverables || [])];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set("deliverables", next);
  }

  // Milestone operations
  function addMilestone() {
    set("milestones", [
      ...(data.milestones || []),
      { title: "", description: "", dueDate: "" },
    ]);
  }

  function updateMilestone(idx: number, patch: Partial<Milestone>) {
    const next = [...(data.milestones || [])];
    next[idx] = { ...next[idx], ...patch };
    set("milestones", next);
  }

  function removeMilestone(idx: number) {
    const next = [...(data.milestones || [])];
    next.splice(idx, 1);
    set("milestones", next);
  }

  // Exclusion operations
  function addExclusion() {
    const v = exclusionDraft.trim();
    if (!v) return;
    if ((data.exclusions || []).includes(v)) {
      setExclusionDraft("");
      return;
    }
    set("exclusions", [...(data.exclusions || []), v]);
    setExclusionDraft("");
  }

  function removeExclusion(t: string) {
    set(
      "exclusions",
      (data.exclusions || []).filter((x) => x !== t),
    );
  }

  const brief =
    data.briefId && typeof data.briefId === "object" ? data.briefId : null;
  const converted =
    data.convertedToProjectId && typeof data.convertedToProjectId === "object"
      ? data.convertedToProjectId
      : null;

  const statusMeta = STATUS_META[data.status || "draft"] || STATUS_META.draft;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/scopes"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink transition-colors mr-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          All scopes
        </Link>

        {mode === "edit" && (
          <button
            onClick={remove}
            disabled={busy}
            className="btn-ghost !py-2 !text-xs text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            Delete
          </button>
        )}

        <button
          onClick={save}
          disabled={busy}
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
              Save
            </>
          )}
        </button>
      </div>

      {msg && (
        <div
          className="text-[12.5px] inline-flex items-center gap-1.5 px-3 py-2 rounded-md"
          style={{
            background: msg === "Saved ✓" ? "#DCFCE7" : "#FEE2E2",
            color: msg === "Saved ✓" ? "#15803D" : "#B91C1C",
          }}
        >
          {msg === "Saved ✓" && <Check className="w-3 h-3" strokeWidth={2.5} />}
          {msg}
        </div>
      )}

      {/* Header meta */}
      <div className="rounded-2xl border border-rule bg-white p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p
            className="text-[10.5px] font-mono uppercase tracking-wider mb-1"
            style={{ color: "var(--brand)" }}
          >
            {data.scopeRef || "New scope"}
          </p>
          <p className="text-[15px] font-medium">
            {data.projectTitle || (
              <span className="italic text-ink-3">Untitled scope</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded"
            style={{
              background: statusMeta.color,
              color: "white",
            }}
          >
            {statusMeta.label}
          </span>
          {data.sentAt && (
            <span className="text-[11px] font-mono text-ink-3">
              Sent {fmtDate(data.sentAt)}
            </span>
          )}
        </div>
      </div>

      {/* Brief / project links */}
      {(brief || converted) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {brief && (
            <Link
              href={`/admin/briefs/${brief._id}`}
              className="flex items-center justify-between rounded-lg border border-rule bg-tint-1 p-3 hover:border-ink-3 transition-colors group"
            >
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-1">
                  From brief
                </p>
                <p className="text-[13px] font-medium">
                  #{brief.briefId || "—"} · {brief.name || "—"}
                </p>
              </div>
              <ExternalLink
                className="w-3.5 h-3.5 text-ink-3 group-hover:text-brand transition-colors"
                strokeWidth={2}
              />
            </Link>
          )}
          {converted && (
            <Link
              href={`/admin/projects/${converted._id}`}
              className="flex items-center justify-between rounded-lg border border-rule bg-tint-1 p-3 hover:border-ink-3 transition-colors group"
            >
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-1">
                  Linked project
                </p>
                <p className="text-[13px] font-medium">
                  {converted.title || "Untitled"}
                </p>
              </div>
              <ExternalLink
                className="w-3.5 h-3.5 text-ink-3 group-hover:text-brand transition-colors"
                strokeWidth={2}
              />
            </Link>
          )}
        </div>
      )}

      {/* Client */}
      <FieldSection title="Client">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Name"
            value={data.clientName}
            onChange={(v) => set("clientName", v)}
            placeholder="Full name"
          />
          <Field
            label="Email"
            value={data.clientEmail}
            onChange={(v) => set("clientEmail", v)}
            placeholder="name@company.com"
          />
          <Field
            label="Company"
            value={data.clientCompany || ""}
            onChange={(v) => set("clientCompany", v)}
            placeholder="Optional"
          />
          <Field
            label="Phone"
            value={data.clientPhone || ""}
            onChange={(v) => set("clientPhone", v)}
            placeholder="Optional"
          />
        </div>
      </FieldSection>

      {/* Project overview */}
      <FieldSection title="Project overview">
        <Field
          label="Project title"
          value={data.projectTitle}
          onChange={(v) => set("projectTitle", v)}
          placeholder="What the client is buying"
        />
        <Field
          label="Executive summary"
          value={data.projectDescription || ""}
          onChange={(v) => set("projectDescription", v)}
          placeholder="Two or three sentences on what we're building and why."
          multiline
          rows={4}
        />
      </FieldSection>

      {/* Deliverables */}
      <FieldSection title="Deliverables">
        <p className="text-[12px] text-ink-3">
          Line items the client sees on the proposal. Each has a title, optional
          description, and a USD price.
        </p>

        <div className="space-y-3">
          {(data.deliverables || []).map((d, i) => (
            <div
              key={i}
              className="rounded-lg border border-rule bg-tint-1/40 p-4"
            >
              <div className="flex items-start gap-2 mb-3">
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    type="button"
                    onClick={() => moveDeliverable(i, -1)}
                    disabled={i === 0}
                    className="text-ink-3 hover:text-ink disabled:opacity-30 text-[10px] leading-none"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDeliverable(i, 1)}
                    disabled={i === (data.deliverables || []).length - 1}
                    className="text-ink-3 hover:text-ink disabled:opacity-30 text-[10px] leading-none"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>
                <span
                  className="text-[10px] font-mono tracking-wider pt-1"
                  style={{ color: "var(--brand)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 grid grid-cols-[1fr_140px] gap-3">
                  <input
                    type="text"
                    value={d.title}
                    onChange={(e) =>
                      updateDeliverable(i, { title: e.target.value })
                    }
                    placeholder="Deliverable title"
                    className="px-3 py-2 rounded-lg border border-rule bg-white text-[13.5px] font-medium focus:outline-none focus:border-ink-3"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-3 pointer-events-none">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={d.priceUsd || ""}
                      onChange={(e) =>
                        updateDeliverable(i, {
                          priceUsd: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      className="w-full pl-6 pr-3 py-2 rounded-lg border border-rule bg-white text-[13.5px] font-mono text-right focus:outline-none focus:border-ink-3"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDeliverable(i)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
              <textarea
                value={d.description || ""}
                onChange={(e) =>
                  updateDeliverable(i, { description: e.target.value })
                }
                placeholder="Optional description of what's included."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-rule bg-white text-[12.5px] focus:outline-none focus:border-ink-3 leading-relaxed resize-y"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addDeliverable}
          className="btn-ghost !py-2 !text-xs"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Add deliverable
        </button>
      </FieldSection>

      {/* Pricing summary — live-updated */}
      <FieldSection title="Pricing">
        <div className="rounded-lg border border-rule bg-tint-1/40 p-5">
          <dl className="space-y-2.5">
            <PriceRow label="Subtotal" value={fmtUsd(pricing.subtotal)} />

            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] font-mono uppercase tracking-wider text-ink-3">
                Discount
              </dt>
              <div className="relative w-32">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[13px] text-ink-3 pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={data.discountUsd || ""}
                  onChange={(e) =>
                    set("discountUsd", Number(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="w-full pl-5 pr-2 py-1 rounded border border-rule bg-white text-[13px] font-mono text-right focus:outline-none focus:border-ink-3"
                />
              </div>
            </div>

            <div className="border-t border-rule pt-2.5 mt-2.5">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[11px] font-mono uppercase tracking-wider text-ink-3">
                  Total
                </dt>
                <dd
                  className="h-display text-[24px] tracking-tighter leading-none"
                  style={{ color: "var(--brand)" }}
                >
                  {fmtUsd(pricing.total)}
                </dd>
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-4 pt-2">
              <dt className="text-[11px] font-mono uppercase tracking-wider text-ink-3">
                Deposit
              </dt>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={data.depositPercent ?? 50}
                  onChange={(e) =>
                    set("depositPercent", Number(e.target.value) || 0)
                  }
                  className="w-16 px-2 py-1 rounded border border-rule bg-white text-[13px] font-mono text-right focus:outline-none focus:border-ink-3"
                />
                <span className="text-[11px] font-mono text-ink-3">%</span>
                <span className="text-[13px] font-mono text-ink w-24 text-right">
                  {fmtUsd(pricing.deposit)}
                </span>
              </div>
            </div>

            <PriceRow label="Balance" value={fmtUsd(pricing.balance)} />
          </dl>
        </div>
      </FieldSection>

      {/* Timeline */}
      <FieldSection title="Timeline">
        <Field
          label="Timeline description"
          value={data.timelineDescription || ""}
          onChange={(v) => set("timelineDescription", v)}
          placeholder="e.g. 6 weeks from kickoff to production launch"
          multiline
          rows={3}
        />

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-mono uppercase tracking-wider text-ink-3">
              Milestones (optional)
            </p>
            <button
              type="button"
              onClick={addMilestone}
              className="btn-ghost !py-1.5 !text-[11px]"
            >
              <Plus className="w-3 h-3" strokeWidth={2} />
              Add
            </button>
          </div>

          {(data.milestones || []).length === 0 ? (
            <p className="text-[12px] text-ink-3 italic">
              No structured milestones. The prose description above is enough
              for most scopes.
            </p>
          ) : (
            <div className="space-y-2.5">
              {(data.milestones || []).map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-rule bg-tint-1/40 p-3 grid grid-cols-[1fr_140px_auto] gap-2 items-start"
                >
                  <input
                    type="text"
                    value={m.title || ""}
                    onChange={(e) =>
                      updateMilestone(i, { title: e.target.value })
                    }
                    placeholder="Milestone title"
                    className="px-3 py-2 rounded border border-rule bg-white text-[13px] focus:outline-none focus:border-ink-3"
                  />
                  <input
                    type="date"
                    value={toDateInput(m.dueDate)}
                    onChange={(e) =>
                      updateMilestone(i, { dueDate: e.target.value })
                    }
                    className="px-2 py-2 rounded border border-rule bg-white text-[12.5px] font-mono focus:outline-none focus:border-ink-3"
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </FieldSection>

      {/* Assumptions + exclusions */}
      <FieldSection title="Assumptions & exclusions">
        <Field
          label="Assumptions"
          value={data.assumptions || ""}
          onChange={(v) => set("assumptions", v)}
          placeholder="What we're assuming to be true — e.g. client will provide brand assets by Week 1, third-party APIs are accessible, etc."
          multiline
          rows={4}
        />

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 block mb-1.5">
            Exclusions — things NOT included
          </label>
          <div className="flex gap-2 flex-wrap mb-2">
            {(data.exclusions || []).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-tint-1 text-[12px] border border-rule"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeExclusion(t)}
                  className="text-ink-3 hover:text-ink"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              </span>
            ))}
            {(data.exclusions || []).length === 0 && (
              <span className="text-[12px] text-ink-3 italic">
                No exclusions yet
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={exclusionDraft}
              onChange={(e) => setExclusionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExclusion();
                }
              }}
              placeholder="e.g. Content copywriting, Third-party licenses"
              className="flex-1 px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3"
            />
            <button
              type="button"
              onClick={addExclusion}
              className="btn-ghost !py-2 !px-3"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </FieldSection>

      {/* Terms */}
      <FieldSection title="Terms & validity">
        <Field
          label="Payment terms"
          value={data.paymentTerms || ""}
          onChange={(v) => set("paymentTerms", v)}
          placeholder="Deposit + balance schedule. References Terms of Service."
          multiline
          rows={3}
        />

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 block mb-1.5">
            Valid until
          </label>
          <input
            type="date"
            value={toDateInput(data.validUntil)}
            onChange={(e) => set("validUntil", e.target.value)}
            className="px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] font-mono focus:outline-none focus:border-ink-3"
          />
          <p className="text-[10.5px] text-ink-3 mt-1">
            Proposal expires on this date. Leave blank for open-ended validity.
          </p>
        </div>
      </FieldSection>

      {/* Internal notes */}
      <FieldSection title="Internal notes">
        <Field
          label="Notes (client never sees these)"
          value={data.notes || ""}
          onChange={(v) => set("notes", v)}
          placeholder="Private notes for the team."
          multiline
          rows={4}
        />
      </FieldSection>
    </div>
  );
}

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function FieldSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-rule bg-white rounded-xl p-5 space-y-4">
      <p className="eyebrow">{title}</p>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const cls =
    "w-full px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3 transition-colors";
  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 block mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${cls} leading-relaxed resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[11px] font-mono uppercase tracking-wider text-ink-3">
        {label}
      </dt>
      <dd className="text-[13.5px] font-mono text-ink">{value}</dd>
    </div>
  );
}
