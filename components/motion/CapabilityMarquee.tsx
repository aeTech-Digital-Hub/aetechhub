"use client";
import { useReducedMotion } from "framer-motion";

/**
 * Slow, calm marquee of capabilities. Pauses on hover.
 * Used as a low-key visual heartbeat between the hero and the next section.
 */
export function CapabilityMarquee() {
  const reduce = useReducedMotion();

  const items = [
    "Web Engineering",
    "SaaS Platforms",
    "Data Analysis",
    "Machine Learning",
    "Security Audits",
    "Penetration Testing",
    "API Design",
    "Cloud Architecture",
  ];

  // If user prefers reduced motion, render a static row that wraps
  if (reduce) {
    return (
      <div className="flex flex-wrap gap-x-10 gap-y-3 justify-center text-[14px] text-ink-2 py-4">
        {items.map((it) => (
          <span key={it} className="flex items-center gap-3">
            {it}
            <span className="w-1 h-1 rounded-full bg-ink-3" />
          </span>
        ))}
      </div>
    );
  }

  // Duplicate items so the marquee loops seamlessly
  const loop = [...items, ...items];

  return (
    <div className="marquee-mask overflow-hidden py-1 group">
      <div className="flex gap-10 whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]">
        {loop.map((it, i) => (
          <span
            key={`${it}-${i}`}
            className="flex items-center gap-10 text-[14px] text-ink-2"
          >
            {it}
            <span
              aria-hidden
              className="w-1 h-1 rounded-full"
              style={{ background: "var(--brand)" }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
