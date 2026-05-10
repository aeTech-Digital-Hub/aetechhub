"use client";
import { CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  PROJECT_TYPES,
  BUDGET_RANGES,
  TIMELINES,
  SERVICES,
} from "@/lib/services";
import type { Recommendation } from "@/lib/scope";
import { useUsdToGhsRate } from "@/components/Price";

export type BriefSummaryData = {
  projectType?: string;
  services: string[];
  budget?: string;
  timeline?: string;
  summary?: string;
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  recommendation?: Recommendation;
};

export function BriefSummary({ data }: { data: BriefSummaryData }) {
  const reduce = useReducedMotion();
  const ghsRate = useUsdToGhsRate();

  const projectTypeLabel = PROJECT_TYPES.find(
    (t) => t.id === data.projectType,
  )?.label;
  const budgetLabel =
    data.budget && BUDGET_RANGES.includes(data.budget) ? data.budget : null;
  const timelineLabel =
    data.timeline && TIMELINES.includes(data.timeline) ? data.timeline : null;
  const serviceLabels = data.services
    .map((slug) => SERVICES.find((s) => s.slug === slug)?.name)
    .filter(Boolean) as string[];

  // Each row: label, value (string or array), shown only if value present
  const rows: { label: string; value: string | string[] | null }[] = [
    { label: "Project type", value: projectTypeLabel || null },
    {
      label: "Services",
      value: serviceLabels.length > 0 ? serviceLabels : null,
    },
    { label: "Budget", value: budgetLabel || null },
    { label: "Timeline", value: timelineLabel || null },
    { label: "Brief", value: data.summary || null },
    { label: "Name", value: data.name || null },
    { label: "Email", value: data.email || null },
    { label: "Company", value: data.company || null },
    { label: "Phone", value: data.phone || null },
  ];

  const filledRows = rows.filter((r) => r.value !== null && r.value !== "");

  return (
    <div
      className="rounded-2xl border border-rule overflow-hidden"
      style={{ background: "#F8F2FB" }}
    >
      {/* Header */}
      <div className="px-6 lg:px-7 pt-7 pb-5 border-b border-rule/60">
        <p className="eyebrow mb-2">Your brief, so far</p>
        <h3 className="h-display text-[20px] tracking-tight">
          {filledRows.length === 0
            ? "Your selections will show here."
            : "A working summary."}
        </h3>
      </div>

      {/* Body — grows as items get filled */}
      <div className="px-6 lg:px-7 py-5 bg-white/60 backdrop-blur-sm">
        {filledRows.length === 0 ? (
          <p className="text-[13px] text-ink-2 italic leading-relaxed py-3">
            Pick a project type to get started — your choices will appear here
            as you go.
          </p>
        ) : (
          <dl className="space-y-4">
            <AnimatePresence initial={false}>
              {filledRows.map((r) => (
                <motion.div
                  key={r.label}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2
                    className="w-3.5 h-3.5 flex-shrink-0 mt-1"
                    strokeWidth={2}
                    style={{ color: "var(--brand)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <dt className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-0.5">
                      {r.label}
                    </dt>
                    {Array.isArray(r.value) ? (
                      <dd className="flex flex-wrap gap-1.5">
                        {r.value.map((v) => (
                          <span
                            key={v}
                            className="inline-block px-2 py-0.5 rounded-full bg-white border border-rule text-[11.5px] text-ink-2"
                          >
                            {v}
                          </span>
                        ))}
                      </dd>
                    ) : (
                      <dd className="text-[13px] text-ink leading-snug break-words">
                        {r.value}
                      </dd>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </dl>
        )}
      </div>

      {/* Recommendation card (when scoping is complete) */}
      <AnimatePresence>
        {data.recommendation && (
          <motion.div
            key="rec"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 lg:px-7 py-5 border-t border-rule/60"
            style={{ background: "rgba(45, 13, 80, 0.04)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles
                className="w-3.5 h-3.5"
                strokeWidth={2}
                style={{ color: "var(--brand)" }}
              />
              <p className="eyebrow">Recommended package</p>
            </div>
            <p
              className="h-display text-[18px] tracking-tight capitalize mb-2"
              style={{ color: "var(--brand)" }}
            >
              {data.recommendation.package}
            </p>
            <p className="text-[12.5px] text-ink-2 leading-relaxed mb-3 line-clamp-3">
              {data.recommendation.reasoning}
            </p>
            <div className="text-[12px] text-ink-2 font-mono">
              <span className="text-ink">
                ${(data.recommendation.estimateLow / 1000).toFixed(1)}k – $
                {(data.recommendation.estimateHigh / 1000).toFixed(1)}k
              </span>
              {ghsRate && (
                <span className="block text-ink-3 mt-1">
                  ≈ GHS{" "}
                  {((data.recommendation.estimateLow * ghsRate) / 1000).toFixed(
                    0,
                  )}
                  k – GHS{" "}
                  {(
                    (data.recommendation.estimateHigh * ghsRate) /
                    1000
                  ).toFixed(0)}
                  k today
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer reassurance */}
      <div className="px-6 lg:px-7 py-4 bg-white/40 border-t border-rule/60">
        <p className="text-[11.5px] text-ink-3 leading-relaxed">
          We&apos;ll review your brief and reply with a written scope within 48
          hours.
        </p>
      </div>
    </div>
  );
}
