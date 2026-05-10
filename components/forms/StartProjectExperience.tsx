"use client";
import { Suspense, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { StartProjectForm } from "./StartProjectForm";
import { BriefSummary, type BriefSummaryData } from "./BriefSummary";

const EMPTY: BriefSummaryData = { services: [] };

/** Returns true once the user has made any selection */
function isStarted(s: BriefSummaryData): boolean {
  return Boolean(
    s.projectType ||
    s.services.length > 0 ||
    s.budget ||
    s.timeline ||
    s.summary ||
    s.name ||
    s.email ||
    s.company ||
    s.phone,
  );
}

export function StartProjectExperience() {
  const [state, setState] = useState<BriefSummaryData>(EMPTY);
  const reduce = useReducedMotion();
  const started = isStarted(state);

  return (
    <div
      className={`mx-auto transition-[max-width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        started ? "max-w-7xl" : "max-w-2xl"
      }`}
    >
      <div
        className={`grid gap-8 lg:gap-12 ${
          started
            ? "lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]"
            : "grid-cols-1"
        }`}
      >
        {/* MAIN — form */}
        <motion.div
          layout={!reduce}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0"
        >
          <Suspense fallback={<FormSkeleton />}>
            <StartProjectForm onStateChange={setState} />
          </Suspense>
        </motion.div>

        {/* SUMMARY — desktop sticky right rail */}
        <AnimatePresence>
          {started && (
            <motion.aside
              key="summary-desktop"
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: 24 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <div className="sticky top-24">
                <BriefSummary data={state} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* SUMMARY — mobile / tablet fixed bottom sheet */}
      <AnimatePresence>
        {started && <MobileSummary key="summary-mobile" data={state} />}
      </AnimatePresence>
    </div>
  );
}

/**
 * Mobile bottom sheet. Collapsed by default — shows a peek bar with
 * filled-item count. Tap to expand into the full summary.
 */
function MobileSummary({ data }: { data: BriefSummaryData }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const filledCount =
    (data.projectType ? 1 : 0) +
    (data.services.length > 0 ? 1 : 0) +
    (data.budget ? 1 : 0) +
    (data.timeline ? 1 : 0) +
    (data.summary ? 1 : 0) +
    (data.name ? 1 : 0) +
    (data.email ? 1 : 0) +
    (data.company ? 1 : 0) +
    (data.phone ? 1 : 0);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.button
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="lg:hidden fixed inset-0 bg-ink/30 backdrop-blur-sm z-40"
            aria-label="Close summary"
          />
        )}
      </AnimatePresence>

      {/* Sheet */}
      <motion.div
        initial={reduce ? false : { y: 80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="lg:hidden fixed bottom-0 inset-x-0 z-50"
      >
        {/* Peek button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full px-5 py-3.5 flex items-center justify-between bg-white border-t border-rule shadow-[0_-8px_24px_-12px_rgba(45,13,80,0.18)]"
        >
          <span className="flex items-center gap-2.5 text-[13px]">
            <span
              className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-medium text-white"
              style={{ background: "var(--brand)" }}
            >
              {filledCount}
            </span>
            <span className="font-medium text-ink">
              {open ? "Hide summary" : "Your brief, so far"}
            </span>
          </span>
          <svg
            className={`w-3.5 h-3.5 text-ink-2 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              d="M6 9l6 6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="content"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden bg-white border-t border-rule max-h-[70vh] overflow-y-auto"
            >
              <div className="p-4">
                <BriefSummary data={data} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

/**
 * Skeleton shown while StartProjectForm hydrates.
 * The form uses useSearchParams() (for service prefill via ?service=...),
 * which requires it to live inside a Suspense boundary.
 */
function FormSkeleton() {
  return (
    <div className="rounded-3xl border border-rule bg-white p-6 sm:p-8 lg:p-10">
      <div className="space-y-5">
        <div className="h-3 w-20 rounded bg-rule animate-pulse" />
        <div className="h-8 w-3/4 rounded bg-rule animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-rule animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-3 pt-4">
          <div className="h-14 rounded-xl bg-rule animate-pulse" />
          <div className="h-14 rounded-xl bg-rule animate-pulse" />
          <div className="h-14 rounded-xl bg-rule animate-pulse" />
          <div className="h-14 rounded-xl bg-rule animate-pulse" />
        </div>
      </div>
    </div>
  );
}
