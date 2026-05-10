"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { BookingForm, type BookingState } from "./BookingForm";

const EMPTY: BookingState = {
  date: null,
  slot: "",
  name: "",
  email: "",
  phone: "",
  topic: "",
};

export function BookExperience() {
  const [state, setState] = useState<BookingState>(EMPTY);

  return (
    <div className="grid lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr] gap-8 lg:gap-12">
      {/* LEFT — Call info + live selection (sticky on desktop) */}
      <aside className="lg:sticky lg:top-24 lg:self-start order-2 lg:order-1">
        <CallInfoCard state={state} />
      </aside>

      {/* RIGHT — Form */}
      <div className="order-1 lg:order-2 min-w-0">
        <BookingForm onStateChange={setState} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// CALL INFO PANEL — left rail
// ─────────────────────────────────────────

function CallInfoCard({ state }: { state: BookingState }) {
  const hasSelection = state.date || state.slot;

  return (
    <div
      className="rounded-2xl border border-rule overflow-hidden"
      style={{ background: "#F8F2FB" }}
    >
      {/* Header */}
      <div className="px-6 lg:px-7 pt-7 pb-5 border-b border-rule/60">
        <p className="eyebrow mb-2">Your call</p>
        <h3 className="h-display text-[20px] tracking-tight">
          {hasSelection ? "Almost there." : "30 minutes, on us."}
        </h3>
      </div>

      {/* Live selection */}
      {hasSelection && (
        <div className="px-6 lg:px-7 py-5 bg-white/60 backdrop-blur-sm border-b border-rule/60">
          <div className="space-y-3">
            {state.date && (
              <SelectionRow
                icon={Calendar}
                label="Date"
                value={format(state.date, "EEEE, MMMM d")}
              />
            )}
            {state.slot && (
              <SelectionRow
                icon={Clock}
                label="Time"
                value={`${state.slot} GMT`}
              />
            )}
          </div>
        </div>
      )}

      {/* Static facts */}
      <div className="px-6 lg:px-7 py-5">
        <dl className="space-y-3.5">
          <FactRow label="Format" value="Video · Google Meet" />
          <FactRow label="Duration" value="30 minutes" />
          <FactRow label="Cost" value="Free" />
          <FactRow label="Timezone" value="GMT (Accra)" />
        </dl>
      </div>

      {/* Footer */}
      <div className="px-6 lg:px-7 py-4 bg-white/40 border-t border-rule/60">
        <p className="text-[11.5px] text-ink-3 leading-relaxed">
          You&apos;ll receive a confirmation with the Meet link as soon as you
          confirm.
        </p>
      </div>
    </div>
  );
}

function SelectionRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className="w-3.5 h-3.5 flex-shrink-0 mt-1"
        strokeWidth={2}
        style={{ color: "var(--brand)" }}
      />
      <div className="flex-1 min-w-0">
        <dt className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-0.5">
          {label}
        </dt>
        <dd className="text-[14px] text-ink leading-snug">{value}</dd>
      </div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <dt className="text-[11px] font-mono uppercase tracking-wider text-ink-3">
        {label}
      </dt>
      <dd className="text-ink-2">{value}</dd>
    </div>
  );
}
