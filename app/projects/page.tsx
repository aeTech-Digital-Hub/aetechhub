import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/Project";
import { SERVICES } from "@/lib/services";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";

export const revalidate = 3600;

export const metadata = {
  title: "Work",
  description:
    "Our recent works, deliberate portfolio of recent engagements. Each one a senior-led build we still talk to.",
};

async function getProjects() {
  try {
    await dbConnect();
    const docs = await Project.find({ published: true })
      .sort({ year: -1 })
      .lean();
    return JSON.parse(JSON.stringify(docs)) as any[];
  } catch {
    return [];
  }
}

// Soft brand-purple tints for image cards. Cycles through.
const TINTS = ["#F8F2FB", "#F4ECFC", "#EDE3F4", "#E8D5F5"];

export default async function ProjectsPage() {
  const projects = await getProjects();

  // Map service slug → friendly tag label
  const tagFor = (slug: string) => {
    const s = SERVICES.find((x) => x.slug === slug);
    if (s) return s.name.split(" ").slice(0, 2).join(" ");
    return slug.replace(/-/g, " ");
  };

  return (
    <>
      {/* ─────────────────────────────────────────
          PAGE HERO
          ───────────────────────────────────────── */}
      <section className="container-px pt-28 pb-12 lg:pt-36 lg:pb-20 bg-base border-b border-rule">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <p className="eyebrow mb-5">Selected work</p>
            <h1 className="h-display text-[44px] sm:text-[56px] lg:text-[72px] tracking-tightest mb-5 leading-[1.02]">
              Things we&apos;ve{" "}
              <span className="font-light gradient-text">built.</span>
            </h1>
            <p className="text-[16px] lg:text-[17px] text-ink-2 leading-relaxed max-w-xl mx-auto">
              A small portfolio, by design. Fewer engagements, more attention —
              every one shipped end-to-end with a senior team.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          PROJECT GRID — 2-up editorial cards
          ───────────────────────────────────────── */}
      <section className="container-px py-20 lg:py-28 bg-base">
        <div className="max-w-7xl mx-auto">
          {projects.length === 0 ? (
            <p className="text-center text-ink-2 py-20 text-[15px]">
              First case studies coming soon.
            </p>
          ) : (
            <StaggerReveal className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {projects.map((p, i) => {
                const tint = TINTS[i % TINTS.length];
                const tags = (p.services || []).slice(0, 3).map(tagFor);

                return (
                  <StaggerItem key={p._id}>
                    <Link
                      href={`/projects/${p.slug}`}
                      className="group block h-full"
                      data-track={`work_${p.slug}`}
                    >
                      <SpotlightCard
                        className="bg-white rounded-3xl border border-rule overflow-hidden lift h-full flex flex-col"
                        spotlightColor="rgba(45, 13, 80, 0.08)"
                      >
                        {/* Top section: text content */}
                        <div className="px-7 lg:px-10 pt-8 lg:pt-10 pb-6 flex-1">
                          {/* Year + client meta line */}
                          <div className="flex items-center gap-2 mb-5 text-[12px] text-ink-3 font-mono">
                            <span>{p.year}</span>
                            {p.client && (
                              <>
                                <span className="opacity-40">·</span>
                                <span className="truncate">{p.client}</span>
                              </>
                            )}
                          </div>

                          {/* Title — actual project title, not "Project Title" placeholder */}
                          <h2 className="h-display text-[32px] lg:text-[40px] tracking-tight mb-4 leading-[1.05]">
                            {p.title}
                          </h2>

                          {/* Description / tagline */}
                          {(p.tagline || p.summary) && (
                            <p className="text-[15px] text-ink-2 leading-relaxed mb-6 line-clamp-3">
                              {p.tagline || p.summary}
                            </p>
                          )}

                          {/* Tag pills — brand-purple mono */}
                          {tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {tags.map((t: string) => (
                                <span
                                  key={t}
                                  className="px-3 py-1 rounded-full bg-white border border-rule text-[11px] font-mono text-ink-2 capitalize"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Bottom section: tinted image area (Hims pattern) */}
                        <div
                          className="relative px-6 lg:px-8 pt-6 lg:pt-8 pb-6 lg:pb-8 mx-7 lg:mx-10 mb-7 lg:mb-10 rounded-2xl"
                          style={{ background: tint }}
                        >
                          <div className="aspect-[16/10] relative">
                            {p.cover ? (
                              <Image
                                src={p.cover}
                                alt={p.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-contain cine-image"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center">
                                <span
                                  className="h-display text-5xl lg:text-6xl"
                                  style={{ color: "var(--brand)" }}
                                >
                                  {p.title
                                    .split(" ")
                                    .map((w: string) => w[0])
                                    .join("")
                                    .slice(0, 2)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Hover indicator — appears bottom-right of image area */}
                          <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white border border-rule grid place-items-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1 transition-all duration-300">
                            <ArrowUpRight
                              className="w-4 h-4 text-ink"
                              strokeWidth={2}
                            />
                          </div>
                        </div>
                      </SpotlightCard>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerReveal>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────
          CTA — same Hims-Labs lavender pattern
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 bg-base border-t border-rule">
        <Reveal>
          <SpotlightCard
            className="overflow-hidden rounded-3xl border border-rule grid lg:grid-cols-2 max-w-7xl mx-auto"
            spotlightColor="rgba(45, 13, 80, 0.18)"
            style={{ background: "#F8F2FB" }}
          >
            <div className="px-8 sm:px-12 lg:px-16 py-14 lg:py-20 flex flex-col justify-center order-2 lg:order-1">
              <p className="eyebrow mb-5">Get started</p>
              <h2 className="h-display text-[36px] lg:text-[52px] tracking-tightest mb-5 leading-[1.02]">
                Ready to be the next
                <br />
                <span className="font-light gradient-text">
                  case study?
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
                  data-track="work_cta_start"
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
                  data-track="work_cta_book"
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
                src="/projects.avif"
                alt="Software shipped by aeTech"
                loading="eager"
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
