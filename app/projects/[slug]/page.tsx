import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/Project";
import { SERVICES } from "@/lib/services";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { CaseStudyJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    await dbConnect();
    const projects = await Project.find({ published: true })
      .select("slug")
      .lean<any[]>();
    return projects.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    await dbConnect();
    const p: any = await Project.findOne({ slug, published: true }).lean();
    if (!p) return { title: "Project not found" };
    const title = `${p.title}${p.client ? ` for ${p.client}` : ""}`;
    const description =
      p.tagline ||
      p.summary?.slice(0, 160) ||
      `${p.title} — a project by aeTech Digital Hub.`;
    return {
      title,
      description,
      alternates: { canonical: `/projects/${slug}` },
      openGraph: {
        title,
        description,
        type: "article",
        url: `/projects/${slug}`,
        images: p.cover
          ? [{ url: p.cover, width: 1200, height: 630, alt: p.title }]
          : undefined,
      },
    };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await dbConnect();
  const p: any = await Project.findOne({ slug, published: true }).lean();
  if (!p) return notFound();

  // Map service slug → name
  const tagFor = (slug: string) => {
    const s = SERVICES.find((x) => x.slug === slug);
    return s ? s.name : slug.replace(/-/g, " ");
  };

  // Find the next published project for footer navigation
  const others: any[] = await Project.find({
    published: true,
    slug: { $ne: slug },
  })
    .sort({ year: -1 })
    .limit(1)
    .lean();
  const nextProject = others[0];

  return (
    <>
      <CaseStudyJsonLd
        title={p.title}
        description={p.tagline || p.summary || ""}
        slug={slug}
        client={p.client}
        year={p.year}
        image={p.cover}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: "Home", href: "/" },
          { name: "Work", href: "/projects" },
          { name: p.title, href: `/projects/${slug}` },
        ]}
      />

      {/* ─────────────────────────────────────────
          BACK LINK + HEADER
          ───────────────────────────────────────── */}
      <section className="container-px pt-24 pb-12 lg:pt-32 lg:pb-16 bg-base">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-12 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              All work
            </Link>

            {/* Year + client + service tags */}
            <div className="flex items-center gap-3 flex-wrap mb-8 text-[12px] font-mono">
              {p.year && (
                <span style={{ color: "var(--brand)" }}>{p.year}</span>
              )}
              {p.client && (
                <>
                  <span className="text-ink-3 opacity-40">·</span>
                  <span className="text-ink-2">{p.client}</span>
                </>
              )}
              {p.services?.length > 0 && (
                <>
                  <span className="text-ink-3 opacity-40">·</span>
                  <span className="text-ink-2 capitalize">
                    {p.services.slice(0, 2).map(tagFor).join(" / ")}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="h-display text-[44px] sm:text-[60px] lg:text-[80px] tracking-tightest mb-7 leading-[0.98]">
              {p.title}
            </h1>

            {/* Tagline */}
            {p.tagline && (
              <p className="text-[18px] lg:text-[22px] text-ink-2 max-w-3xl leading-relaxed font-light">
                {p.tagline}
              </p>
            )}

            {/* Live link */}
            {p.liveUrl && (
              <a
                href={p.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 text-[14px] text-ink hover:text-brand transition-colors"
              >
                Visit live site
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
              </a>
            )}
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          HERO IMAGE — large mockup in tinted card
          ───────────────────────────────────────── */}
      {p.cover && (
        <section className="container-px pb-16 lg:pb-24 bg-base">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div
                className="rounded-3xl overflow-hidden p-6 lg:p-12"
                style={{ background: "#F8F2FB" }}
              >
                <div className="aspect-[16/10] relative rounded-2xl overflow-hidden">
                  <Image
                    src={p.cover}
                    alt={p.title}
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
          OVERVIEW — Summary on left, Facts on right
          ───────────────────────────────────────── */}
      <section className="container-px py-20 lg:py-28 bg-base border-t border-rule">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Left: summary */}
            <div className="lg:col-span-7">
              <Reveal>
                <p className="eyebrow mb-5">Overview</p>
                <p className="text-[18px] lg:text-[20px] text-ink leading-relaxed">
                  {p.summary || p.tagline}
                </p>
              </Reveal>
            </div>

            {/* Right: facts */}
            <div className="lg:col-span-5">
              <Reveal delay={0.1}>
                <dl className="space-y-5">
                  {p.year && <FactRow label="Year" value={String(p.year)} />}
                  {p.client && <FactRow label="Client" value={p.client} />}
                  {p.services?.length > 0 && (
                    <FactRow
                      label="Services"
                      value={p.services.map(tagFor).join(", ")}
                    />
                  )}
                  {p.techStack?.length > 0 && (
                    <FactRow
                      label="Stack"
                      value={p.techStack.slice(0, 6).join(" · ")}
                    />
                  )}
                </dl>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          CHALLENGE — tinted section
          ───────────────────────────────────────── */}
      {p.challenge && (
        <section className="container-px py-24 lg:py-32 bg-tint-1 border-t border-rule">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow mb-4">Challenge</p>
                  <h2 className="h-display text-[28px] lg:text-[36px] tracking-tighter">
                    What we walked into.
                  </h2>
                </Reveal>
              </div>
              <div className="lg:col-span-8">
                <Reveal delay={0.1}>
                  <p className="text-[17px] lg:text-[19px] text-ink leading-relaxed whitespace-pre-line">
                    {p.challenge}
                  </p>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────
          APPROACH — base bg, alternating
          ───────────────────────────────────────── */}
      {p.approach && (
        <section className="container-px py-24 lg:py-32 bg-base border-t border-rule">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow mb-4">Approach</p>
                  <h2 className="h-display text-[28px] lg:text-[36px] tracking-tighter">
                    What we did.
                  </h2>
                </Reveal>
              </div>
              <div className="lg:col-span-8">
                <Reveal delay={0.1}>
                  <p className="text-[17px] lg:text-[19px] text-ink leading-relaxed whitespace-pre-line">
                    {p.approach}
                  </p>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────
          OUTCOME + METRICS — tinted again
          ───────────────────────────────────────── */}
      {(p.outcome || p.metrics?.length > 0) && (
        <section className="container-px py-24 lg:py-32 bg-tint-2 border-t border-rule">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <p className="eyebrow mb-4">Outcome</p>
              <h2 className="h-display text-[28px] lg:text-[36px] tracking-tighter mb-10 lg:mb-14">
                What we shipped.
              </h2>
            </Reveal>

            {p.outcome && (
              <Reveal delay={0.1}>
                <p className="text-[17px] lg:text-[19px] text-ink leading-relaxed whitespace-pre-line max-w-3xl mb-12 lg:mb-16">
                  {p.outcome}
                </p>
              </Reveal>
            )}

            {p.metrics?.length > 0 && (
              <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                {p.metrics.map(
                  (m: { label: string; value: string }, i: number) => (
                    <StaggerItem key={i}>
                      <div className="bg-white rounded-2xl border border-rule p-6 lg:p-8 h-full">
                        <p
                          className="h-display text-[36px] lg:text-[44px] tracking-tighter mb-2 leading-none"
                          style={{ color: "var(--brand)" }}
                        >
                          {m.value}
                        </p>
                        <p className="text-[13px] text-ink-2 leading-snug">
                          {m.label}
                        </p>
                      </div>
                    </StaggerItem>
                  ),
                )}
              </StaggerReveal>
            )}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────
          TECH STACK
          ───────────────────────────────────────── */}
      {p.techStack?.length > 0 && (
        <section className="container-px py-20 lg:py-24 bg-base border-t border-rule">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <p className="eyebrow mb-6">Built with</p>
              <div className="flex items-center gap-2 flex-wrap">
                {p.techStack.map((t: string) => (
                  <span
                    key={t}
                    className="px-3.5 py-1.5 rounded-full bg-white border border-rule text-[13px] font-mono text-ink-2"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────
          NEXT PROJECT
          ───────────────────────────────────────── */}
      {nextProject && (
        <section className="container-px py-20 lg:py-28 bg-base border-t border-rule">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <Link
                href={`/projects/${nextProject.slug}`}
                className="group block rounded-3xl border border-rule overflow-hidden lift"
                style={{ background: "#F8F2FB" }}
              >
                <div className="grid lg:grid-cols-2 items-center">
                  <div className="px-8 sm:px-12 lg:px-16 py-12 lg:py-16">
                    <p className="eyebrow mb-4">Next project</p>
                    <h3 className="h-display text-[28px] lg:text-[36px] tracking-tighter mb-3">
                      {nextProject.title}
                    </h3>
                    {nextProject.tagline && (
                      <p className="text-[15px] text-ink-2 leading-relaxed max-w-md mb-6 line-clamp-2">
                        {nextProject.tagline}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink group-hover:text-brand transition-colors">
                      Read case study
                      <ArrowUpRight
                        className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        strokeWidth={2}
                      />
                    </span>
                  </div>
                  {nextProject.cover && (
                    <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[320px]">
                      <Image
                        src={nextProject.cover}
                        alt={nextProject.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover cine-image"
                      />
                    </div>
                  )}
                </div>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────
          CTA
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 bg-base border-t border-rule">
        <Reveal>
          <SpotlightCard
            className="overflow-hidden rounded-3xl border border-rule grid lg:grid-cols-2 max-w-7xl mx-auto"
            spotlightColor="rgba(45, 13, 80, 0.18)"
            style={{ background: "#F8F2FB" }}
          >
            <div className="px-8 sm:px-12 lg:px-16 py-14 lg:py-20 flex flex-col justify-center order-2 lg:order-1">
              <p className="eyebrow mb-5">Like what you see?</p>
              <h2 className="h-display text-[36px] lg:text-[52px] tracking-tightest mb-5 leading-[1.02]">
                Let&apos;s build
                <br />
                <span className="italic font-light gradient-text">
                  yours next.
                </span>
              </h2>
              <p className="text-[16px] lg:text-[17px] text-ink-2 mb-9 leading-relaxed max-w-md">
                Tell us a little about your project. We&apos;ll come back with a
                written scope and an honest estimate within 48 hours.
              </p>

              <div>
                <Link
                  href="/start-project"
                  className="btn-primary lift"
                  data-track={`project_${slug}_cta`}
                >
                  Start a project
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>

              <p className="mt-6 text-[13px] text-ink-2">
                Want to write it down properly?{" "}
                <Link
                  href="/brief/guide"
                  className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink hover:text-ink transition-colors"
                  data-track={`project_${slug}_cta_brief`}
                >
                  Use the detailed brief
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
        </Reveal>
      </section>
    </>
  );
}

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
