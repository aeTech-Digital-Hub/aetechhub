"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Eye,
  Save,
  Send,
  Sparkles,
  AlertCircle,
  Lightbulb,
  Loader2,
} from "lucide-react";
import {
  BRIEF_SECTIONS,
  EMPTY_BRIEF,
  completionPercent,
  tipsFor,
  type BriefSectionId,
  type StructuredBrief,
  type Tip,
} from "@/lib/brief";
import { BriefPreview } from "./BriefPreview";

type SaveState = "idle" | "saving" | "saved" | "error";

export function BriefEditor({
  briefId,
  fingerprint,
  initial,
  contactName,
}: {
  briefId: string;
  fingerprint: string;
  initial?: StructuredBrief;
  contactName: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<StructuredBrief>(initial || EMPTY_BRIEF);
  const [activeId, setActiveId] = useState<BriefSectionId>("aboutYou");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Track whether a section has been visited (we only show tips after the user has written something)
  const [touched, setTouched] = useState<Record<BriefSectionId, boolean>>(
    Object.fromEntries(BRIEF_SECTIONS.map((s) => [s.id, false])) as Record<
      BriefSectionId,
      boolean
    >,
  );

  const completion = completionPercent(values);
  const activeSection = BRIEF_SECTIONS.find((s) => s.id === activeId)!;
  const activeTips = touched[activeId]
    ? tipsFor(activeId, values[activeId], values)
    : [];

  // ── Save on blur ──────────────────────────
  // We persist the whole `values` object on each blur. Cheap network-wise (small JSON),
  // and it keeps the server-side state perfectly in sync without a debounce on every keystroke.
  async function persist(nextValues: StructuredBrief) {
    setSaveState("saving");
    try {
      const res = await fetch("/api/briefs/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefId,
          fingerprint,
          structured: nextValues,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "save-failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  }

  function handleChange(id: BriefSectionId, val: string) {
    setValues((p) => ({ ...p, [id]: val }));
    if (!touched[id]) setTouched((p) => ({ ...p, [id]: true }));
  }

  function handleBlur(id: BriefSectionId) {
    persist({ ...values, [id]: values[id] });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Save once more, then submit
      await persist(values);
      const res = await fetch("/api/briefs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId, fingerprint }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "submit-failed");
      router.push(`/brief/done?id=${briefId}`);
    } catch (err: any) {
      setSubmitError(err?.message || "Could not submit. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[260px_1fr_300px] gap-6 lg:gap-8 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────
          LEFT — sections nav
          ───────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-24 lg:self-start order-2 lg:order-1">
        <div className="rounded-2xl border border-rule bg-white p-4 lg:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="eyebrow">Brief</p>
            <span className="text-[11px] font-mono text-ink-3">{briefId}</span>
          </div>

          {/* Completion bar */}
          <div className="mb-5">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-3">
                Complete
              </span>
              <span
                className="text-[14px] font-medium"
                style={{ color: "var(--brand)" }}
              >
                {completion}%
              </span>
            </div>
            <div className="h-1 bg-rule rounded-full overflow-hidden">
              <div
                className="h-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${completion}%`, background: "var(--brand)" }}
              />
            </div>
          </div>

          {/* Section list */}
          <nav className="space-y-1">
            {BRIEF_SECTIONS.map((s) => {
              const isActive = activeId === s.id;
              const wc = values[s.id].trim()
                ? values[s.id].trim().split(/\s+/).length
                : 0;
              const filled = s.minWords === 0 ? wc > 0 : wc >= s.minWords;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px]
                    transition-colors
                    ${
                      isActive
                        ? "bg-ink text-white"
                        : "hover:bg-tint-1 text-ink"
                    }
                  `}
                >
                  <span
                    className={`font-mono text-[10.5px] tracking-wider w-5 ${
                      isActive ? "text-white/60" : "text-ink-3"
                    }`}
                  >
                    {s.number}
                  </span>
                  <span className="flex-1 truncate">{s.title}</span>
                  {filled && (
                    <Check
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isActive ? "text-white" : ""
                      }`}
                      strokeWidth={2.5}
                      style={{ color: isActive ? "#fff" : "var(--brand)" }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Save indicator */}
          <div className="mt-5 pt-5 border-t border-rule">
            <SaveBadge state={saveState} />
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────
          MIDDLE — active section editor
          ───────────────────────────────────────── */}
      <main className="order-1 lg:order-2 min-w-0">
        <div className="rounded-2xl border border-rule bg-white p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-2.5 mb-3">
            <span
              className="font-mono text-[12px] tracking-wider"
              style={{ color: "var(--brand)" }}
            >
              {activeSection.number}
            </span>
            <span className="text-[12px] text-ink-3">·</span>
            <span className="text-[12px] text-ink-2">
              Section {BRIEF_SECTIONS.findIndex((s) => s.id === activeId) + 1}{" "}
              of {BRIEF_SECTIONS.length}
            </span>
          </div>

          <h2 className="h-display text-[26px] lg:text-[32px] tracking-tighter leading-tight mb-2">
            {activeSection.title}
          </h2>
          <p className="text-[15px] lg:text-[16px] text-ink-2 font-light leading-relaxed mb-6">
            {activeSection.question}
          </p>
          <p className="text-[14px] text-ink-2 leading-relaxed mb-6">
            {activeSection.description}
          </p>

          <textarea
            value={values[activeId]}
            onChange={(e) => handleChange(activeId, e.target.value)}
            onBlur={() => handleBlur(activeId)}
            placeholder={activeSection.placeholder}
            rows={10}
            className="w-full px-4 py-3 rounded-lg border border-rule bg-base text-[15px] focus:outline-none focus:border-ink-3 focus:bg-white transition-colors resize-y leading-relaxed placeholder:text-ink-3"
          />

          {/* Word count + nav */}
          <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
            <span className="text-[12px] font-mono text-ink-3">
              {wordCount(values[activeId])} words
              {activeSection.minWords > 0 &&
                ` · suggested ${activeSection.minWords}+`}
            </span>
            <div className="flex items-center gap-2">
              <SectionNavButton
                disabled={
                  BRIEF_SECTIONS.findIndex((s) => s.id === activeId) === 0
                }
                onClick={() => {
                  const i = BRIEF_SECTIONS.findIndex((s) => s.id === activeId);
                  if (i > 0) {
                    handleBlur(activeId);
                    setActiveId(BRIEF_SECTIONS[i - 1].id);
                  }
                }}
              >
                Previous
              </SectionNavButton>
              <SectionNavButton
                disabled={
                  BRIEF_SECTIONS.findIndex((s) => s.id === activeId) ===
                  BRIEF_SECTIONS.length - 1
                }
                primary
                onClick={() => {
                  const i = BRIEF_SECTIONS.findIndex((s) => s.id === activeId);
                  if (i < BRIEF_SECTIONS.length - 1) {
                    handleBlur(activeId);
                    setActiveId(BRIEF_SECTIONS[i + 1].id);
                  }
                }}
              >
                Next
              </SectionNavButton>
            </div>
          </div>
        </div>

        {/* Submit + preview row */}
        <div className="rounded-2xl border border-rule bg-white p-6 lg:p-7 mt-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[14px] font-medium mb-0.5">Ready to submit?</p>
            <p className="text-[12.5px] text-ink-2">
              {completion < 50
                ? `${completion}% — fill in a bit more first.`
                : `${completion}% — looks good. We'll reply within 48 hours.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="btn-ghost lift"
              data-track="brief_preview"
            >
              <Eye className="w-4 h-4" strokeWidth={2} />
              Preview
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || completion < 30}
              className="btn-primary lift disabled:opacity-30 disabled:cursor-not-allowed"
              data-track="brief_submit"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" strokeWidth={2} />
                  Submit brief
                </>
              )}
            </button>
          </div>
          {submitError && (
            <p className="text-[12.5px] text-red-700 bg-red-50 rounded-md px-3 py-1.5 w-full">
              {submitError}
            </p>
          )}
        </div>
      </main>

      {/* ─────────────────────────────────────────
          RIGHT — tips + good-answer sidebar
          ───────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-24 lg:self-start order-3">
        <div
          className="rounded-2xl border border-rule p-5 lg:p-6"
          style={{ background: "#F8F2FB" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles
              className="w-3.5 h-3.5"
              strokeWidth={2}
              style={{ color: "var(--brand)" }}
            />
            <p className="eyebrow">Suggestions</p>
          </div>

          {activeTips.length > 0 ? (
            <ul className="space-y-3 mb-6">
              {activeTips.map((t, i) => (
                <TipRow key={i} tip={t} />
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-ink-2 italic mb-6 leading-relaxed">
              {touched[activeId]
                ? "Looks good. Move on when you're ready."
                : "Start typing — we'll give you contextual feedback as you go."}
            </p>
          )}

          <div className="pt-5 border-t border-rule/60">
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-3">
              A good answer mentions
            </p>
            <ul className="space-y-2">
              {activeSection.good.map((g) => (
                <li
                  key={g}
                  className="flex items-start gap-2 text-[12.5px] text-ink-2 leading-relaxed"
                >
                  <span
                    className="font-mono mt-0.5 flex-shrink-0"
                    style={{ color: "var(--brand)" }}
                  >
                    ·
                  </span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────
          PREVIEW MODAL
          ───────────────────────────────────────── */}
      {showPreview && (
        <BriefPreview
          values={values}
          briefId={briefId}
          contactName={contactName}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function wordCount(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <div className="flex items-center gap-2 text-[12px] text-ink-2">
        <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
        Saving…
      </div>
    );
  }
  if (state === "saved") {
    return (
      <div
        className="flex items-center gap-2 text-[12px]"
        style={{ color: "var(--brand)" }}
      >
        <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
        Saved
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="flex items-center gap-2 text-[12px] text-red-600">
        <AlertCircle className="w-3 h-3" strokeWidth={2} />
        Save failed — typing again will retry.
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-3">
      <Save className="w-3 h-3" strokeWidth={2} />
      Auto-saves on blur
    </div>
  );
}

function TipRow({ tip }: { tip: Tip }) {
  const palette: Record<Tip["kind"], { bg: string; ic: string }> = {
    nudge: { bg: "rgba(45, 13, 80, 0.06)", ic: "var(--brand)" },
    gap: { bg: "rgba(217, 119, 6, 0.10)", ic: "#B45309" },
    polish: { bg: "rgba(45, 13, 80, 0.06)", ic: "var(--brand-600)" },
  };
  return (
    <li
      className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-[12.5px] leading-relaxed text-ink"
      style={{ background: palette[tip.kind].bg }}
    >
      <Lightbulb
        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
        strokeWidth={2}
        style={{ color: palette[tip.kind].ic }}
      />
      {tip.message}
    </li>
  );
}

function SectionNavButton({
  children,
  disabled,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3.5 py-1.5 rounded-full text-[12.5px] border transition-colors
        ${
          primary
            ? "bg-ink text-white border-ink hover:bg-ink/90"
            : "bg-white text-ink-2 border-rule hover:border-ink-3"
        }
        disabled:opacity-30 disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  );
}
