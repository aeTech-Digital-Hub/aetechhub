"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * CurrentlyShipping — replaces the generic "Available for projects" pill with
 * a rotating signal of what the studio is actively building. Feels specific
 * and honest instead of a template default.
 *
 * Edit ROTATION below to reflect your real active engagements.
 *
 * Behavior:
 *   - Rotates every 3.6s (long enough to read, short enough to feel alive)
 *   - Fades between items — no jarring cuts
 *   - Respects prefers-reduced-motion (shows first item statically)
 */

// Edit this list to match your actual current work.
// Keep entries short — the label fits comfortably at ~24 characters.
const ROTATION = [
  "Social Remit — Ghana fintech",
  "Delivery platform — Accra",
  "SmileBaba Hub — West Africa",
  "Malawi Village — commerce",
];

const INTERVAL_MS = 3600;
const FADE_MS = 250;

export function CurrentlyShipping() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduce || ROTATION.length <= 1) return;

    const cycle = setInterval(() => {
      // Fade out
      setVisible(false);
      // After the fade completes, swap the text and fade back in
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATION.length);
        setVisible(true);
      }, FADE_MS);

      return () => clearTimeout(swap);
    }, INTERVAL_MS);

    return () => clearInterval(cycle);
  }, [reduce]);

  return (
    <div className="fade-in mb-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-rule bg-white/60 backdrop-blur-sm">
      <span
        className="status-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: "var(--brand)" }}
      />
      <span className="text-[12px] font-mono tracking-wide text-ink-2 flex items-center gap-1.5">
        <span>Currently shipping ·</span>
        <span
          className="transition-opacity ease-out"
          style={{
            transitionDuration: `${FADE_MS}ms`,
            opacity: visible ? 1 : 0,
            color: "var(--brand)",
          }}
        >
          {ROTATION[index]}
        </span>
      </span>
    </div>
  );
}
