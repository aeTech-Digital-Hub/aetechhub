import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/Project";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";

/**
 * Homepage "Recent work" section.
 *
 * Server component — fetches directly from MongoDB. Renders nothing if
 * there are no published projects (so we don't get an awkward empty
 * section on the homepage during early days).
 *
 * Uses the SAME card treatment as the "Related case studies" section on
 * the project detail page for consistency across the site.
 */

const LIMIT = 3;

type ProjectLean = {
  _id: string;
  slug: string;
  title: string;
  tagline?: string;
  summary?: string;
  client?: string;
  discipline?: string;
  cover?: string;
  featured?: boolean;
  publishedAt?: Date;
  createdAt?: Date;
};

/**
 * Defensive fetch — `published: { $ne: false }` also matches legacy projects
 * where the `published` field is undefined/missing. Sorts featured first,
 * then by most recent.
 */
async function getRecentProjects(): Promise<ProjectLean[]> {
  try {
    await dbConnect();
    const items = await Project.find({ published: { $ne: false } })
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .limit(LIMIT)
      .lean<ProjectLean[]>();
    return JSON.parse(JSON.stringify(items));
  } catch (err) {
    console.error("[RecentProjectsSection] fetch failed:", err);
    return [];
  }
}

export async function RecentProjectsSection() {
  const projects = await getRecentProjects();
  if (projects.length === 0) return null;

  return (
    <section
      id="work"
      className="container-px py-24 lg:py-32 border-t border-b border-rule bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="mb-12 lg:mb-16 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">Recent work</p>
              <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter leading-[1.05]">
                Our Gallery{" "}
                <span className="font-light gradient-text">
                  of works shipped.
                </span>
              </h2>
            </div>

            <Link
              href="/projects"
              className="text-[13px] inline-flex items-center gap-1.5 link-brand"
            >
              All work
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </Reveal>

        <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {projects.map((p) => (
            <StaggerItem key={p._id}>
              <ProjectCard project={p} />
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: ProjectLean }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block border border-rule rounded-2xl bg-tint-1 lift overflow-hidden h-full"
    >
      {/* Padded image inset — matches announcement + related project cards */}
      <div className="p-4">
        <div
          className="aspect-[4/3] rounded-xl relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-50) 0%, var(--brand-100) 100%)",
          }}
        >
          {project.cover ? (
            <Image
              src={project.cover}
              alt={project.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <span
                className="h-display text-6xl float-slow opacity-30"
                style={{ color: "var(--brand)" }}
              >
                {project.discipline?.charAt(0)?.toUpperCase() ||
                  project.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-7">
        <div className="flex items-center gap-2 mb-3">
          {project.discipline && (
            <span
              className="text-[10px] font-mono uppercase tracking-wider"
              style={{ color: "var(--brand)" }}
            >
              {project.discipline}
            </span>
          )}
          {project.discipline && project.client && (
            <span className="text-[10px] font-mono text-ink-3">·</span>
          )}
          {project.client && (
            <span className="text-[10px] font-mono text-ink-3">
              {project.client}
            </span>
          )}
        </div>

        <h3 className="h-display text-[19px] tracking-tight mb-2 leading-tight group-hover:text-brand transition-colors">
          {project.title}
        </h3>

        {project.tagline ? (
          <p
            className="text-[13px] italic leading-relaxed line-clamp-2"
            style={{ color: "var(--brand)" }}
          >
            {project.tagline}
          </p>
        ) : (
          project.summary && (
            <p className="text-[13px] text-ink-2 leading-relaxed line-clamp-2">
              {project.summary}
            </p>
          )
        )}
      </div>
    </Link>
  );
}
