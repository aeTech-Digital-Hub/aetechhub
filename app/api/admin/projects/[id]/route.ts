import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-server";
import { recordAdminAction } from "@/lib/audit";
import { Project } from "@/models/Project";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Full list of editable Project fields — matches the actual schema in models/index.ts
 * after the amendment patch is applied.
 */
const EDITABLE_FIELDS = [
  // Content
  "title",
  "slug",
  "tagline",
  "summary",
  // Engagement
  "client",
  "year",
  "timeline",
  "engagementType",
  "discipline",
  "services",
  "techStack",
  "liveUrl",
  // Media
  "cover",
  "gallery",
  // Case study
  "challenge",
  "approach",
  "outcome",
  "metrics",
  // Meta
  "featured",
  "published",
  "convertedFromBriefId",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const item = await Project.findById(id).lean();
  if (!item) {
    return NextResponse.json(
      { ok: false, error: "not-found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const existing: any = await Project.findById(id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "not-found" },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => ({}));

  const changes: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) changes[key] = body[key];
  }

  // Slug uniqueness
  if (changes.slug && changes.slug !== existing.slug) {
    const clash = await Project.findOne({
      slug: changes.slug,
      _id: { $ne: existing._id },
    }).lean();
    if (clash) {
      return NextResponse.json(
        { ok: false, error: "A project with this slug already exists." },
        { status: 409 },
      );
    }
  }

  // First-time publish → stamp publishedAt
  if (changes.published === true && !existing.publishedAt) {
    changes.publishedAt = new Date();
  }

  // Track diff for audit
  const diff: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(changes)) {
    const before = existing[key];
    const after = changes[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      diff[key] = { from: before, to: after };
    }
  }

  Object.assign(existing, changes);

  try {
    await existing.save();
  } catch (err: any) {
    console.error("[project.update]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to save." },
      { status: 500 },
    );
  }

  if (Object.keys(diff).length > 0) {
    await recordAdminAction({
      user: { id: user.sub, email: user.email },
      action: "project.update",
      entity: {
        type: "project",
        id: String(existing._id),
        label: existing.title,
      },
      req,
      metadata: { fieldsChanged: Object.keys(diff) },
    });
  }

  return NextResponse.json({ ok: true, item: existing });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const existing: any = await Project.findById(id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "not-found" },
      { status: 404 },
    );
  }

  const label = existing.title;
  await existing.deleteOne();

  await recordAdminAction({
    user: { id: user.sub, email: user.email },
    action: "project.delete",
    entity: { type: "project", id, label },
    req,
  });

  return NextResponse.json({ ok: true });
}
