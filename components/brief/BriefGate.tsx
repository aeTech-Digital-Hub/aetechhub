"use client";
import { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";

export type GateContact = {
  name: string;
  email: string;
  company: string;
  phone: string;
};

export function BriefGate({
  onPass,
  initial,
}: {
  onPass: (c: GateContact) => Promise<void> | void;
  initial?: Partial<GateContact>;
}) {
  const [contact, setContact] = useState<GateContact>({
    name: initial?.name || "",
    email: initial?.email || "",
    company: initial?.company || "",
    phone: initial?.phone || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    contact.name.trim().length > 0 && /\S+@\S+\.\S+/.test(contact.email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onPass(contact);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-rule bg-white p-6 sm:p-8 lg:p-12 max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 mb-6">
        <span
          className="w-8 h-8 rounded-full grid place-items-center"
          style={{ background: "var(--brand-100)" }}
        >
          <Lock
            className="w-3.5 h-3.5"
            strokeWidth={2}
            style={{ color: "var(--brand)" }}
          />
        </span>
        <p className="eyebrow">Before we begin</p>
      </div>

      <h2 className="h-display text-[28px] lg:text-[36px] tracking-tighter mb-4 leading-[1.05]">
        Just a quick introduction.
      </h2>
      <p className="text-[14.5px] lg:text-[15px] text-ink-2 leading-relaxed mb-8">
        We ask for your contact info first so we can save your draft as you
        write — and so we know who to reply to if you need a few days to finish.
        We won&apos;t share your email or call you out of the blue.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            label="Your name *"
            value={contact.name}
            onChange={(v) => setContact((p) => ({ ...p, name: v }))}
            autoComplete="name"
          />
          <Field
            label="Email *"
            type="email"
            value={contact.email}
            onChange={(v) => setContact((p) => ({ ...p, email: v }))}
            autoComplete="email"
          />
          <Field
            label="Company"
            value={contact.company}
            onChange={(v) => setContact((p) => ({ ...p, company: v }))}
            autoComplete="organization"
          />
          <Field
            label="Phone"
            type="tel"
            value={contact.phone}
            onChange={(v) => setContact((p) => ({ ...p, phone: v }))}
            autoComplete="tel"
          />
        </div>

        {error && (
          <p className="text-[13px] text-red-700 bg-red-50 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-between items-center pt-3">
          <p className="text-[12px] text-ink-3">
            All saves are encrypted in transit.
          </p>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="btn-primary lift disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? "Opening editor…" : "Open the editor"}
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-medium text-ink-2 mb-1.5 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-rule bg-white text-[14px] focus:outline-none focus:border-ink-3 transition-colors"
      />
    </div>
  );
}
