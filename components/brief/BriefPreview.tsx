"use client";
import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BRIEF_SECTIONS, type StructuredBrief } from "@/lib/brief";

/**
 * Rendered preview of the brief, in a modal overlay.
 * Branded with letterhead + watermark. Visible to the writer but
 * not downloadable through any UI affordance.
 *
 * Hard truth: the watermark + lack of download button are deterrents,
 * not protection. A determined visitor can always print or screenshot.
 * What we control is the convenience curve.
 */
export function BriefPreview({
  values,
  briefId,
  contactName,
  onClose,
}: {
  values: StructuredBrief;
  briefId: string;
  contactName: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Block common print/save shortcuts while preview is up.
    // Not foolproof — devtools, screenshots, OS-level tools all bypass.
    // Just adds friction.
    function block(e: KeyboardEvent) {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && (e.key === "p" || e.key === "s")) {
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", block);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", block);
    };
  }, []);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4 select-none"
        style={{
          // Disable text selection in the preview — small deterrent against copy/paste
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <motion.div
          key="dialog"
          onClick={(e) => e.stopPropagation()}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-4xl rounded-3xl bg-base shadow-2xl overflow-hidden"
          // Disable right-click context menu on the preview document
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Close button — fixed top-right */}
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white border border-rule grid place-items-center hover:border-ink-3 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>

          {/* Document body */}
          <div className="relative">
            {/* Watermark — diagonal repeating band over the document */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
              style={{
                // SVG watermark repeated diagonally
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='340' height='340'><text x='170' y='170' text-anchor='middle' fill='%232D0D50' fill-opacity='0.06' font-family='monospace' font-size='14' transform='rotate(-30 170 170)'>DRAFT &#183; aeTech Digital Hub &#183; not for redistribution</text></svg>\")",
                backgroundRepeat: "repeat",
              }}
            />

            {/* LETTERHEAD — deep purple band with logo + meta */}
            <div
              className="px-8 sm:px-12 py-7 lg:py-9 flex items-center justify-between flex-wrap gap-5 relative z-20"
              style={{ background: "var(--brand)" }}
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/aetech-logo-light.png"
                  alt="aeTech Digital Hub"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                  style={{ height: "auto" }}
                />
                <div className="text-white">
                  <p className="font-mono text-[10.5px] tracking-wider opacity-70 mb-0.5">
                    Project brief
                  </p>
                  <p className="h-display text-[20px] tracking-tight">
                    aeTech Digital Hub
                  </p>
                </div>
              </div>
              <div className="text-white text-right">
                <p className="font-mono text-[10.5px] tracking-wider opacity-70 mb-0.5">
                  Brief ID
                </p>
                <p className="font-mono text-[14px] tracking-wider">
                  {briefId}
                </p>
              </div>
            </div>

            {/* Sub-header — meta strip */}
            <div className="px-8 sm:px-12 py-4 border-b border-rule flex items-center justify-between flex-wrap gap-3 text-[12px] font-mono text-ink-2">
              <span>Prepared by · {contactName || "Unknown"}</span>
              <span>{today}</span>
            </div>

            {/* DOCUMENT BODY */}
            <article className="px-8 sm:px-12 py-10 lg:py-14 space-y-10 lg:space-y-14 relative">
              {BRIEF_SECTIONS.map((s) => {
                const value = values[s.id];
                const filled = value.trim().length > 0;
                return (
                  <section key={s.id}>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span
                        className="font-mono text-[12px] tracking-wider"
                        style={{ color: "var(--brand)" }}
                      >
                        {s.number}
                      </span>
                      <h3 className="h-display text-[20px] lg:text-[24px] tracking-tight leading-tight">
                        {s.title}
                      </h3>
                    </div>
                    {filled ? (
                      <p className="text-[15px] lg:text-[16px] text-ink leading-[1.65] whitespace-pre-line">
                        {value}
                      </p>
                    ) : (
                      <p className="text-[14px] text-ink-3 italic">
                        Not yet completed.
                      </p>
                    )}
                  </section>
                );
              })}
            </article>

            {/* FOOTER */}
            <footer className="px-8 sm:px-12 py-7 border-t border-rule bg-base">
              <div className="grid sm:grid-cols-3 gap-4 text-[11px] font-mono text-ink-3">
                <div>
                  <p className="uppercase tracking-wider mb-1">Studio</p>
                  <p>aeTech Digital Hub</p>
                  <p>Spintex Flower Port</p>
                  <p>Accra, Ghana</p>
                </div>
                <div>
                  <p className="uppercase tracking-wider mb-1">Contact</p>
                  <p>ephraim@aetechdigitalhub.com</p>
                  <p>+233 55 444 8061</p>
                </div>
                <div className="sm:text-right">
                  <p className="uppercase tracking-wider mb-1">Document</p>
                  <p>{briefId}</p>
                  <p>{today}</p>
                </div>
              </div>
            </footer>
          </div>

          {/* Preview-only banner at the very top inside the dialog */}
          <div
            className="absolute top-0 left-0 right-0 px-5 py-2 text-center z-30 text-[11px] font-mono uppercase tracking-wider"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              color: "var(--brand)",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            Live preview · For your review only
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
