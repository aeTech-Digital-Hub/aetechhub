import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { TESTIMONIALS, type Testimonial } from "@/lib/testimonials";

function initialsFor(t: Testimonial): string {
  if (t.initials) return t.initials;
  return t.author
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Testimonials() {
  return (
    <section className="container-px py-24 lg:py-32 bg-base border-t border-rule">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="max-w-2xl mb-12 lg:mb-16">
            <p className="eyebrow mb-4">In their words</p>
            <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter">
              What clients say.
            </h2>
            <p className="text-[16px] lg:text-[17px] text-ink-2 mt-4 max-w-xl leading-relaxed">
              Quiet praise from the founders and operators we&apos;ve worked
              with — most of whom we still talk to.
            </p>
          </div>
        </Reveal>

        <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.author}>
              <SpotlightCard
                className="border border-rule rounded-2xl bg-white p-6 lg:p-7 lift h-full flex flex-col"
                spotlightColor="rgba(45, 13, 80, 0.08)"
              >
                {/* Mark — subtle quote glyph in brand purple */}
                <span
                  aria-hidden
                  className="h-display text-[44px] leading-none mb-3 select-none"
                  style={{ color: "var(--brand)", opacity: 0.4 }}
                >
                  &ldquo;
                </span>

                {/* Quote */}
                <blockquote className="text-[15px] text-ink leading-relaxed flex-1 mb-6">
                  {t.quote}
                </blockquote>

                {/* Attribution */}
                <div className="flex items-center gap-3 pt-5 border-t border-rule">
                  <span
                    className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-medium text-white flex-shrink-0"
                    style={{ background: "var(--brand)" }}
                  >
                    {initialsFor(t)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink leading-tight truncate">
                      {t.author}
                    </p>
                    <p className="text-[12px] text-ink-3 leading-tight truncate">
                      {t.role}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
