import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroBackdrop } from "@/components/motion/HeroBackdrop";
import { CurrentlyShipping } from "@/components/marketing/CurrentlyShipping";

/**
 * Hero — restrained-credibility direction.
 *
 * Preserves the locked warm base + brand-purple bloom + dot grid. Adds four
 * quiet signals that make the studio feel technically credible without
 * shifting into cyber/dark aesthetics:
 *
 *   1. Terminal cursor after the italic accent — subtle "we ship code"
 *   2. Vertical hairline typographic guide at the left edge — engineering rigor
 *   3. Currently-shipping rotating badge below CTA — real signal, replaces
 *      the generic "Available for projects" pill
 *   4. Tighter subhead — confidence through restraint, not a feature checklist
 *
 * If you want to reuse this block, drop it into app/page.tsx where the old
 * <section> lived.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-rule bg-base">
      <HeroBackdrop />

      {/* Hairline vertical guide — sits at the container-px inner edge,
          extends the full height of the hero. Engineering-blueprint quiet. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 hidden lg:block"
        style={{
          left: "clamp(1.25rem, 5vw, 4rem)",
          borderLeft: "1px solid var(--rule)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 hidden lg:block"
        style={{
          right: "clamp(1.25rem, 5vw, 4rem)",
          borderRight: "1px solid var(--rule)",
        }}
      />

      <div className="container-px relative">
        <div className="max-w-3xl mx-auto text-center pt-28 pb-32 lg:pt-40 lg:pb-44">
          {/* Currently shipping — real signal, not a vague "available" pill */}
          <CurrentlyShipping />

          <h1 className="h-display fade-in-2 text-[42px] sm:text-[56px] lg:text-[72px] tracking-tightest mb-7 leading-[1.02]">
            Software,{" "}
            <span className="font-light gradient-text">built right</span>
            <TerminalCursor />
            <br />
            the first time.
          </h1>

          {/* Restrained subhead — a proposition, not a feature list */}
          <p className="fade-in-3 text-[17px] lg:text-[19px] text-ink-2 max-w-xl mx-auto mb-10 leading-relaxed">
            An Accra studio building SaaS platforms, ML systems, and secure
            infrastructure end-to-end.
          </p>

          <div className="fade-in-4">
            <Link
              href="/start-project"
              className="btn-primary lift"
              data-track="hero_start_project"
            >
              Start a project
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>

            <p className="mt-5 text-[13px] text-ink-2">
              Or{" "}
              <Link
                href="/projects"
                className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink transition-colors"
                data-track="hero_view_work"
              >
                see what we&apos;ve been shipping
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Fade to page background */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--bg))",
        }}
      />
    </section>
  );
}

/**
 * Terminal cursor — a single vertical bar that blinks after the italic
 * accent. Subtle "we ship code" signal without going full monospace/glitch.
 * Sits inline so it flows with the text baseline.
 */
function TerminalCursor() {
  return (
    <span
      aria-hidden
      className="inline-block align-baseline ml-[2px] terminal-cursor"
      style={{
        width: "0.08em",
        height: "0.85em",
        background: "var(--brand)",
        verticalAlign: "-0.05em",
      }}
    />
  );
}
