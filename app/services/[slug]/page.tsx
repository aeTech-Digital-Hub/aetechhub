import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { SERVICES, type ServiceTier } from "@/lib/services";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { CTA, italicAccent } from "@/components/marketing/CTA";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const revalidate = 3600;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = SERVICES.find((x) => x.slug === slug);
  if (!s) return { title: "Service not found" };
  return {
    title: s.name,
    description: s.description.slice(0, 160),
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      title: `${s.name} · aeTech Digital Hub`,
      description: s.description,
      url: `/services/${slug}`,
      type: "website",
      images: s.photo
        ? [{ url: s.photo, width: 1200, height: 630, alt: s.name }]
        : undefined,
    },
  };
}

const CATEGORY_LABEL: Record<string, string> = {
  build: "Build",
  data: "Data",
  security: "Security",
};

export default async function ServiceDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = SERVICES.find((x) => x.slug === slug);
  if (!s) return notFound();

  const idx = SERVICES.findIndex((x) => x.slug === slug);
  const num = String(idx + 1).padStart(2, "0");

  // 3 other services for the bottom grid (skip this one)
  const others = SERVICES.filter((x) => x.slug !== s.slug).slice(0, 3);

  return (
    <>
      <ServiceJsonLd
        name={s.name}
        description={s.description}
        slug={s.slug}
        startingFromUsd={s.startingFromUsd}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: s.name, href: `/services/${s.slug}` },
        ]}
      />

      {/* ─────────────────────────────────────────
          HERO — back link, meta, title, lead, CTAs
          ───────────────────────────────────────── */}
      <section className="container-px pt-24 pb-12 lg:pt-32 lg:pb-16 bg-base">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-12 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              All services
            </Link>

            {/* Meta line */}
            <div className="flex items-center gap-3 flex-wrap mb-8 text-[12px] font-mono">
              <span style={{ color: "var(--brand)" }}>{num}</span>
              <span className="text-ink-3 opacity-40">·</span>
              <span className="text-ink-2">{CATEGORY_LABEL[s.category]}</span>
              {s.startingFromUsd && (
                <>
                  <span className="text-ink-3 opacity-40">·</span>
                  <span className="text-ink-2">
                    From ${s.startingFromUsd.toLocaleString()}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="h-display text-[44px] sm:text-[60px] lg:text-[76px] tracking-tightest mb-6 leading-[0.98]">
              {s.name}
            </h1>

            {/* Lead — the descriptive long-form copy */}
            <p className="text-[18px] lg:text-[22px] text-ink-2 max-w-3xl leading-relaxed font-light mb-10">
              {s.description}
            </p>

            {/* Primary action + secondary text link */}
            <div>
              <Link
                href={`/start-project?service=${s.slug}`}
                className="btn-primary lift"
                data-track={`service_${s.slug}_start`}
              >
                Start a project
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
              <p className="mt-5 text-[13px] text-ink-2">
                Or{" "}
                <Link
                  href="/book"
                  className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink transition-colors"
                  data-track={`service_${s.slug}_book`}
                >
                  book a 30-min call
                </Link>{" "}
                to talk it through.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          HERO IMAGE — Hims-padded photo card
          ───────────────────────────────────────── */}
      {s.photo && (
        <section className="container-px pb-16 lg:pb-24 bg-base">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div
                className="rounded-3xl overflow-hidden p-6 lg:p-12"
                style={{ background: "#F8F2FB" }}
              >
                <div className="aspect-[16/10] relative rounded-2xl overflow-hidden">
                  <Image
                    src={s.photo}
                    alt={s.name}
                    fill
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────
          OVERVIEW — short on left, facts on right
          ───────────────────────────────────────── */}
      <section className="container-px py-20 lg:py-28 bg-base border-t border-rule">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-7">
              <Reveal>
                <p className="eyebrow mb-5">Overview</p>
                <p className="text-[18px] lg:text-[20px] text-ink leading-relaxed">
                  {s.short}
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={0.1}>
                <dl className="space-y-5">
                  <FactRow
                    label="Discipline"
                    value={CATEGORY_LABEL[s.category]}
                  />
                  {s.startingFromUsd && (
                    <FactRow
                      label="Starts from"
                      value={`$${s.startingFromUsd.toLocaleString()} USD`}
                    />
                  )}
                  <FactRow label="Senior-led" value="Always" />
                  <FactRow
                    label="Post-launch support"
                    value="30 days included"
                  />
                </dl>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          WHAT YOU GET — tinted, 33/66 split
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 bg-tint-1 border-t border-rule">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="eyebrow mb-4">What you get</p>
                <h2 className="h-display text-[28px] lg:text-[36px] tracking-tighter">
                  Everything we ship.
                </h2>
              </Reveal>
            </div>

            <div className="lg:col-span-8">
              <StaggerReveal className="space-y-0">
                {s.whatYouGet.map((item, i) => (
                  <StaggerItem key={item}>
                    <div
                      className={`grid grid-cols-[24px_1fr] gap-5 py-5 lg:py-6 ${
                        i !== s.whatYouGet.length - 1
                          ? "border-b border-rule"
                          : ""
                      }`}
                    >
                      <CheckCircle2
                        className="w-5 h-5 mt-0.5"
                        strokeWidth={1.75}
                        style={{ color: "var(--brand)" }}
                      />
                      <p className="text-[15px] lg:text-[17px] text-ink leading-relaxed">
                        {item}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          IDEAL FOR — base bg, alternating, pill row
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 bg-base border-t border-rule">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="eyebrow mb-4">Ideal for</p>
                <h2 className="h-display text-[28px] lg:text-[36px] tracking-tighter">
                  Who this is for.
                </h2>
              </Reveal>
            </div>

            <div className="lg:col-span-8">
              <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {s.idealFor.map((item) => (
                  <StaggerItem key={item}>
                    <div className="border border-rule rounded-2xl bg-white p-5 lg:p-6 h-full">
                      <p className="text-[15px] text-ink leading-relaxed">
                        {item}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          PRICING — three tiers (Basic / Standard / Enterprise)
          ───────────────────────────────────────── */}
      {s.tiers && s.tiers.length > 0 && (
        <section className="container-px py-24 lg:py-32 bg-tint-2 border-t border-rule">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="max-w-2xl mb-12 lg:mb-16">
                <p className="eyebrow mb-4">Investment</p>
                <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter mb-4">
                  Three ways to start.
                </h2>
                <p className="text-[15px] lg:text-[16px] text-ink-2 leading-relaxed max-w-xl">
                  Choose the tier closest to your scope — we&apos;ll confirm the
                  exact fit on a discovery call. All prices are fixed-fee in
                  USD; we never bill by the hour for delivery work.
                </p>
              </div>
            </Reveal>

            <StaggerReveal className="grid lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
              {s.tiers.map((t) => (
                <StaggerItem key={t.name}>
                  <TierCard tier={t} serviceSlug={s.slug} />
                </StaggerItem>
              ))}
            </StaggerReveal>

            {/* Disclaimer footer */}
            <Reveal delay={0.3}>
              <p className="text-[12.5px] text-ink-3 mt-10 lg:mt-14 leading-relaxed text-center max-w-2xl mx-auto">
                Prices in USD; we accept GHS at today&apos;s rate. Final scope
                is always confirmed in writing before any contract is signed.
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────
          OTHER SERVICES — small grid of remaining 3
          ───────────────────────────────────────── */}
      <section className="container-px py-20 lg:py-28 bg-base border-t border-rule">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex items-end justify-between flex-wrap gap-6 mb-10 lg:mb-14">
              <div>
                <p className="eyebrow mb-4">Other services</p>
                <h2 className="h-display text-[28px] lg:text-[36px] tracking-tighter">
                  More we do.
                </h2>
              </div>
              <Link
                href="/services"
                className="text-[14px] inline-flex items-center gap-1.5 link-brand pb-1"
              >
                All services
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
            </div>
          </Reveal>

          <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {others.map((o) => {
              const oIdx = SERVICES.findIndex((x) => x.slug === o.slug);
              const oNum = String(oIdx + 1).padStart(2, "0");
              return (
                <StaggerItem key={o.slug}>
                  <Link
                    href={`/services/${o.slug}`}
                    className="group block h-full"
                  >
                    <SpotlightCard
                      className="border border-rule rounded-2xl bg-white p-6 lg:p-7 lift h-full flex flex-col"
                      spotlightColor="rgba(45, 13, 80, 0.10)"
                    >
                      <div className="flex items-start justify-between mb-5">
                        <span
                          className="font-mono text-[12px] tracking-wider"
                          style={{ color: "var(--brand)" }}
                        >
                          {oNum}
                        </span>
                        <ArrowUpRight
                          className="w-4 h-4 text-ink-3 group-hover:text-brand transition-colors"
                          strokeWidth={2}
                        />
                      </div>

                      <h3 className="h-display text-[20px] tracking-tight mb-2 leading-tight">
                        {o.name}
                      </h3>
                      <p className="text-[14px] text-ink-2 leading-relaxed line-clamp-3 flex-1">
                        {o.short}
                      </p>
                    </SpotlightCard>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerReveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          CTA — reusable component
          ───────────────────────────────────────── */}
      <CTA
        eyebrow="Considering us?"
        title={<>Let&apos;s build {italicAccent("it together.")}</>}
        description={`Tell us a little about your project. We'll come back with a written scope and an honest estimate within 48 hours.`}
        primaryHref={`/start-project?service=${s.slug}`}
        primaryLabel="Start a project"
        secondaryText="Want to write it down properly?"
        secondaryHref="/brief/guide"
        secondaryLabel="Use the detailed brief"
        primaryTrack={`service_${s.slug}_cta_start`}
        secondaryTrack={`service_${s.slug}_cta_brief`}
      />
    </>
  );
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-rule">
      <dt className="text-[12px] font-mono uppercase tracking-wider text-ink-3 flex-shrink-0">
        {label}
      </dt>
      <dd className="text-[14px] text-ink text-right">{value}</dd>
    </div>
  );
}

function TierCard({
  tier,
  serviceSlug,
}: {
  tier: ServiceTier;
  serviceSlug: string;
}) {
  const isHighlighted = tier.highlighted;
  const isCustom = tier.priceUsd === null;

  return (
    <div
      className={`
        rounded-2xl p-7 lg:p-8 h-full flex flex-col
        ${
          isHighlighted
            ? "bg-ink text-white shadow-[0_24px_60px_-12px_rgba(45,13,80,0.30)]"
            : "bg-white border border-rule"
        }
      `}
    >
      {/* Header — name + recommended badge */}
      <div className="flex items-start justify-between mb-3">
        <p
          className="font-mono text-[12px] tracking-wider"
          style={{ color: isHighlighted ? "#E0B6FF" : "var(--brand)" }}
        >
          {tier.name}
        </p>
        {isHighlighted && (
          <span
            className="font-mono text-[10.5px] px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(224, 182, 255, 0.15)",
              color: "#E0B6FF",
            }}
          >
            Recommended
          </span>
        )}
      </div>

      {/* Tagline */}
      <h3
        className={`h-display text-[22px] lg:text-[24px] tracking-tight mb-2 leading-tight ${
          isHighlighted ? "text-white" : "text-ink"
        }`}
      >
        {tier.tagline}
      </h3>

      {/* Ideal for */}
      {tier.idealFor && (
        <p
          className={`text-[13px] leading-relaxed mb-7 ${
            isHighlighted ? "text-white/70" : "text-ink-2"
          }`}
        >
          {tier.idealFor}
        </p>
      )}

      {/* Price */}
      <div
        className={`pb-6 mb-6 border-b ${isHighlighted ? "border-white/15" : "border-rule"}`}
      >
        {isCustom ? (
          <p
            className={`h-display text-[40px] lg:text-[48px] tracking-tightest leading-none ${
              isHighlighted ? "text-white" : "text-ink"
            }`}
          >
            Custom
          </p>
        ) : (
          <div className="flex items-baseline gap-2">
            <span
              className={`text-[14px] ${isHighlighted ? "text-white/60" : "text-ink-3"}`}
            >
              From
            </span>
            <span
              className={`h-display text-[40px] lg:text-[48px] tracking-tightest leading-none ${
                isHighlighted ? "text-white" : ""
              }`}
              style={{ color: isHighlighted ? "#fff" : "var(--brand)" }}
            >
              ${tier.priceUsd!.toLocaleString()}
            </span>
          </div>
        )}
        {tier.duration && (
          <p
            className={`text-[12px] mt-3 ${
              isHighlighted ? "text-white/60" : "text-ink-3"
            }`}
          >
            {tier.duration}
          </p>
        )}
        {tier.priceNote && (
          <p
            className={`text-[12px] mt-3 leading-relaxed ${
              isHighlighted ? "text-white/60" : "text-ink-3"
            }`}
          >
            {tier.priceNote}
          </p>
        )}
      </div>

      {/* Includes */}
      <div className="flex-1 mb-7">
        <p
          className={`text-[11px] font-mono uppercase tracking-wider mb-4 ${
            isHighlighted ? "text-white/60" : "text-ink-3"
          }`}
        >
          Includes
        </p>
        <ul className="space-y-2.5">
          {tier.includes.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircle2
                className="w-3.5 h-3.5 flex-shrink-0 mt-1"
                strokeWidth={2}
                style={{
                  color: isHighlighted ? "#E0B6FF" : "var(--brand)",
                }}
              />
              <span
                className={`text-[13.5px] leading-relaxed ${
                  isHighlighted ? "text-white/85" : "text-ink"
                }`}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Excludes (only if present) */}
      {tier.excludes && tier.excludes.length > 0 && (
        <div
          className={`pt-5 mb-7 border-t ${isHighlighted ? "border-white/15" : "border-rule"}`}
        >
          <p
            className={`text-[11px] font-mono uppercase tracking-wider mb-3 ${
              isHighlighted ? "text-white/60" : "text-ink-3"
            }`}
          >
            Not included
          </p>
          <ul className="space-y-2">
            {tier.excludes.map((item) => (
              <li
                key={item}
                className={`text-[12.5px] leading-relaxed pl-5 relative ${
                  isHighlighted ? "text-white/55" : "text-ink-3"
                }`}
              >
                <span className="absolute left-0 top-0">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA — anchored at the bottom */}
      <Link
        href={
          isCustom
            ? `/book?service=${serviceSlug}&tier=${tier.name.toLowerCase()}`
            : `/start-project?service=${serviceSlug}&tier=${tier.name.toLowerCase()}`
        }
        className={`
          inline-flex items-center justify-center gap-2 w-full
          px-5 py-3 rounded-lg text-[14px] font-medium
          transition-all
          ${
            isHighlighted
              ? "bg-white text-ink hover:bg-white/90"
              : "bg-ink text-white hover:bg-ink/90"
          }
        `}
        data-track={`tier_${serviceSlug}_${tier.name.toLowerCase()}`}
      >
        {isCustom ? "Talk to us" : "Start with this tier"}
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </Link>
    </div>
  );
}
