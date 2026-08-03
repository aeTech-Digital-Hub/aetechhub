import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Brief, Project } from "@/models/Project";
import { requireAdmin } from "@/lib/auth-server";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/briefs/[id]/convert
 *
 * Creates a new Project DRAFT prefilled from the Brief's contents, then
 * updates both records to point at each other so the attribution loop is
 * closed:
 *
 *   Brief.convertedTo         → new Project._id
 *   Project.convertedFromBriefId → Brief._id
 *
 * The Project starts as a draft (published: false). Admin can then flesh
 * out the case study fields in the Project editor and publish when ready.
 *
 * Safety:
 *   - If the Brief already has convertedTo set, returns 409 (don't
 *     silently create duplicates).
 *   - Generates a unique slug by appending a short random suffix if the
 *     preferred slug is taken.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const brief: any = await Brief.findById(id);
  if (!brief) {
    return NextResponse.json(
      { ok: false, error: "not-found" },
      { status: 404 },
    );
  }

  if (brief.convertedTo) {
    return NextResponse.json(
      {
        ok: false,
        error: "This brief has already been converted to a project.",
        projectId: brief.convertedTo,
      },
      { status: 409 },
    );
  }

  // Derive title + slug candidates
  const rawTitle =
    brief.company?.trim() ||
    brief.projectType?.trim() ||
    brief.name?.trim() ||
    "Untitled project";
  const baseSlug = slugify(rawTitle);
  const slug = await uniqueSlug(baseSlug);

  // Prefill project draft from brief
  const projectDraft = {
    title: rawTitle,
    slug,
    tagline: brief.summary || undefined,
    summary: brief.structured?.problem || brief.summary || undefined,
    client: brief.company || brief.name || undefined,
    services: brief.services || [],
    convertedFromBriefId: brief._id,
    published: false,
    // Case study body fields — seeded from structured brief content
    challenge: brief.structured?.problem || undefined,
    approach: brief.structured?.tried || undefined,
    outcome: brief.structured?.success || undefined,
  };

  try {
    const project: any = await Project.create(projectDraft);

    // Close the attribution loop
    brief.convertedTo = project._id;
    brief.status = "won";
    await brief.save();

    await recordAdminAction({
      user: { id: user.sub, email: user.email },
      action: "brief.convert",
      entity: {
        type: "brief",
        id: String(brief._id),
        label: brief.name || brief.email || String(brief._id),
      },
      req,
      metadata: {
        projectId: String(project._id),
        projectTitle: project.title,
      },
    });

    return NextResponse.json({
      ok: true,
      project: {
        _id: String(project._id),
        title: project.title,
        slug: project.slug,
      },
      brief: {
        _id: String(brief._id),
        status: brief.status,
      },
    });
  } catch (err: any) {
    console.error("[brief.convert]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to convert brief.",
      },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/** Return `base` if free, else `base-xxxx` with a short random suffix. */
async function uniqueSlug(base: string): Promise<string> {
  const clash = await Project.findOne({ slug: base }).lean();
  if (!clash) return base;

  // Try up to 3 times with a random suffix
  for (let i = 0; i < 3; i++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const candidate = `${base}-${suffix}`;
    const c = await Project.findOne({ slug: candidate }).lean();
    if (!c) return candidate;
  }
  // Fallback — timestamp suffix, guaranteed unique
  return `${base}-${Date.now().toString(36)}`;
}
