import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";

export type CTAProps = {
  /** Small label above the title — e.g. "Considering us?" */
  eyebrow?: string;
  /** Main heading. May contain {italic} for the gradient italic accent. Default split: first line + italic second line. */
  title: React.ReactNode;
  /** Body paragraph below the title. */
  description?: string;
  /** Primary action — black button. */
  primaryHref?: string;
  primaryLabel?: string;
  /** Secondary text link below the button (small underline style). */
  secondaryText?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Override for tracking IDs on the buttons. */
  primaryTrack?: string;
  secondaryTrack?: string;
  /** Image to show in the right column. Defaults to /cta-visual.png */
  image?: string;
  imageAlt?: string;
};

/**
 * The CTA card used at the bottom of every page.
 * One bordered lavender card, two-column layout (text left, image right),
 * single decisive primary CTA + small text link below.
 */
export function CTA({
  eyebrow = "Considering us?",
  title,
  description = "Tell us a little about your project. We'll come back with a written scope and an honest estimate within 48 hours.",
  primaryHref = "/start-project",
  primaryLabel = "Start a project",
  secondaryText = "Prefer a conversation first?",
  secondaryHref = "/book",
  secondaryLabel = "Book a 30-min call",
  primaryTrack = "cta_primary",
  secondaryTrack = "cta_secondary",
  image = "/projects.avif",
  imageAlt = "Software shipped by aeTech",
}: CTAProps) {
  return (
    <section className="container-px py-24 lg:py-32 bg-base">
      <Reveal>
        <SpotlightCard
          className="overflow-hidden rounded-3xl border border-rule grid lg:grid-cols-2 max-w-7xl mx-auto"
          spotlightColor="rgba(45, 13, 80, 0.18)"
          style={{ background: "#F8F2FB" }}
        >
          {/* LEFT — text */}
          <div className="px-8 sm:px-12 lg:px-16 py-14 lg:py-20 flex flex-col justify-center order-2 lg:order-1">
            <p className="eyebrow mb-5">{eyebrow}</p>
            <h2 className="h-display text-[36px] lg:text-[52px] tracking-tightest mb-5 leading-[1.02]">
              {title}
            </h2>
            <p className="text-[16px] lg:text-[17px] text-ink-2 mb-9 leading-relaxed max-w-md">
              {description}
            </p>

            {primaryHref && primaryLabel && (
              <div>
                <Link
                  href={primaryHref}
                  className="btn-primary lift"
                  data-track={primaryTrack}
                >
                  {primaryLabel}
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>
            )}

            {secondaryHref && secondaryLabel && (
              <p className="mt-6 text-[13px] text-ink-2">
                {secondaryText}{" "}
                <Link
                  href={secondaryHref}
                  className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink hover:text-ink transition-colors"
                  data-track={secondaryTrack}
                >
                  {secondaryLabel}
                </Link>
              </p>
            )}
          </div>

          {/* RIGHT — image */}
          <div
            className="relative min-h-[280px] lg:min-h-0 order-1 lg:order-2 overflow-hidden"
            style={{ background: "#EDE3F4" }}
          >
            {image && (
              <Image
                src={image}
                alt={imageAlt}
                loading="eager"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover lg:object-contain object-center lg:object-[center_120%] scale-110 lg:scale-100 cine-image"
              />
            )}
          </div>
        </SpotlightCard>
      </Reveal>
    </section>
  );
}

/**
 * Helper — wraps a string in the gradient italic accent. Use for the second
 * line of the title:
 *
 *   <CTA title={<>Have a project<br />{italicAccent('in mind?')}</>} />
 */
export function italicAccent(text: string) {
  return <span className="italic font-light gradient-text">{text}</span>;
}
