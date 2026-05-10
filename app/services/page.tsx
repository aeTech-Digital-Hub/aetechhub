import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { SERVICES } from "@/lib/services";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { CTA } from "@/components/marketing/CTA";

export const revalidate = 3600;

export const metadata = {
  title: "Services",
  description:
    "Six disciplines, one studio. Web engineering, SaaS, data analysis, machine learning, security audits, and penetration testing — all senior-led.",
};

export default function ServicesPage() {
  return (
    <>
      {/* ─────────────────────────────────────────
          PAGE HERO — same restraint as the homepage
          ───────────────────────────────────────── */}
      <section className="container-px pt-28 pb-20 lg:pt-36 lg:pb-24 border-b border-rule bg-base">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <p className="eyebrow mb-5">Services</p>
            <h1 className="h-display text-[44px] sm:text-[56px] lg:text-[72px] tracking-tightest mb-6 leading-[1.02]">
              Our disciplines.
              <br />
              <span className="font-light gradient-text">One Hub.</span>
            </h1>
            <p className="text-[17px] lg:text-[19px] text-ink-2 max-w-xl mx-auto leading-relaxed">
              Inside our envelope of expertise, we go deep. Senior-led,
              end-to-end, no exceptions.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          SERVICE CARDS — alternating overlay layout
          Card-on-left, image-on-right → flips → repeats
          ───────────────────────────────────────── */}
      <div className="container-px py-20 lg:py-32 max-w-7xl mx-auto space-y-16 lg:space-y-24">
        {SERVICES.map((s, i) => {
          const cardOnLeft = i % 2 === 0;
          const num = String(i + 1).padStart(2, "0");

          return (
            <Reveal key={s.slug} delay={0}>
              <Link
                href={`/services/${s.slug}`}
                className="group relative block rounded-3xl overflow-hidden lift"
                data-track={`service_${s.slug}`}
              >
                {/* Full-bleed photo backdrop */}
                <div className="relative aspect-[16/10] sm:aspect-[16/8] lg:aspect-[16/6] w-full overflow-hidden bg-rule">
                  {s.photo && (
                    <Image
                      src={s.photo}
                      alt={s.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 1280px"
                      className="object-cover cine-image"
                      priority={i === 0}
                    />
                  )}

                  {/* Subtle dark overlay on the image edge opposite the card,
                      so the image doesn't fight the card's white surface */}
                  <div
                    aria-hidden
                    className={`absolute inset-0 ${
                      cardOnLeft
                        ? "bg-gradient-to-r from-black/15 via-transparent to-black/30"
                        : "bg-gradient-to-l from-black/15 via-transparent to-black/30"
                    }`}
                  />
                </div>

                {/* Overlay card — sits on top of the photo */}
                <div
                  className={`
                    absolute top-1/2 -translate-y-1/2
                    ${cardOnLeft ? "left-4 sm:left-8 lg:left-14" : "right-4 sm:right-8 lg:right-14"}
                    w-[88%] sm:w-[68%] md:w-[56%] lg:w-[44%] xl:w-[40%]
                  `}
                >
                  <SpotlightCard
                    className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-rule shadow-[0_24px_60px_-12px_rgba(45,13,80,0.18)]"
                    spotlightColor="rgba(45, 13, 80, 0.10)"
                  >
                    <p
                      className="font-mono text-[12px] tracking-wider mb-3 sm:mb-5"
                      style={{ color: "var(--brand)" }}
                    >
                      {num}
                    </p>

                    <h2 className="h-display text-[22px] sm:text-[28px] lg:text-[32px] tracking-tight mb-3 sm:mb-4 leading-[1.1]">
                      {s.name}
                    </h2>

                    <p className="text-[14px] sm:text-[15px] text-ink-2 leading-relaxed line-clamp-3 sm:line-clamp-none mb-4 sm:mb-6">
                      {s.description}
                    </p>

                    <span className="inline-flex items-center gap-1.5 text-[13px] sm:text-[14px] font-medium text-ink group-hover:text-brand transition-colors">
                      Learn more
                      <ArrowUpRight
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        strokeWidth={2}
                      />
                    </span>
                  </SpotlightCard>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────
          CTA — same lavender card pattern as homepage,
          copy adjusted for the services context
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 bg-base">
        {/* <Reveal>
          <SpotlightCard
            className="overflow-hidden rounded-3xl border border-rule grid lg:grid-cols-2"
            spotlightColor="rgba(45, 13, 80, 0.18)"
            style={{ background: "#F8F2FB" }}
          >
            <div className="px-8 sm:px-12 lg:px-16 py-14 lg:py-20 flex flex-col justify-center order-2 lg:order-1">
              <p className="eyebrow mb-5">Get started</p>
              <h2 className="h-display text-[36px] lg:text-[52px] tracking-tightest mb-5 leading-[1.02]">
                Not sure where you fit?
                <br />
                <span className="italic font-light gradient-text">
                  We'll help you scope it.
                </span>
              </h2>
              <p className="text-[16px] lg:text-[17px] text-ink-2 mb-9 leading-relaxed max-w-md">
                Tell us a little about your project. We&apos;ll come back with a
                written scope, the right team, and an honest estimate within 48
                hours.
              </p>

              <div>
                <Link
                  href="/start-project"
                  className="btn-primary lift"
                  data-track="services_cta_start"
                >
                  Start a project
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>

              <p className="mt-6 text-[13px] text-ink-2">
                Prefer a conversation first?{" "}
                <Link
                  href="/book"
                  className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink hover:text-ink transition-colors"
                  data-track="services_cta_book"
                >
                  Book a 30-min call
                </Link>
              </p>
            </div>

            <div
              className="relative min-h-[280px] lg:min-h-0 order-1 lg:order-2 overflow-hidden"
              style={{ background: "#EDE3F4" }}
            >
              <Image
                src="/cta-visual.png"
                alt="Software shipped by aeTech"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover lg:object-contain object-center lg:object-[center_120%] scale-110 lg:scale-100 cine-image"
              />
            </div>
          </SpotlightCard>
        </Reveal> */}

        <CTA
          title="Not sure where you fit? We'll help you scope it."
          eyebrow="Get started"
        />
      </section>
    </>
  );
}
