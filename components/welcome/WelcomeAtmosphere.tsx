"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Layered atmospheric background for the welcome screen.
 *
 * Three layers, back-to-front:
 *   1. Soft mesh — two large radial brand-purple bleeds, drifting very slowly
 *   2. Dot grid — 24px spacing, masked to fade at edges, with cursor parallax
 *   3. Three fixed ornaments — slow-floating glyphs at strategic positions
 *
 * On top of all of this, a soft vignette frames the screen.
 *
 * Everything respects prefers-reduced-motion.
 * GPU-accelerated transforms only — no jank.
 */
export function WelcomeAtmosphere() {
  const reduce = useReducedMotion();
  const meshRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  // Cursor parallax — same pattern as HeroBackdrop, but with two layers moving at different rates
  useEffect(() => {
    if (reduce) return;
    let frame = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        if (meshRef.current) {
          // Mesh moves more (further away → bigger parallax illusion)
          meshRef.current.style.transform = `translate3d(${x * -32}px, ${y * -24}px, 0)`;
        }
        if (dotsRef.current) {
          // Dots move less
          dotsRef.current.style.transform = `translate3d(${x * -10}px, ${y * -7}px, 0)`;
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
      {/* ── LAYER 1: Mesh — two large soft brand-purple radials, drifting ── */}
      <div
        ref={meshRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none transition-transform duration-[600ms] ease-out"
      >
        {/* Top-left bleed */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vw] max-w-[1100px] max-h-[1100px] rounded-full mesh-drift-slow"
          style={{
            background:
              "radial-gradient(circle at center, rgba(45, 13, 80, 0.10) 0%, transparent 55%)",
            filter: "blur(60px)",
          }}
        />
        {/* Bottom-right bleed — different size, opposite drift direction */}
        <div
          className="absolute -bottom-1/4 -right-1/4 w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full mesh-drift-slow-rev"
          style={{
            background:
              "radial-gradient(circle at center, rgba(92, 51, 115, 0.08) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* ── LAYER 2: Dot grid — masked to fade at edges + cursor parallax ── */}
      <div
        ref={dotsRef}
        aria-hidden
        className="absolute inset-0 dot-grid dot-drift opacity-[0.45] pointer-events-none transition-transform duration-[400ms] ease-out [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_80%)]"
      />

      {/* ── LAYER 3: Three slow-floating ornaments ── */}
      {/* Top-right: small mono brand mark drifts vertically */}
      <div
        aria-hidden
        className="absolute top-[15%] right-[10%] hidden md:block float-slow pointer-events-none"
        style={{ opacity: 0.4 }}
      >
        <Ornament variant="ring" />
      </div>
      {/* Mid-left: tiny dot pair */}
      <div
        aria-hidden
        className="absolute top-[55%] left-[8%] hidden lg:block float-slow-rev pointer-events-none"
        style={{ opacity: 0.5 }}
      >
        <Ornament variant="dots" />
      </div>
      {/* Bottom-right: subtle plus-mark */}
      <div
        aria-hidden
        className="absolute bottom-[18%] right-[14%] hidden md:block float-slow pointer-events-none"
        style={{ opacity: 0.35, animationDelay: "2s" }}
      >
        <Ornament variant="cross" />
      </div>

      {/* ── Vignette — frames the screen ── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(45, 13, 80, 0.04) 100%)",
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────
// SVG ornaments — flat, brand-purple, very subtle
// ─────────────────────────────────────────

function Ornament({ variant }: { variant: "ring" | "dots" | "cross" }) {
  const stroke = "var(--brand)";

  if (variant === "ring") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" stroke={stroke} strokeWidth="0.75" />
        <circle cx="24" cy="24" r="2" fill={stroke} />
      </svg>
    );
  }

  if (variant === "dots") {
    return (
      <svg width="36" height="12" viewBox="0 0 36 12" fill="none">
        <circle cx="6" cy="6" r="2.5" fill={stroke} />
        <circle cx="18" cy="6" r="2.5" fill={stroke} opacity="0.6" />
        <circle cx="30" cy="6" r="2.5" fill={stroke} opacity="0.3" />
      </svg>
    );
  }

  // cross
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <line x1="16" y1="4" x2="16" y2="28" stroke={stroke} strokeWidth="0.75" />
      <line x1="4" y1="16" x2="28" y2="16" stroke={stroke} strokeWidth="0.75" />
    </svg>
  );
}
