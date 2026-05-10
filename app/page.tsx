import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/Project";
import { SERVICES } from "@/lib/services";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { CapabilityMarquee } from "@/components/motion/CapabilityMarquee";
import { HeroBackdrop } from "@/components/motion/HeroBackdrop";
import { CTA, italicAccent } from "@/components/marketing/CTA";
import { Testimonials } from "@/components/marketing/Testimonials";
import { FAQs } from "@/components/marketing/FAQs";
import { FaqJsonLd } from "@/components/seo/JsonLd";
import { FAQS } from "@/lib/faqs";
import { HowToStart } from "@/components/marketing/HowToStart";

export const revalidate = 3600;

async function getData() {
  try {
    await dbConnect();
    const projects = await Project.find({ published: true, featured: true })
      .sort({ year: -1 })
      .limit(2)
      .lean();
    return { projects };
  } catch {
    return { projects: [] };
  }
}

export default async function HomePage() {
  const { projects } = await getData();

  return (
    <>
      <FaqJsonLd items={FAQS} />
      {/* ─────────────────────────────────────────
          HERO
          ───────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-rule bg-base">
        <HeroBackdrop />

        <div className="container-px relative">
          <div className="max-w-3xl mx-auto text-center pt-28 pb-32 lg:pt-40 lg:pb-44">
            <div className="fade-in mb-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-rule bg-white/60 backdrop-blur-sm">
              <span
                className="status-dot w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--brand)" }}
              />
              <span className="text-[12px] font-mono tracking-wide text-ink-2">
                Available for projects · 
              </span>
            </div>

            <h1 className="h-display fade-in-2 text-[42px] sm:text-[56px] lg:text-[72px] tracking-tightest mb-7 leading-[1.02]">
              Software,{" "}
              <span className="font-light gradient-text">
                built right
              </span>
              <br />
              the first time.
            </h1>

            <p className="fade-in-3 text-[17px] lg:text-[19px] text-ink-2 max-w-xl mx-auto mb-10 leading-relaxed">
              We design and build websites, SaaS platforms, and the systems
              beneath them — for teams that need it done by senior engineers,
              end to end.
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
                  see what we&apos;ve been building
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--bg))",
          }}
        />
      </section>

      {/* ─────────────────────────────────────────
          CAPABILITY MARQUEE
          ───────────────────────────────────────── */}
      <section className="bg-base border-t border-rule/60">
        <div className="container-px py-8 max-w-7xl mx-auto">
          <CapabilityMarquee />
        </div>
      </section>

      {/* ─────────────────────────────────────────
          TRUST STRIP
          ───────────────────────────────────────── */}
      <section className="container-px py-12 lg:py-16 border-b border-rule bg-base">
        <Reveal>
          <p className="eyebrow text-center mb-7">
            Trusted by founders shipping in Ghana, Nigeria, the US, and the UK
          </p>
        </Reveal>

        <StaggerReveal
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 lg:gap-x-16"
          staggerDelay={0.04}
        >
          {[
            "Black Cowry",
            "Malawi Village",
            "SmileBaba Hub",
            "Viola Beauty",
            "Spintex Flower Port",
          ].map((c) => (
            <StaggerItem key={c} y={8}>
              <span className="text-[15px] font-medium text-ink-2 tracking-tight">
                {c}
              </span>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </section>

      <div className="max-w-7xl mx-auto">
        {/* ─────────────────────────────────────────
            WHAT WE DO
            ───────────────────────────────────────── */}
        <section className="container-px py-24 lg:py-32 border-b border-rule bg-tint-1">
          <Reveal>
            <div className="max-w-2xl mb-12 lg:mb-16">
              <p className="eyebrow mb-4">What we do</p>
              <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter">
                Three disciplines. One hub.
              </h2>
              <p className="text-[16px] lg:text-[17px] text-ink-2 mt-4 max-w-xl leading-relaxed">
                We have intentionally narrow expertise. Inside that envelope, we
                go deep — no juniors, no offshoring, no template gymnastics.
              </p>
            </div>
          </Reveal>

          <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Build",
                desc: "Custom websites, SaaS platforms, and product surfaces. Modern stacks, no themes, no shortcuts.",
                services: ["web-product", "saas"],
                gradient: "linear-gradient(135deg, #F8F2FB 0%, #EDE3F4 100%)",
                mark: "B",
              },
              {
                title: "Data",
                desc: "Turn your data into decisions. ETL, dashboards, machine learning, and clean APIs.",
                services: ["data-analysis", "machine-learning"],
                gradient: "linear-gradient(135deg, #F4ECFC 0%, #E8D5F5 100%)",
                mark: "D",
              },
              {
                title: "Secure",
                desc: "Architecture reviews and adversarial testing. Find what attackers will find — first.",
                services: ["security-analysis", "penetration-testing"],
                gradient: "linear-gradient(135deg, #EDE3F4 0%, #C8A8DD 100%)",
                mark: "S",
              },
            ].map((p) => (
              <StaggerItem key={p.title}>
                <SpotlightCard
                  className="group block border border-rule rounded-2xl p-4 bg-white lift h-full"
                  spotlightColor="rgba(45, 13, 80, 0.10)"
                >
                  <div
                    className="aspect-[4/3] rounded-xl mb-5 grid place-items-center overflow-hidden relative"
                    style={{ background: p.gradient }}
                  >
                    <span
                      className="h-display text-6xl lg:text-7xl float-slow"
                      style={{ color: "var(--brand)" }}
                    >
                      {p.mark}
                    </span>
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at center, rgba(45,13,80,0.15) 1px, transparent 1px)",
                        backgroundSize: "16px 16px",
                      }}
                    />
                  </div>

                  <div className="px-1">
                    <h3 className="h-display text-[20px] tracking-tight mb-2">
                      {p.title}
                    </h3>
                    <p className="text-[14px] text-ink-2 leading-relaxed mb-4 line-clamp-3">
                      {p.desc}
                    </p>

                    <ul className="space-y-1.5 pt-3 border-t border-rule">
                      {p.services.map((slug) => {
                        const s = SERVICES.find((x) => x.slug === slug);
                        if (!s) return null;
                        return (
                          <li key={slug}>
                            <Link
                              href={`/services/${slug}`}
                              className="inline-flex items-center gap-1.5 text-[13px] link-brand"
                            >
                              {s.name}
                              <ArrowRight
                                className="w-3 h-3 opacity-40"
                                strokeWidth={2}
                              />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </StaggerReveal>

          <Reveal delay={0.2}>
            <div className="mt-10">
              <Link
                href="/services"
                className="text-[14px] inline-flex items-center gap-1.5 link-brand"
              >
                All services
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ─────────────────────────────────────────
            WHY US
            ───────────────────────────────────────── */}
        <section className="container-px py-24 lg:py-32 border-b border-rule bg-base">
          <Reveal>
            <div className="max-w-2xl mb-12 lg:mb-16">
              <p className="eyebrow mb-4">Why us</p>
              <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter">
                Calm engineering, no surprises.
              </h2>
              <p className="text-[16px] lg:text-[17px] text-ink-2 mt-4 max-w-xl leading-relaxed">
                The kind of working relationship you wish you had with every
                team you&apos;ve hired. Steady cadence, real updates, no
                theatre.
              </p>
            </div>
          </Reveal>

          <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                n: "01",
                t: "Senior, end to end",
                d: "The senior who scopes your project is the senior who builds it. No bait-and-switch, no juniors learning on your dime.",
              },
              {
                n: "02",
                t: "Honest scoping",
                d: "We tell you what something costs before you commit. We say no when we are not the right fit.",
              },
              {
                n: "03",
                t: "Weekly demos",
                d: "Real working software at every checkpoint. Nothing is a surprise. No 8-week silence followed by a wall of code.",
              },
              {
                n: "04",
                t: "30 days post-launch",
                d: "We don't disappear after delivery. Documentation, training, and a real human you can call.",
              },
            ].map((p) => (
              <StaggerItem key={p.n}>
                <SpotlightCard
                  className="group block border border-rule rounded-2xl p-5 bg-white lift h-full"
                  spotlightColor="rgba(45, 13, 80, 0.08)"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className="font-mono text-[12px] tracking-wider"
                      style={{ color: "var(--brand)" }}
                    >
                      {p.n}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full pulse-soft"
                      style={{ background: "var(--brand)" }}
                    />
                  </div>

                  <h3 className="font-medium text-[15px] tracking-tight mb-2 text-ink">
                    {p.t}
                  </h3>
                  <p className="text-[13px] text-ink-2 leading-relaxed">
                    {p.d}
                  </p>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>
      </div>

      {/* ─────────────────────────────────────────
          RECENT PROJECTS
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 border-b border-rule bg-tint-2">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12 lg:mb-16">
            <div className="max-w-2xl">
              <p className="eyebrow mb-4">Recent projects</p>
              <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter">
                Software we&apos;ve shipped lately.
              </h2>
              <p className="text-[16px] lg:text-[17px] text-ink-2 mt-4 max-w-xl leading-relaxed">
                A dossie, deliberate portfolio. Each one a senior-led engagement
                we still talk to.
              </p>
            </div>

            <Link
              href="/projects"
              className="text-[14px] inline-flex items-center gap-1.5 link-brand pb-1"
            >
              View all projects
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </Reveal>

        <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {[
            {
              slug: "malawi-village",
              title: "Malawi Village",
              eyebrow: "Web & Product",
              desc: "Editorial e-commerce for an artisan beverage brand.",
              client: "Malawi Village",
              year: 2026,
              cover: "/placeholder-1.png",
              bg: "#F8F2FB",
            },
            {
              slug: "smilebaba-hub",
              title: "SmileBaba Hub",
              eyebrow: "SaaS Platform",
              desc: "West Africa's all-in-one digital marketplace.",
              client: "SmileBaba Hub",
              year: 2026,
              cover: "/placeholder-2.png",
              bg: "#F4ECFC",
            },
            {
              slug: "black-cowry",
              title: "Black Cowry",
              eyebrow: "Data & ML",
              desc: "Customer analytics and demand forecasting.",
              client: "Black Cowry",
              year: 2025,
              cover: "/placeholder-3.png",
              bg: "#EDE3F4",
            },
            {
              slug: "testa-brands",
              title: "Testa Brand",
              eyebrow: "Website & Product",
              desc: "Customer analytics and demand forecasting.",
              client: "Testa Brand",
              year: 2026,
              cover: "/placeholder-1.png",
              bg: "#EDE3F4",
            },
          ].map((p) => (
            <StaggerItem key={p.slug}>
              <Link
                href={`/projects/${p.slug}`}
                className="group block rounded-2xl overflow-hidden border border-rule lift h-full"
                data-track={`project_${p.slug}`}
              >
                <div
                  className="relative px-6 lg:px-8 pt-8 pb-6"
                  style={{ background: p.bg }}
                >
                  <div className="aspect-[3/2] relative">
                    <Image
                      src={p.cover}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain cine-image"
                    />
                  </div>
                </div>

                <div className="bg-white px-6 lg:px-7 py-6 lg:py-7">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-mono text-[11px] mb-2 tracking-wide"
                        style={{ color: "var(--brand)" }}
                      >
                        {p.eyebrow}
                      </p>
                      <h3 className="text-[17px] font-medium tracking-tight mb-1.5">
                        {p.title}
                      </h3>
                      <p className="text-[14px] text-ink-2 leading-relaxed line-clamp-2">
                        {p.desc}
                      </p>
                    </div>
                    <ArrowUpRight
                      className="w-4 h-4 text-ink-3 group-hover:text-brand flex-shrink-0 mt-1 transition-colors"
                      strokeWidth={2}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-rule text-[11px] text-ink-3 font-mono">
                    <span>{p.year}</span>
                    <span className="opacity-40">·</span>
                    <span className="truncate">{p.client}</span>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </section>
      
      <Testimonials />

      <HowToStart />

      <FAQs />
      <CTA
        eyebrow="aeTech Studio"
        title={
          <>
            Have a project
            <br />
            in mind?
          </>
        }
        image="/cta-visual.png"
      />
    </>
  );
}
