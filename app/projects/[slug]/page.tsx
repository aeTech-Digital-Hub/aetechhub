import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  Layers,
} from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/Project";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;

type Metric = { label: string; value: string };
type ProjectLean = {
  _id: string;
  slug: string;
  title: string;
  tagline?: string;
  summary?: string;
  client?: string;
  year?: number;
  timeline?: string;
  engagementType?: string;
  discipline?: string;
  services?: string[];
  techStack?: string[];
  cover?: string;
  gallery?: string[];
  challenge?: string;
  approach?: string;
  outcome?: string;
  metrics?: Metric[];
  liveUrl?: string;
  featured?: boolean;
  published?: boolean;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Defensive query — uses `$ne: false` so legacy projects that were saved
 * before the `published` field existed (undefined) still render.
 * Logs on miss so 404s are diagnosable from server logs.
 */
async function getProject(slug: string): Promise<ProjectLean | null> {
  try {
    await dbConnect();
    const doc = await Project.findOne({
      slug,
      published: { $ne: false },
    }).lean<ProjectLean>();

    if (!doc) {
      console.warn(
        `[project/${slug}] not found — check slug spelling, case, or published=false state`,
      );
    }
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  } catch (err) {
    console.error(`[project/${slug}] query failed:`, err);
    return null;
  }
}

async function getRelated(currentSlug: string): Promise<ProjectLean[]> {
  try {
    await dbConnect();
    const items = await Project.find({
      slug: { $ne: currentSlug },
      published: { $ne: false },
    })
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .limit(3)
      .lean<ProjectLean[]>();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return { title: "Project not found" };
  return {
    title: p.title,
    description:
      p.tagline ||
      p.summary ||
      `Case study from aeTech Digital Hub — ${p.title}`,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: p.title,
      description: p.tagline || p.summary,
      images: p.cover ? [{ url: p.cover }] : undefined,
      type: "article",
      publishedTime: p.publishedAt
        ? new Date(p.publishedAt).toISOString()
        : undefined,
    },
  };
}

function ProseSection({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  if (!text?.trim()) return null;
  const blocks = text.split(/\n\n+/).filter((b) => b.trim());

  return (
    <section className="container-px pb-14 lg:pb-20 bg-base">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="h-display text-[28px] lg:text-[36px] tracking-tighter mb-8 leading-[1.1]">
            {title}
          </h2>
          <div className="space-y-6">
            {blocks.map((block, i) => {
              if (block.startsWith("## ")) {
                return (
                  <h3
                    key={i}
                    className="h-display text-[22px] lg:text-[26px] tracking-tighter mt-8 mb-1"
                  >
                    {block.slice(3)}
                  </h3>
                );
              }
              if (block.startsWith("### ")) {
                return (
                  <h4
                    key={i}
                    className="h-display text-[18px] lg:text-[20px] tracking-tight mt-6 mb-1"
                  >
                    {block.slice(4)}
                  </h4>
                );
              }
              if (/^[-*] /m.test(block)) {
                const items = block
                  .split("\n")
                  .filter((l) => /^[-*] /.test(l))
                  .map((l) => l.replace(/^[-*] /, ""));
                return (
                  <ul key={i} className="space-y-2 pl-1">
                    {items.map((it, j) => (
                      <li
                        key={j}
                        className="flex gap-3 text-[15.5px] lg:text-[16.5px] text-ink-2 leading-relaxed"
                      >
                        <span
                          style={{ color: "var(--brand)" }}
                          className="font-bold flex-shrink-0"
                        >
                          ·
                        </span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              if (block.startsWith("> ")) {
                return (
                  <blockquote
                    key={i}
                    className="border-l-2 pl-5 py-1 italic text-[16px] lg:text-[17px] text-ink-2"
                    style={{ borderColor: "var(--brand)" }}
                  >
                    {block.slice(2)}
                  </blockquote>
                );
              }
              return (
                <p
                  key={i}
                  className="text-[15.5px] lg:text-[16.5px] text-ink-2 leading-relaxed"
                >
                  {block}
                </p>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, related] = await Promise.all([
    getProject(slug),
    getRelated(slug),
  ]);

  if (!project) notFound();

  const hasEngagementMeta =
    project.client ||
    project.year ||
    project.timeline ||
    project.engagementType ||
    project.discipline;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Projects", href: "/projects" },
          { name: project.title, href: `/projects/${slug}` },
        ]}
      />

      {/* HEADER */}
      <section className="container-px pt-28 pb-6 lg:pt-36 lg:pb-8 bg-base">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              All projects
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              {project.discipline && (
                <span
                  className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded"
                  style={{
                    background: "var(--brand-100)",
                    color: "var(--brand)",
                  }}
                >
                  {project.discipline}
                </span>
              )}
              {project.client && (
                <span className="text-[11px] font-mono text-ink-3">
                  {project.client}
                </span>
              )}
              {(project.timeline || project.year) && (
                <span className="text-[11px] font-mono text-ink-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" strokeWidth={2} />
                  {project.timeline || project.year}
                </span>
              )}
              {project.engagementType && (
                <span className="text-[11px] font-mono text-ink-3">
                  · {project.engagementType}
                </span>
              )}
            </div>

            <h1 className="h-display text-[40px] sm:text-[52px] lg:text-[68px] tracking-tightest leading-[0.98] mb-5">
              {project.title}
            </h1>

            {project.tagline && (
              <p
                className="text-[19px] lg:text-[24px] font-light mb-6 max-w-2xl leading-tight"
                style={{ color: "var(--brand)" }}
              >
                {project.tagline}
              </p>
            )}

            {project.summary && (
              <p className="text-[16px] lg:text-[18px] text-ink-2 leading-relaxed max-w-2xl">
                {project.summary}
              </p>
            )}

            {project.liveUrl && (
              <div className="mt-8">
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex !py-2.5 !text-sm"
                >
                  Visit live site
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                </a>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* HERO IMAGE */}
      {project.cover && (
        <section className="container-px pb-12 lg:pb-16 bg-base">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div
                className="aspect-[16/9] rounded-2xl overflow-hidden relative"
                style={{ background: "var(--brand-50)" }}
              >
                <Image
                  src={project.cover}
                  alt={project.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  className="object-cover"
                  priority
                />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ENGAGEMENT META STRIP */}
      {hasEngagementMeta && (
        <section className="container-px pb-14 lg:pb-20 bg-base">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8 border-y border-rule">
                {project.client && (
                  <MetaItem label="Client" value={project.client} />
                )}
                {(project.timeline || project.year) && (
                  <MetaItem
                    label="Timeline"
                    value={project.timeline || String(project.year)}
                  />
                )}
                {project.engagementType && (
                  <MetaItem label="Engagement" value={project.engagementType} />
                )}
                {project.discipline && (
                  <MetaItem label="Discipline" value={project.discipline} />
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* CHALLENGE */}
      <ProseSection
        eyebrow="The challenge"
        title="What we set out to solve."
        text={project.challenge}
      />

      {/* APPROACH */}
      <ProseSection
        eyebrow="Our approach"
        title="How we thought about it."
        text={project.approach}
      />

      {/* METRICS */}
      {project.metrics && project.metrics.length > 0 && (
        <section className="container-px py-14 lg:py-20 bg-tint-1 border-y border-rule">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="text-center mb-10">
                <p className="eyebrow mb-3">By the numbers</p>
                <h2 className="h-display text-[26px] lg:text-[36px] tracking-tighter">
                  Outcomes, measured.
                </h2>
              </div>
            </Reveal>

            <StaggerReveal
              className={`grid gap-6 ${
                project.metrics.length === 2
                  ? "sm:grid-cols-2 max-w-3xl mx-auto"
                  : project.metrics.length === 3
                    ? "sm:grid-cols-3"
                    : "sm:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {project.metrics.map((m, i) => (
                <StaggerItem key={i}>
                  <div className="text-center px-4 py-8 rounded-2xl border border-rule bg-white h-full">
                    <p
                      className="h-display text-[36px] lg:text-[48px] tracking-tighter leading-none mb-2"
                      style={{ color: "var(--brand)" }}
                    >
                      {m.value}
                    </p>
                    <p className="text-[12px] font-mono uppercase tracking-wider text-ink-3">
                      {m.label}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </div>
        </section>
      )}

      {/* OUTCOME */}
      <ProseSection
        eyebrow="The outcome"
        title="What shipped."
        text={project.outcome}
      />

      {/* GALLERY */}
      {project.gallery && project.gallery.length > 0 && (
        <section className="container-px pb-16 lg:pb-24 bg-base">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="mb-8">
                <p className="eyebrow mb-3">In the making</p>
                <h2 className="h-display text-[24px] lg:text-[30px] tracking-tighter">
                  Selected screens.
                </h2>
              </div>
            </Reveal>

            <StaggerReveal className="grid sm:grid-cols-2 gap-5 lg:gap-6">
              {project.gallery.map((url, i) => (
                <StaggerItem key={`${url}-${i}`}>
                  <div
                    className="aspect-[4/3] rounded-2xl overflow-hidden relative border border-rule"
                    style={{ background: "var(--brand-50)" }}
                  >
                    <Image
                      src={url}
                      alt={`${project.title} — ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </div>
        </section>
      )}

      {/* TECH STACK + SERVICES */}
      {((project.techStack && project.techStack.length > 0) ||
        (project.services && project.services.length > 0)) && (
        <section className="container-px pb-16 lg:pb-24 bg-base">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="rounded-2xl border border-rule bg-white p-6 lg:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <Layers
                    className="w-3.5 h-3.5"
                    strokeWidth={2}
                    style={{ color: "var(--brand)" }}
                  />
                  <p className="eyebrow" style={{ color: "var(--brand)" }}>
                    What we used
                  </p>
                </div>

                {project.services && project.services.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-3">
                      Services
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.services.map((s) => (
                        <span
                          key={s}
                          className="text-[12.5px] px-3 py-1 rounded-md"
                          style={{
                            background: "var(--brand-100)",
                            color: "var(--brand)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.techStack && project.techStack.length > 0 && (
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-3">
                      Stack
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((t) => (
                        <span
                          key={t}
                          className="text-[12.5px] px-3 py-1 rounded-md bg-tint-1 border border-rule text-ink"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container-px py-20 lg:py-28 bg-tint-1 border-y border-rule">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <p className="eyebrow mb-4">Working on something similar?</p>
            <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter mb-6 leading-tight">
              Let&apos;s talk about your{" "}
              <span className="italic font-light gradient-text">project.</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/start-project" className="btn-primary">
                Start a project
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
              <Link href="/book" className="btn-ghost">
                Book a call
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="container-px pb-32 lg:pb-40 bg-base">
          <div className="max-w-6xl mx-auto pt-16 lg:pt-24">
            <Reveal>
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <p className="eyebrow mb-3">More work</p>
                  <h2 className="h-display text-[24px] lg:text-[30px] tracking-tighter">
                    Related case studies.
                  </h2>
                </div>
                <Link
                  href="/projects"
                  className="text-[13px] link-brand inline-flex items-center gap-1.5"
                >
                  All projects
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {related.map((r) => (
                <Link
                  key={r._id}
                  href={`/projects/${r.slug}`}
                  className="group block border border-rule rounded-2xl bg-white lift overflow-hidden"
                >
                  <div className="p-4">
                    <div
                      className="aspect-[4/3] rounded-xl relative overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--brand-50) 0%, var(--brand-100) 100%)",
                      }}
                    >
                      {r.cover ? (
                        <Image
                          src={r.cover}
                          alt={r.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center">
                          <span
                            className="h-display text-5xl float-slow opacity-30"
                            style={{ color: "var(--brand)" }}
                          >
                            {r.discipline?.charAt(0)?.toUpperCase() || "P"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                      {r.discipline && (
                        <span
                          className="text-[10px] font-mono uppercase tracking-wider"
                          style={{ color: "var(--brand)" }}
                        >
                          {r.discipline}
                        </span>
                      )}
                      {r.client && (
                        <>
                          <span className="text-[10px] font-mono text-ink-3">
                            ·
                          </span>
                          <span className="text-[10px] font-mono text-ink-3">
                            {r.client}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="h-display text-[17px] tracking-tight leading-tight mb-1 group-hover:text-brand transition-colors">
                      {r.title}
                    </h3>
                    {r.tagline && (
                      <p className="text-[12.5px] text-ink-2 italic leading-relaxed line-clamp-2">
                        {r.tagline}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-1.5">
        {label}
      </p>
      <p className="text-[14px] lg:text-[15px] text-ink font-medium leading-tight">
        {value}
      </p>
    </div>
  );
}
