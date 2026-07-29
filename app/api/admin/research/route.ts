import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Research } from "@/models";
import { requireAdmin } from "@/lib/auth-server";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/research
 * Return ALL articles (including drafts). Admin only.
 */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const items = await Research.find({})
    .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(500)
    .lean();

  return NextResponse.json({ ok: true, items });
}

/**
 * POST /api/admin/research
 * Create a new article. Rejects duplicate slugs. Stamps publishedAt on
 * first publish.
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

  const clash = await Research.findOne({ slug: body.slug }).lean();
  if (clash) {
    return NextResponse.json(
      { ok: false, error: "An article with this slug already exists." },
      { status: 409 },
    );
  }

  if (body.published && !body.publishedAt) {
    body.publishedAt = new Date();
  }

  try {
    const item: any = await Research.create(body);

    await recordAdminAction({
      user: { id: user.sub, email: user.email },
      action: "research.create",
      entity: {
        type: "research",
        id: String(item._id),
        label: item.title,
      },
      req,
    });

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    if (err?.code === 11000) {
      return NextResponse.json(
        { ok: false, error: "An article with this slug already exists." },
        { status: 409 },
      );
    }
    console.error("[research.create]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create article." },
      { status: 500 },
    );
  }
}
