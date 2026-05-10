"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import {
  PROJECT_TYPES,
  BUDGET_RANGES,
  TIMELINES,
  SERVICES,
} from "@/lib/services";
import { SCOPE_QUESTIONS, recommend, type Recommendation } from "@/lib/scope";
import { track } from "@/components/marketing/Tracker";
import type { BriefSummaryData } from "./BriefSummary";

type FormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
  projectType: string;
  services: string[];
  budget: string;
  timeline: string;
  summary: string;
  scopeAnswers: Record<string, string>;
  recommendation?: Recommendation;
};

const initial: FormState = {
  name: "",
  email: "",
  company: "",
  phone: "",
  projectType: "",
  services: [],
  budget: "",
  timeline: "",
  summary: "",
  scopeAnswers: {},
};

export function StartProjectForm({
  onStateChange,
}: {
  onStateChange?: (s: BriefSummaryData) => void;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const preService = params.get("service");

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [scopeIdx, setScopeIdx] = useState(0);
  const [showScope, setShowScope] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [data, setData] = useState<FormState>({
    ...initial,
    services: preService ? [preService] : [],
    projectType: preService ?? "",
  });

  // Notify parent AFTER commit, never during render
  useEffect(() => {
    onStateChange?.(data);
  }, [data, onStateChange]);

  const update = (patch: Partial<FormState>) => {
    setData((p) => ({ ...p, ...patch }));
  };

  const toggleService = (slug: string) => {
    update({
      services: data.services.includes(slug)
        ? data.services.filter((s) => s !== slug)
        : [...data.services, slug],
    });
  };

  // ── AI scoping flow ──
  const scopeQ = SCOPE_QUESTIONS[scopeIdx];
  function answerScope(value: string) {
    const next = { ...data.scopeAnswers, [scopeQ.id]: value };
    update({ scopeAnswers: next });
    track("scope_answer", { id: scopeQ.id, value });
    if (scopeIdx < SCOPE_QUESTIONS.length - 1) {
      setScopeIdx(scopeIdx + 1);
    } else {
      const rec = recommend(next);
      update({
        recommendation: rec,
        services: [...new Set([rec.primary, ...rec.also])],
      });
      track("scope_complete", { recommendation: rec });
    }
  }

  // ── Submit ──
  async function submit() {
    setSubmitting(true);
    try {
      const transcript = SCOPE_QUESTIONS.filter(
        (q) => data.scopeAnswers[q.id],
      ).map((q) => ({
        q: q.question,
        a:
          q.options.find((o) => o.value === data.scopeAnswers[q.id])?.label ||
          "",
      }));
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          aiScopeTranscript: transcript,
          suggestedPackage: data.recommendation?.package,
          estimatedCost: data.recommendation?.estimateLow,
        }),
      });
      track("brief_submitted");
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────────────────────────────────────
  // SUCCESS state
  // ─────────────────────────────────────────
  if (done) {
    return (
      <div className="rounded-3xl border border-rule p-10 lg:p-14 text-center bg-white">
        <div
          className="w-12 h-12 rounded-full grid place-items-center mx-auto mb-6"
          style={{ background: "var(--brand-100)" }}
        >
          <CheckCircle2
            className="w-5 h-5"
            strokeWidth={2}
            style={{ color: "var(--brand)" }}
          />
        </div>
        <h2 className="h-display text-[28px] lg:text-[36px] tracking-tighter mb-4">
          Brief received.
        </h2>
        <p className="text-[15px] text-ink-2 max-w-md mx-auto mb-8 leading-relaxed">
          Thanks {data.name?.split(" ")[0] || "there"}. We&apos;ll review and
          come back within 48 hours.
        </p>
        <button onClick={() => router.push("/")} className="btn-primary">
          Back home
          <ArrowRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // FORM
  // ─────────────────────────────────────────
  return (
    <div className="space-y-10">
      {/* ── Step indicator ── */}
      <Stepper step={step} onJump={(s) => setStep(s as 1 | 2 | 3)} canJump />

      {/* ── Step body ── */}
      <div className="rounded-3xl border border-rule bg-white p-6 sm:p-8 lg:p-10">
        {/* STEP 1 — project type */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <p className="eyebrow mb-3">Step one</p>
              <h2 className="h-display text-[24px] sm:text-[28px] tracking-tighter mb-2">
                What kind of project?
              </h2>
              <p className="text-[14px] text-ink-2 leading-relaxed">
                Pick the closest match. If you&apos;re not sure, choose
                &ldquo;help me decide&rdquo; and we&apos;ll walk through it
                together.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => update({ projectType: t.id })}
                  className={`text-left p-4 rounded-xl border text-[14px] transition-all ${
                    data.projectType === t.id
                      ? "border-ink bg-ink text-white"
                      : "border-rule bg-white hover:border-ink-3 text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* AI scoping entry point — always available as an opt-in */}
            <button
              onClick={() => {
                update({ projectType: "unsure" });
                setShowScope(true);
                setStep(2);
                track("scope_started_unsure");
              }}
              className="w-full text-left rounded-xl border border-dashed p-4 transition-all hover:bg-tint-1 group"
              style={{
                borderColor: "var(--brand)",
                background: "var(--brand-50)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 grid place-items-center"
                  style={{ background: "var(--brand-100)" }}
                >
                  <Sparkles
                    className="w-4 h-4"
                    strokeWidth={2}
                    style={{ color: "var(--brand)" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14px] font-medium mb-0.5"
                    style={{ color: "var(--brand)" }}
                  >
                    Not sure? Let our scoping assistant guide you.
                  </p>
                  <p className="text-[12.5px] text-ink-2 leading-snug">
                    Four short questions. We&apos;ll recommend the right
                    package, services, and a price range.
                  </p>
                </div>
                <ArrowRight
                  className="w-4 h-4 mt-1 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                  style={{ color: "var(--brand)" }}
                />
              </div>
            </button>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[12px] text-ink-3">Step 1 of 3</span>
              <button
                onClick={() => {
                  if (data.projectType === "unsure") {
                    setShowScope(true);
                    setStep(2);
                    track("scope_started_unsure");
                  } else setStep(2);
                }}
                disabled={!data.projectType}
                className="btn-primary lift disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — scope (with optional AI assistant) */}
        {step === 2 && (
          <div className="space-y-10">
            <div>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-6 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
                Back
              </button>
              <p className="eyebrow mb-3">Step two</p>
              <h2 className="h-display text-[24px] sm:text-[28px] tracking-tighter mb-2">
                Scope it out.
              </h2>
              <p className="text-[14px] text-ink-2 leading-relaxed">
                The more we know, the more accurate our scope.
              </p>
            </div>

            {/* AI scoping block */}
            {(showScope || data.projectType === "unsure") &&
              !data.recommendation && (
                <div
                  className="rounded-2xl p-6 lg:p-7 border border-rule"
                  style={{ background: "var(--bg-tint-1)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles
                      className="w-4 h-4"
                      strokeWidth={2}
                      style={{ color: "var(--brand)" }}
                    />
                    <span className="eyebrow">Scoping assistant</span>
                  </div>
                  <p className="text-[11px] font-mono text-ink-3 mb-3">
                    Question {scopeIdx + 1} of {SCOPE_QUESTIONS.length}
                  </p>
                  <h3 className="h-display text-[20px] tracking-tight mb-5">
                    {scopeQ.question}
                  </h3>
                  <div className="space-y-2">
                    {scopeQ.options.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => answerScope(o.value)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-[14px] transition-all ${
                          data.scopeAnswers[scopeQ.id] === o.value
                            ? "border-ink bg-ink text-white"
                            : "border-rule bg-white hover:border-ink-3 text-ink"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Recommendation acknowledged */}
            {data.recommendation && (
              <div
                className="rounded-2xl p-6 lg:p-7 border border-rule"
                style={{ background: "var(--bg-tint-2)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles
                    className="w-4 h-4"
                    strokeWidth={2}
                    style={{ color: "var(--brand)" }}
                  />
                  <span className="eyebrow">We recommend</span>
                </div>
                <h3 className="h-display text-[24px] tracking-tight mb-3 capitalize">
                  {data.recommendation.package} package
                </h3>
                <p className="text-[14px] text-ink-2 leading-relaxed mb-5">
                  {data.recommendation.reasoning}
                </p>
                <button
                  onClick={() => {
                    update({ recommendation: undefined, scopeAnswers: {} });
                    setScopeIdx(0);
                  }}
                  className="text-[12px] text-ink-2 hover:text-ink underline decoration-rule underline-offset-4 transition-colors"
                >
                  Re-do scoping
                </button>
              </div>
            )}

            {/* Services */}
            <Field label="Services" hint="Pick all that apply. Editable.">
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => toggleService(s.slug)}
                    className={`px-3.5 py-1.5 rounded-full text-[12.5px] border transition-all ${
                      data.services.includes(s.slug)
                        ? "border-ink bg-ink text-white"
                        : "border-rule bg-white hover:border-ink-3 text-ink-2"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </Field>

            {/* Budget */}
            <Field
              label="Investment range"
              hint="A rough order of magnitude is fine."
            >
              <div className="grid sm:grid-cols-2 gap-2">
                {BUDGET_RANGES.map((b) => (
                  <button
                    key={b}
                    onClick={() => update({ budget: b })}
                    className={`text-left px-4 py-3 rounded-lg border text-[13.5px] transition-all ${
                      data.budget === b
                        ? "border-ink bg-ink text-white"
                        : "border-rule bg-white hover:border-ink-3 text-ink"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </Field>

            {/* Timeline */}
            <Field label="Timeline">
              <div className="grid sm:grid-cols-2 gap-2">
                {TIMELINES.map((t) => (
                  <button
                    key={t}
                    onClick={() => update({ timeline: t })}
                    className={`text-left px-4 py-3 rounded-lg border text-[13.5px] transition-all ${
                      data.timeline === t
                        ? "border-ink bg-ink text-white"
                        : "border-rule bg-white hover:border-ink-3 text-ink"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            {/* Summary */}
            <Field
              label="Brief"
              hint="A few sentences. What are you building, and why now?"
            >
              <textarea
                value={data.summary}
                onChange={(e) => update({ summary: e.target.value })}
                rows={5}
                placeholder="We're a B2B fintech in Accra, looking to replace our admin tool with a proper internal SaaS…"
                className="w-full px-4 py-3 rounded-lg border border-rule bg-white text-[14px] focus:outline-none focus:border-ink-3 transition-colors resize-y leading-relaxed"
              />
            </Field>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[12px] text-ink-3">Step 2 of 3</span>
              <button
                onClick={() => setStep(3)}
                disabled={!data.summary || data.services.length === 0}
                className="btn-primary lift disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — contact */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-6 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
                Back
              </button>
              <p className="eyebrow mb-3">Step three</p>
              <h2 className="h-display text-[24px] sm:text-[28px] tracking-tighter mb-2">
                Where can we reach you?
              </h2>
              <p className="text-[14px] text-ink-2 leading-relaxed">
                We&apos;ll only use these to reply about your project.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Input
                label="Your name *"
                value={data.name}
                onChange={(v) => update({ name: v })}
              />
              <Input
                label="Email *"
                value={data.email}
                onChange={(v) => update({ email: v })}
                type="email"
              />
              <Input
                label="Company"
                value={data.company}
                onChange={(v) => update({ company: v })}
              />
              <Input
                label="Phone"
                value={data.phone}
                onChange={(v) => update({ phone: v })}
                type="tel"
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <span className="text-[12px] text-ink-3">Step 3 of 3</span>
              <button
                onClick={submit}
                disabled={submitting || !data.name || !data.email}
                className="btn-primary lift disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending…" : "Send brief"}
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function Stepper({
  step,
  onJump,
  canJump,
}: {
  step: 1 | 2 | 3 | 4;
  onJump: (s: number) => void;
  canJump?: boolean;
}) {
  const steps = [
    { n: 1, label: "Project" },
    { n: 2, label: "Scope" },
    { n: 3, label: "Contact" },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      {steps.map((s, i) => {
        const active = step === s.n;
        const past = step > s.n;
        const clickable = canJump && past;
        return (
          <div key={s.n} className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => clickable && onJump(s.n)}
              disabled={!clickable}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] tracking-wide transition-colors ${
                active
                  ? "bg-ink text-white"
                  : past
                    ? "bg-white border border-rule text-ink hover:border-ink-3 cursor-pointer"
                    : "bg-white border border-rule text-ink-3"
              }`}
            >
              <span className="font-mono text-[10.5px]">
                {past ? "✓" : `0${s.n}`}
              </span>
              <span>{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <span
                className={`h-px w-6 sm:w-10 ${past ? "bg-ink" : "bg-rule"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-2">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        {hint && <span className="text-[12px] text-ink-3 ml-2">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-medium text-ink-2 mb-1.5 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-rule bg-white text-[14px] focus:outline-none focus:border-ink-3 transition-colors"
      />
    </div>
  );
}
