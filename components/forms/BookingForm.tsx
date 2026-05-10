"use client";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { track } from "@/components/marketing/Tracker";

const SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

export type BookingState = {
  date: Date | null;
  slot: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
};

export function BookingForm({
  onStateChange,
}: {
  onStateChange?: (s: BookingState) => void;
}) {
  // Build the next 12 weekdays (skip Sat + Sun)
  const dates = useMemo(() => {
    const out: Date[] = [];
    let d = startOfDay(new Date());
    let added = 0;
    while (added < 12) {
      d = addDays(d, 1);
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        out.push(d);
        added++;
      }
    }
    return out;
  }, []);

  const [state, setState] = useState<BookingState>({
    date: null,
    slot: "",
    name: "",
    email: "",
    phone: "",
    topic: "",
  });

  // Notify parent AFTER commit, never during render
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  const update = (patch: Partial<BookingState>) => {
    setState((p) => ({ ...p, ...patch }));
  };

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.date || !state.slot || !state.name || !state.email) return;
    setSubmitting(true);
    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          phone: state.phone,
          topic: state.topic,
          date: state.date,
          timeSlot: state.slot,
        }),
      });
      track("booking_submitted", {
        date: state.date.toISOString(),
        slot: state.slot,
      });
      setDone(true);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────────────────────────────────────
  // SUCCESS
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
          You&apos;re booked.
        </h2>
        <p className="text-[15px] text-ink-2 max-w-md mx-auto mb-2 leading-relaxed">
          A confirmation has been sent to{" "}
          <span className="text-ink font-medium">{state.email}</span>.
        </p>
        <p className="text-[15px] text-ink-2 max-w-md mx-auto mb-8 leading-relaxed">
          {state.date && format(state.date, "EEEE, MMM d")} at{" "}
          <span className="text-ink font-medium">{state.slot} GMT</span>
        </p>
        <Link href="/" className="btn-primary">
          Back home
          <ArrowRight className="w-4 h-4" strokeWidth={2} />
        </Link>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // FORM
  // ─────────────────────────────────────────
  return (
    <div className="space-y-10">
      <Stepper step={step} onJump={(s) => setStep(s as 1 | 2 | 3)} />

      <form
        onSubmit={submit}
        className="rounded-3xl border border-rule bg-white p-6 sm:p-8 lg:p-10"
      >
        {/* STEP 1 — date */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <p className="eyebrow mb-3">Step one</p>
              <h2 className="h-display text-[24px] sm:text-[28px] tracking-tighter mb-2">
                Pick a date.
              </h2>
              <p className="text-[14px] text-ink-2 leading-relaxed">
                The next twelve weekdays. All times are shown in GMT.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {dates.map((d) => {
                const active =
                  state.date && d.getTime() === state.date.getTime();
                return (
                  <button
                    type="button"
                    key={d.toISOString()}
                    onClick={() => update({ date: d, slot: "" })}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-rule bg-white hover:border-ink-3 text-ink"
                    }`}
                  >
                    <div className="text-[12px] font-mono opacity-70">
                      {format(d, "EEE")}
                    </div>
                    <div className="text-[16px] font-medium mt-0.5">
                      {format(d, "MMM d")}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[12px] text-ink-3">Step 1 of 3</span>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!state.date}
                className="btn-primary lift disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — time */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-6 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
                Back
              </button>
              <p className="eyebrow mb-3">Step two</p>
              <h2 className="h-display text-[24px] sm:text-[28px] tracking-tighter mb-2">
                Pick a time.
              </h2>
              <p className="text-[14px] text-ink-2 leading-relaxed">
                {state.date && format(state.date, "EEEE, MMMM d")} · GMT.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {SLOTS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => update({ slot: s })}
                  className={`py-3 rounded-xl border text-[14px] font-medium transition-all ${
                    state.slot === s
                      ? "border-ink bg-ink text-white"
                      : "border-rule bg-white hover:border-ink-3 text-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[12px] text-ink-3">Step 2 of 3</span>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!state.slot}
                className="btn-primary lift disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — details */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <button
                type="button"
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
                Just enough to send the calendar invite.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Input
                label="Your name *"
                value={state.name}
                onChange={(v) => update({ name: v })}
              />
              <Input
                label="Email *"
                value={state.email}
                onChange={(v) => update({ email: v })}
                type="email"
              />
              <Input
                label="Phone"
                value={state.phone}
                onChange={(v) => update({ phone: v })}
                type="tel"
              />
              <Input
                label="Topic"
                value={state.topic}
                onChange={(v) => update({ topic: v })}
                placeholder="What would you like to discuss?"
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <span className="text-[12px] text-ink-3">Step 3 of 3</span>
              <button
                type="submit"
                disabled={submitting || !state.name || !state.email}
                className="btn-primary lift disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? "Confirming…" : "Confirm booking"}
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function Stepper({
  step,
  onJump,
}: {
  step: 1 | 2 | 3;
  onJump: (s: number) => void;
}) {
  const steps = [
    { n: 1, label: "Date" },
    { n: 2, label: "Time" },
    { n: 3, label: "Details" },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      {steps.map((s, i) => {
        const active = step === s.n;
        const past = step > s.n;
        const clickable = past;
        return (
          <div key={s.n} className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
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

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-medium text-ink-2 mb-1.5 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-rule bg-white text-[14px] focus:outline-none focus:border-ink-3 transition-colors placeholder:text-ink-3"
      />
    </div>
  );
}
