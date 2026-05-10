"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Hero backdrop:
 *  – Drifting dot grid (24s loop, imperceptible single-frame, gives the page a heartbeat)
 *  – Cursor-aware parallax: dot grid shifts ~12px as the cursor moves across the hero
 *  – Soft brand-purple radial bloom behind the headline
 *
 * Pure CSS transforms via translate3d so it stays GPU-accelerated.
 * Respects prefers-reduced-motion.
 */
export function HeroBackdrop() {
  const reduce = useReducedMotion();
  const dotsRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;

    let frame = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Normalize cursor pos to -0.5 → +0.5 around screen center
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;

        // Dot grid shifts subtly with cursor
        if (dotsRef.current) {
          dotsRef.current.style.transform = `translate3d(${x * -12}px, ${y * -8}px, 0)`;
        }
        // Bloom drifts even less (depth illusion: things further away move less)
        if (bloomRef.current) {
          bloomRef.current.style.transform = `translate3d(${x * -24}px, ${y * -16}px, 0)`;
        }
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [reduce]);

  return (
    <>
      {/* Soft brand-purple radial bloom — sits below the dot grid */}
      <div
        ref={bloomRef}
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] pointer-events-none transition-transform duration-[400ms] ease-out"
        style={{
          background:
            "radial-gradient(circle at center, rgba(45, 13, 80, 0.08) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* Drifting dot grid */}
      <div
        ref={dotsRef}
        aria-hidden
        className="absolute inset-0 dot-grid dot-drift opacity-50 pointer-events-none transition-transform duration-[400ms] ease-out [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
    </>
  );
}
