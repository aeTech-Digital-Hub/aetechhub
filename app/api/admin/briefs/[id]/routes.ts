import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Brief } from "@/models/Project";
import { requireAdmin } from "@/lib/auth-server";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Whitelist of fields the admin can modify on a brief.
 * Deliberately narrow — briefs are user-submitted content; admins
 * manage status, notes, and follow-up state only.
 */
const EDITABLE_FIELDS = ["status", "notes", "followedUpAt", "abandonedAt"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const item = await Brief.findById(id)
    .populate("convertedTo", "title slug")
    .lean();
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

  const existing: any = await Brief.findById(id);
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
    console.error("[brief.update]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to save." },
      { status: 500 },
    );
  }

  if (Object.keys(diff).length > 0) {
    await recordAdminAction({
      user: { id: user.sub, email: user.email },
      action: "brief.update",
      entity: {
        type: "brief",
        id: String(existing._id),
        label: existing.name || existing.email || String(existing._id),
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

  const existing: any = await Brief.findById(id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "not-found" },
      { status: 404 },
    );
  }

  const label = existing.name || existing.email || String(existing._id);
  await existing.deleteOne();

  await recordAdminAction({
    user: { id: user.sub, email: user.email },
    action: "brief.delete",
    entity: { type: "brief", id, label },
    req,
  });

  return NextResponse.json({ ok: true });
}
