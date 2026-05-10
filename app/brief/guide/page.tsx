import Link from "next/link";
import { ArrowRight, ArrowLeft, BookOpen } from "lucide-react";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { CTA, italicAccent } from "@/components/marketing/CTA";
import { BRIEF_SECTIONS } from "@/lib/brief";

export const metadata = {
  title: "How to write a good brief",
  description:
    "A guide to writing a project brief that helps both sides — clearer scope, fewer surprises, faster proposals.",
};

export default function BriefGuidePage() {
  return (
    <>
      {/* HERO */}
      <section className="container-px pt-28 pb-12 lg:pt-36 lg:pb-16 bg-base">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              Back home
            </Link>
            <p className="eyebrow mb-5">Guide</p>
            <h1 className="h-display text-[40px] sm:text-[52px] lg:text-[64px] tracking-tightest mb-5 leading-[1.02]">
              How to write{" "}
              <span className="font-light gradient-text">
                a good brief.
              </span>
            </h1>
            <p className="text-[16px] lg:text-[17px] text-ink-2 leading-relaxed max-w-xl mx-auto">
              The clearer your brief, the better our proposal. This is how we
              think about it — seven sections, twenty minutes, one shared
              document at the end.
            </p>
          </Reveal>
        </div>
      </section>

      {/* WHY A BRIEF — opening paragraph */}
      <section className="container-px py-20 lg:py-28 bg-base border-t border-rule">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <p className="eyebrow text-center mb-8">Why a brief at all</p>
            <p className="text-[18px] lg:text-[20px] text-ink leading-[1.55] font-light">
              Most projects fail in week six because the brief failed in week
              one. A good brief is not a sales document — it&apos;s a shared
              understanding of what&apos;s being built, why, and what good looks
              like. We use the same format for every engagement we take on, and
              ask every prospective client to fill it in. It saves both of us
              time.
            </p>
          </Reveal>
        </div>
      </section>

      {/* SECTIONS WALK-THROUGH */}
      <section className="container-px py-24 lg:py-32 bg-tint-1 border-t border-rule">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mb-14 lg:mb-20">
              <p className="eyebrow mb-4">The seven sections</p>
              <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter mb-4">
                What we ask, and why.
              </h2>
              <p className="text-[16px] text-ink-2 leading-relaxed max-w-xl">
                Each section is a question we&apos;d ask you on a call anyway.
                Filling them in writing gives both sides time to think.
              </p>
            </div>
          </Reveal>

          <StaggerReveal className="space-y-12 lg:space-y-16">
            {BRIEF_SECTIONS.map((s) => (
              <StaggerItem key={s.id}>
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-16">
                  {/* Roman numeral + title column */}
                  <div className="lg:col-span-4">
                    <p
                      className="font-mono text-[16px] tracking-wider mb-3"
                      style={{ color: "var(--brand)" }}
                    >
                      {s.number}
                    </p>
                    <h3 className="h-display text-[26px] lg:text-[32px] tracking-tight mb-3 leading-tight">
                      {s.title}
                    </h3>
                    <p className="text-[15px] text-ink-2 font-light leading-relaxed">
                      {s.question}
                    </p>
                  </div>

                  {/* Description + checklist */}
                  <div className="lg:col-span-8 space-y-6">
                    <p className="text-[16px] lg:text-[17px] text-ink leading-relaxed">
                      {s.description}
                    </p>

                    {s.good.length > 0 && (
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-3">
                          A good answer mentions
                        </p>
                        <ul className="space-y-2">
                          {s.good.map((g) => (
                            <li
                              key={g}
                              className="flex items-start gap-2.5 text-[14px] text-ink leading-relaxed"
                            >
                              <span
                                className="font-mono text-[12px] mt-0.5 flex-shrink-0"
                                style={{ color: "var(--brand)" }}
                              >
                                ·
                              </span>
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* WHAT TO EXPECT — what we do with it */}
      <section className="container-px py-24 lg:py-32 bg-base border-t border-rule">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="eyebrow mb-4">What happens next</p>
            <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter mb-10">
              From brief to written scope.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <ol className="space-y-8">
              {[
                {
                  n: "01",
                  t: "You write the brief",
                  d: "Twenty minutes is the average. The editor saves automatically and gives you contextual tips per section. You can pause and resume from any device using the same link.",
                },
                {
                  n: "02",
                  t: "We read it carefully",
                  d: "Within 48 hours we either reply with a written scope and estimate, or write back asking for one or two clarifications. We do not auto-respond.",
                },
                {
                  n: "03",
                  t: "A 30-minute call (optional)",
                  d: "If anything in our reply isn't clear, or you want to talk it through, we book a free call. No deck. Just a conversation.",
                },
                {
                  n: "04",
                  t: "Written contract, fixed fee",
                  d: "If we both want to proceed, we send a single contract with a fixed fee tied to the scope. No hourly billing for delivery work.",
                },
              ].map((step) => (
                <li
                  key={step.n}
                  className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-5 sm:gap-8"
                >
                  <span
                    className="font-mono text-[14px] tracking-wider pt-1"
                    style={{ color: "var(--brand)" }}
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-[17px] lg:text-[18px] font-medium text-ink mb-2">
                      {step.t}
                    </h3>
                    <p className="text-[14px] lg:text-[15px] text-ink-2 leading-relaxed">
                      {step.d}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* CTA — start writing */}
      <section className="container-px py-20 lg:py-28 bg-base border-t border-rule">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <p className="eyebrow mb-5">Ready when you are</p>
            <h2 className="h-display text-[32px] lg:text-[44px] tracking-tightest mb-5 leading-[1.02]">
              Open the editor and{" "}
              <span className="font-light gradient-text">
                start writing.
              </span>
            </h2>
            <p className="text-[16px] text-ink-2 leading-relaxed max-w-md mx-auto mb-10">
              We&apos;ll ask for your contact info first so we can save your
              draft and pick up where you left off if you need to step away.
            </p>
            <Link
              href="/brief"
              className="btn-primary lift inline-flex"
              data-track="brief_guide_to_editor"
            >
              <BookOpen className="w-4 h-4" strokeWidth={2} />
              Open the editor
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </Reveal>
        </div>
      </section>

      <CTA
        eyebrow="Already know what you need?"
        title={<>Skip the brief, {italicAccent("start the form.")}</>}
        description="If a quick form is easier — three steps, a few questions, no long-form writing — that route is open too."
        primaryHref="/start-project"
        primaryLabel="Use the quick form"
        secondaryText="Want to talk first?"
        secondaryLabel="Book a 30-min call"
        secondaryHref="/book"
      />
    </>
  );
}
