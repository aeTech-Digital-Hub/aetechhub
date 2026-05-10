import Link from "next/link";
import { ArrowUpRight, Zap, BookOpen } from "lucide-react";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";

/**
 * "How to start" section — two paths to working with us.
 *
 * Used on the homepage between recent projects and the CTA, and optionally
 * on service / project detail pages where it makes sense to give visitors
 * an explicit next-step menu.
 *
 * Design discipline: this is NOT a CTA replacement — both paths are equal-weight
 * options for visitors who already want to engage. The primary CTA at the bottom
 * of each page stays as the single decisive action.
 */
export function HowToStart() {
  return (
    <section className="container-px py-24 lg:py-32 bg-base border-t border-rule">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="max-w-2xl mb-12 lg:mb-16">
            <p className="eyebrow mb-4">How to start</p>
            <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter">
              Two ways in.
            </h2>
            <p className="text-[16px] lg:text-[17px] text-ink-2 mt-4 max-w-xl leading-relaxed">
              Pick whichever feels right for where you are. Both end in the same
              place — a written scope and an honest estimate, within 48 hours.
            </p>
          </div>
        </Reveal>

        <StaggerReveal className="grid lg:grid-cols-2 gap-5 lg:gap-6">
          {/* Path 1 — Quick form */}
          <StaggerItem>
            <Link
              href="/start-project"
              className="group block h-full"
              data-track="how_to_start_quick"
            >
              <SpotlightCard
                className="border border-rule rounded-2xl bg-white p-7 lg:p-9 lift h-full flex flex-col"
                spotlightColor="rgba(45, 13, 80, 0.08)"
              >
                <div className="flex items-start justify-between mb-7">
                  <span
                    className="w-10 h-10 rounded-full grid place-items-center"
                    style={{ background: "var(--brand-100)" }}
                  >
                    <Zap
                      className="w-4 h-4"
                      strokeWidth={2}
                      style={{ color: "var(--brand)" }}
                    />
                  </span>
                  <ArrowUpRight
                    className="w-4 h-4 text-ink-3 group-hover:text-brand transition-colors"
                    strokeWidth={2}
                  />
                </div>

                <p
                  className="font-mono text-[11px] tracking-wider mb-2"
                  style={{ color: "var(--brand)" }}
                >
                  In a hurry
                </p>
                <h3 className="h-display text-[24px] lg:text-[28px] tracking-tight mb-3 leading-tight">
                  Use the quick form.
                </h3>
                <p className="text-[14.5px] lg:text-[15px] text-ink-2 leading-relaxed mb-7">
                  Three steps, a few questions, no long-form writing. Best when
                  you already know roughly what you want and you&apos;d rather
                  talk it through than write it down.
                </p>

                <ul className="space-y-2.5 mb-2 mt-auto pt-6 border-t border-rule">
                  {[
                    "Five minutes",
                    "AI scoping if you&apos;re unsure",
                    "Reply within 48 hours",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-baseline gap-2 text-[12.5px] text-ink-2"
                    >
                      <span
                        className="font-mono flex-shrink-0"
                        style={{ color: "var(--brand)" }}
                      >
                        ·
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </Link>
          </StaggerItem>

          {/* Path 2 — Detailed brief */}
          <StaggerItem>
            <Link
              href="/brief/guide"
              className="group block h-full"
              data-track="how_to_start_brief"
            >
              <SpotlightCard
                className="border border-rule rounded-2xl bg-white p-7 lg:p-9 lift h-full flex flex-col"
                spotlightColor="rgba(45, 13, 80, 0.08)"
              >
                <div className="flex items-start justify-between mb-7">
                  <span
                    className="w-10 h-10 rounded-full grid place-items-center"
                    style={{ background: "var(--brand-100)" }}
                  >
                    <BookOpen
                      className="w-4 h-4"
                      strokeWidth={2}
                      style={{ color: "var(--brand)" }}
                    />
                  </span>
                  <ArrowUpRight
                    className="w-4 h-4 text-ink-3 group-hover:text-brand transition-colors"
                    strokeWidth={2}
                  />
                </div>

                <p
                  className="font-mono text-[11px] tracking-wider mb-2"
                  style={{ color: "var(--brand)" }}
                >
                  Considered
                </p>
                <h3 className="h-display text-[24px] lg:text-[28px] tracking-tight mb-3 leading-tight">
                  Write a detailed brief.
                </h3>
                <p className="text-[14.5px] lg:text-[15px] text-ink-2 leading-relaxed mb-7">
                  Seven sections, twenty minutes, autosaved as you go. Best when
                  the project is real and you want a serious, written
                  conversation from the start.
                </p>

                <ul className="space-y-2.5 mb-2 mt-auto pt-6 border-t border-rule">
                  {[
                    "Twenty minutes, autosaved",
                    "Contextual writing tips per section",
                    "Resume any time from the same browser",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-baseline gap-2 text-[12.5px] text-ink-2"
                    >
                      <span
                        className="font-mono flex-shrink-0"
                        style={{ color: "var(--brand)" }}
                      >
                        ·
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </Link>
          </StaggerItem>
        </StaggerReveal>
      </div>
    </section>
  );
}
