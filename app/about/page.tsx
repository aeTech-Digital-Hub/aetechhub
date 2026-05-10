import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { CTA } from "@/components/marketing/CTA";

export const revalidate = 3600;

export const metadata = {
  title: "About",
  description:
    "aeTech Digital Hub is an engineering studio in Accra, Ghana. We design and build websites, SaaS platforms, and the systems beneath them — for teams that need it done right.",
};

const PRINCIPLES = [
  {
    n: "I",
    title: "Quietly excellent",
    body: "We don't perform craft. We just do the work, deliver, and move on. The artefact speaks for itself.",
  },
  {
    n: "II",
    title: "Senior, end to end",
    body: "Every engagement is owned by the person who scoped it. No bait-and-switch. No hand-off to a junior team after the contract is signed.",
  },
  {
    n: "III",
    title: "Honest about scope",
    body: "We tell clients what something costs before they commit. We say no when we are not the right studio. Calm cadence — fewer surprises in the room than at the dinner table.",
  },
];

const TIMELINE = [
  {
    year: "2024",
    body: "Hub founded in Accra. First three engagements ship.",
  },
  {
    year: "2025",
    body: "Expanded into data engineering. Twelfth project in production.",
  },
  {
    year: "2026",
    body: "Quietly open to a small slate of new clients each quarter.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ─────────────────────────────────────────
          HERO — small eyebrow, single sentence, no image
          ───────────────────────────────────────── */}
      <section className="container-px pt-32 pb-20 lg:pt-44 lg:pb-28 bg-base">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <p className="eyebrow mb-6">About</p>
            <h1 className="h-display text-[44px] sm:text-[60px] lg:text-[80px] tracking-tightest leading-[0.98] mb-8">
              An Expectional Hub,
              <br />
              <span className="font-light gradient-text">deliberately.</span>
            </h1>
            <p className="text-[17px] lg:text-[19px] text-ink-2 leading-relaxed max-w-xl mx-auto">
              aeTech Digital Hub is an engineering Hub in Accra, Ghana — taking
              on a few engagements each quarter, by design.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Hairline divider — confident, single line */}
      <div className="container-px">
        <div className="max-w-7xl mx-auto">
          <hr className="border-t border-rule" />
        </div>
      </div>

      {/* ─────────────────────────────────────────
          MISSION — opening paragraph, magazine-style
          Narrow column, slightly larger text, italic drop-cap optional
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 bg-base">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <p className="eyebrow text-center mb-8">Our work</p>
            <p className="text-[20px] lg:text-[22px] leading-[1.55] text-ink font-light">
              We build the kind of software you wish more places built — morden
              customized, senior-led, calm in cadence, and shipped to a standard
              you can stake a reputation on. We work with founders, operators,
              and small institutions who care about the result and the process —
              and who want a team they can call ten years from now and still
              recognise.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          STUDIO IMAGE — single large editorial portrait,
          framed in soft lavender card (Hims-padded pattern)
          ───────────────────────────────────────── */}
      <section className="container-px pb-24 lg:pb-32 bg-base">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div
              className="rounded-3xl overflow-hidden p-6 lg:p-12"
              style={{ background: "#F8F2FB" }}
            >
              <div className="aspect-[16/10] sm:aspect-[16/9] relative rounded-2xl overflow-hidden bg-ink">
                <Image
                  src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1800&q=85&auto=format&fit=crop"
                  alt="Studio at work"
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover"
                  style={{
                    filter: "grayscale(100%) contrast(1.05) brightness(0.95)",
                  }}
                  priority
                />
                {/* Subtle warm tone overlay so the B&W harmonises with the warm page bg */}
                <div
                  aria-hidden
                  className="absolute inset-0 mix-blend-multiply pointer-events-none"
                  style={{ background: "rgba(45, 13, 80, 0.06)" }}
                />
              </div>

              {/* Caption — small mono, centered under the image */}
              <p className="text-center text-[12px] font-mono text-ink-2 mt-6 lg:mt-8 tracking-wide">
                Spintex · Accra, Ghana · MMXXVI
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Hairline */}
      <div className="container-px">
        <div className="max-w-7xl mx-auto">
          <hr className="border-t border-rule" />
        </div>
      </div>

      {/* ─────────────────────────────────────────
          PRINCIPLES — I / II / III — typography only, no cards or icons
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 bg-base">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="max-w-2xl mb-16 lg:mb-20">
              <p className="eyebrow mb-5">Principles</p>
              <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter">
                Three rules we don&apos;t break.
              </h2>
            </div>
          </Reveal>

          <StaggerReveal className="grid lg:grid-cols-3 gap-x-12 gap-y-16">
            {PRINCIPLES.map((p) => (
              <StaggerItem key={p.n}>
                <div className="max-w-sm">
                  <p
                    className="font-mono text-[14px] tracking-wider mb-6"
                    style={{ color: "var(--brand)" }}
                  >
                    {p.n}
                  </p>
                  <h3 className="h-display text-[24px] lg:text-[28px] tracking-tight mb-4 leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-[15px] lg:text-[16px] text-ink-2 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* Hairline */}
      <div className="container-px">
        <div className="max-w-7xl mx-auto">
          <hr className="border-t border-rule" />
        </div>
      </div>

      {/* ─────────────────────────────────────────
          TIMELINE — minimal, year on left, one-line on right
          No vertical rail with circles, no colored dots
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 bg-base">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="eyebrow mb-5">Brief history</p>
            <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter mb-12 lg:mb-16">
              How we got here.
            </h2>
          </Reveal>

          <StaggerReveal className="space-y-0">
            {TIMELINE.map((m, i) => (
              <StaggerItem key={m.year}>
                <div
                  className={`grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr] gap-6 sm:gap-12 py-6 lg:py-8 ${
                    i !== TIMELINE.length - 1 ? "border-b border-rule" : ""
                  }`}
                >
                  <div
                    className="font-mono text-[14px] sm:text-[15px] tracking-wider pt-0.5"
                    style={{ color: "var(--brand)" }}
                  >
                    {m.year}
                  </div>
                  <p className="text-[15px] sm:text-[16px] text-ink leading-relaxed">
                    {m.body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          COLOPHON — facts about the studio, like the back of a magazine
          ───────────────────────────────────────── */}
      <section className="container-px pb-24 lg:pb-32 bg-base">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="border-t border-b border-rule py-10 lg:py-12">
              <p className="eyebrow mb-8">Studio</p>
              <dl className="grid sm:grid-cols-2 gap-y-6 gap-x-12 text-[15px]">
                <FactPair label="Founded" value="2024" />
                <FactPair label="Location" value="Accra, Ghana" />
                <FactPair label="Team" value="Three, full-time" />
                <FactPair label="Currently" value="Open · Q1 2026" />
                <FactPair label="Email" value="ephraim@aetechdigitalhub.com" />
                <FactPair label="Phone" value="+233 55 444 8061" />
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          CTA — same lavender Hims-Labs card pattern, restrained copy
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 bg-base border-t border-rule">
        {/* <Reveal>
          <SpotlightCard
            className="overflow-hidden rounded-3xl border border-rule grid lg:grid-cols-2 max-w-7xl mx-auto"
            spotlightColor="rgba(45, 13, 80, 0.18)"
            style={{ background: "#F8F2FB" }}
          >
            <div className="px-8 sm:px-12 lg:px-16 py-14 lg:py-20 flex flex-col justify-center order-2 lg:order-1">
              <p className="eyebrow mb-5">Considering us?</p>
              <h2 className="h-display text-[36px] lg:text-[52px] tracking-tightest mb-5 leading-[1.02]">
                Let&apos;s have{" "}
                <span className="italic font-light gradient-text">
                  a conversation.
                </span>
              </h2>
              <p className="text-[16px] lg:text-[17px] text-ink-2 mb-9 leading-relaxed max-w-md">
                Tell us a little about what you&apos;re trying to build. If
                we&apos;re a fit, we&apos;ll come back with a written scope and
                an honest estimate within 48 hours.
              </p>

              <div>
                <Link
                  href="/start-project"
                  className="btn-primary lift"
                  data-track="about_cta_start"
                >
                  Start a project
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>

              <p className="mt-6 text-[13px] text-ink-2">
                Prefer a 30-min call?{" "}
                <Link
                  href="/book"
                  className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink hover:text-ink transition-colors"
                  data-track="about_cta_book"
                >
                  Book a time
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
        <CTA title='Let&apos;s have conversation' />
      </section>
    </>
  );
}

function FactPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-1.5">
        {label}
      </dt>
      <dd className="text-[15px] text-ink">{value}</dd>
    </div>
  );
}
