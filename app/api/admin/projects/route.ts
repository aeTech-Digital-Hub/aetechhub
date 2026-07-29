import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/Project";
import { requireAdmin } from "@/lib/auth-server";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/projects
 * Return ALL projects (including drafts). Admin-only.
 * Existing public /api/projects should only return published.
 */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const items = await Project.find({})
    .sort({ featured: -1, publishedAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(500)
    .lean();

  return NextResponse.json({ ok: true, items });
}

/**
 * POST /api/admin/projects
 * Create a new project. Publishing timestamp gets set on first publish.
 */
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const body = await req.json().catch(() => ({}));

  if (!body.title?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Title is required." },
      { status: 400 },
    );
  }
  if (!body.slug?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Slug is required." },
      { status: 400 },
    );
  }

  // Uniqueness check on slug
  const slugTaken = await Project.findOne({ slug: body.slug }).lean();
  if (slugTaken) {
    return NextResponse.json(
      { ok: false, error: "A project with this slug already exists." },
      { status: 409 },
    );
  }

  if (body.published && !body.publishedAt) {
    body.publishedAt = new Date();
  }

  try {
    const item: any = await Project.create(body);

    await recordAdminAction({
      user: { id: user.sub, email: user.email },
      action: "project.create",
      entity: {
        type: "project",
        id: String(item._id),
        label: item.title,
      },
      req,
    });

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    if (err?.code === 11000) {
      return NextResponse.json(
        { ok: false, error: "A project with this slug already exists." },
        { status: 409 },
      );
    }
    console.error("[project.create]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create project." },
      { status: 500 },
    );
  }
}
