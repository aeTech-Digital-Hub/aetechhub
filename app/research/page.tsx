import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Research } from "@/models";
import { formatDate } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ResearchList } from "@/components/research/ResearchList";

export const revalidate = 3600;

export const metadata = {
  title: "Research",
  description:
    "Engineering notes, design opinions, and the occasional research piece from the aeTech studio.",
};

const CATEGORY_LABELS: Record<string, string> = {
  research: "Research",
  engineering: "Software Engineering",
  design: "Design",
  business: "Business",
};

async function getArticles() {
  try {
    await dbConnect();
    const docs = await Research.find({ published: true })
      .sort({ publishedAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(docs)) as any[];
  } catch {
    return [];
  }
}

export default async function ResearchPage() {
  const articles = await getArticles();
  const [featured, ...rest] = articles;

  return (
    <>
      {/* ─────────────────────────────────────────
          PAGE HERO
          ───────────────────────────────────────── */}
      <section className="container-px pt-28 pb-12 lg:pt-36 lg:pb-16 bg-base">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <p className="eyebrow mb-5">Research</p>
            <h1 className="h-display text-[44px] sm:text-[56px] lg:text-[64px] tracking-tightest mb-5 leading-[1.02]">
              Notes from{" "}
              <span className="font-light gradient-text">the Hub.</span>
            </h1>
            <p className="text-[16px] lg:text-[17px] text-ink-2 leading-relaxed">
              Engineering notes, design opinions, and the occasional research
              piece. We publish when we have something worth saying — not on a
              schedule.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          FEATURED ARTICLE — full-bleed image with overlay glass card
          ───────────────────────────────────────── */}
      {featured && (
        <section className="container-px pb-12 lg:pb-16 bg-base">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <Link
                href={`/research/${featured.slug}`}
                className="group relative block rounded-3xl overflow-hidden lift"
              >
                <div className="aspect-[16/9] sm:aspect-[16/8] lg:aspect-[16/7] relative overflow-hidden bg-rule">
                  {featured.cover ? (
                    <Image
                      src={featured.cover}
                      alt={featured.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 1280px"
                      className="object-cover cine-image"
                      priority
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        background:
                          "linear-gradient(135deg, #2D0D50 0%, #5C3373 100%)",
                      }}
                    />
                  )}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"
                  />
                </div>

                <div className="absolute left-4 right-4 bottom-4 sm:left-8 sm:right-8 sm:bottom-8 lg:left-10 lg:right-auto lg:bottom-10 lg:max-w-2xl">
                  <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-white/40 p-5 sm:p-7 lg:p-8 shadow-[0_24px_60px_-12px_rgba(45,13,80,0.25)]">
                    <h2 className="h-display text-[20px] sm:text-[26px] lg:text-[32px] tracking-tight mb-2.5 leading-[1.15]">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-[14px] sm:text-[15px] text-ink-2 leading-relaxed mb-5 line-clamp-2">
                        {featured.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-7 h-7 rounded-full grid place-items-center text-[12px] font-medium text-white"
                          style={{ background: "var(--brand)" }}
                        >
                          {(featured.author || "aT").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-[13px] font-medium text-ink leading-tight">
                            {featured.author || "aeTech"}
                          </p>
                          {featured.publishedAt && (
                            <p className="text-[11px] text-ink-3 font-mono">
                              {formatDate(featured.publishedAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      {(featured.tags?.length || featured.category) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {featured.category && (
                            <span className="px-2.5 py-1 rounded-full bg-white border border-rule text-[11px] font-mono text-ink-2">
                              {CATEGORY_LABELS[featured.category] ||
                                featured.category}
                            </span>
                          )}
                          {featured.tags?.slice(0, 2).map((t: string) => (
                            <span
                              key={t}
                              className="px-2.5 py-1 rounded-full bg-white border border-rule text-[11px] font-mono text-ink-2"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute top-5 right-5 sm:top-7 sm:right-7 w-9 h-9 rounded-full bg-white/85 backdrop-blur-md border border-white/40 grid place-items-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-4 h-4 text-ink" strokeWidth={2} />
                </div>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────
          FILTERABLE LIST
          ───────────────────────────────────────── */}
      {articles.length > 0 ? (
        <ResearchList articles={rest.length > 0 ? rest : articles} />
      ) : (
        <div className="container-px max-w-7xl mx-auto pb-24 text-center">
          <p className="text-ink-2 italic">First articles coming soon.</p>
        </div>
      )}

      {/* ─────────────────────────────────────────
          CTA — same Hims-Labs lavender card pattern
          ───────────────────────────────────────── */}
      <section className="container-px py-24 lg:py-32 bg-base">
        <Reveal>
          <SpotlightCard
            className="overflow-hidden rounded-3xl border border-rule grid lg:grid-cols-2"
            spotlightColor="rgba(45, 13, 80, 0.18)"
            style={{ background: "#F8F2FB" }}
          >
            <div className="px-8 sm:px-12 lg:px-16 py-14 lg:py-20 flex flex-col justify-center order-2 lg:order-1">
              <p className="eyebrow mb-5">Get in touch</p>
              <h2 className="h-display text-[36px] lg:text-[52px] tracking-tightest mb-5 leading-[1.02]">
                Ready to start
                <br />
                <span className=" font-light gradient-text">your project?</span>
              </h2>
              <p className="text-[16px] lg:text-[17px] text-ink-2 mb-9 leading-relaxed max-w-md">
                Don&apos;t see a package that fits your exact needs? We offer
                custom solutions. Tell us about your project for a personalised
                consultation.
              </p>

              <div>
                <Link
                  href="/contact"
                  className="btn-primary lift"
                  data-track="research_cta_contact"
                >
                  Contact us
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>

              <p className="mt-6 text-[13px] text-ink-2">
                Prefer to start with a brief?{" "}
                <Link
                  href="/start-project"
                  className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink hover:text-ink transition-colors"
                  data-track="research_cta_start"
                >
                  Start a project
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
