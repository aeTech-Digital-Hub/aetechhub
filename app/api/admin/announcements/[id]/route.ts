import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Announcement } from "@/models";
import { requireAdmin } from "@/lib/auth-server";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/announcements/[id]
 * Return a single announcement, including drafts. Admin-only.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const item = await Announcement.findById(id).lean();
  if (!item) {
    return NextResponse.json(
      { ok: false, error: "not-found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, item });
}

/**
 * PATCH /api/admin/announcements/[id]
 * Update fields. Body is a partial announcement.
 *
 * If publishing for the first time, sets publishedAt to now.
 * If unpublishing, DOES NOT clear publishedAt — that's history.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const existing: any = await Announcement.findById(id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "not-found" },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => ({}));

  // Whitelist of editable fields — never trust arbitrary keys from the client
  const editable = [
    "title",
    "slug",
    "summary",
    "body",
    "cover",
    "category",
    "pinned",
    "published",
  ];

  const changes: Record<string, unknown> = {};
  for (const key of editable) {
    if (key in body) changes[key] = body[key];
  }

  // First-time publish → stamp publishedAt
  if (changes.published === true && !existing.publishedAt) {
    changes.publishedAt = new Date();
  }

  // Track what actually changed for the audit log
  const diff: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(changes)) {
    const before = existing[key];
    const after = changes[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      diff[key] = { from: before, to: after };
    }
  }

  Object.assign(existing, changes);
  await existing.save();

  // Audit — only log if something actually changed
  if (Object.keys(diff).length > 0) {
    await recordAdminAction({
      user: { id: user.sub, email: user.email },
      action: "announcement.update",
      entity: {
        type: "announcement",
        id: String(existing._id),
        label: existing.title,
      },
      req,
      metadata: { fieldsChanged: Object.keys(diff) },
    });
  }

  return NextResponse.json({ ok: true, item: existing });
}

/**
 * DELETE /api/admin/announcements/[id]
 * Hard delete. Fires an audit event.
 *
 * If you want soft-delete instead, add `deletedAt` to the schema and
 * change this to set that instead of calling deleteOne().
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const existing: any = await Announcement.findById(id);
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
    action: "announcement.delete",
    entity: { type: "announcement", id, label },
    req,
  });

  return NextResponse.json({ ok: true });
}
