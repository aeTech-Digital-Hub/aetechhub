import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Scope } from "@/models/Project";
import { requireAdmin } from "@/lib/auth-server";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Whitelist of editable fields. Note the deliberate exclusions:
 *   - scopeRef (never changes after creation)
 *   - publicToken, sentAt, viewCount, firstViewedAt, lastViewedAt
 *     (system-managed in Round 2)
 *   - createdBy, createdAt (immutable audit fields)
 */
const EDITABLE_FIELDS = [
  "clientName",
  "clientEmail",
  "clientCompany",
  "clientPhone",
  "projectTitle",
  "projectDescription",
  "deliverables",
  "discountUsd",
  "depositPercent",
  "timelineDescription",
  "milestones",
  "assumptions",
  "exclusions",
  "paymentTerms",
  "validUntil",
  "status",
  "notes",
  "acceptedAt",
  "rejectedAt",
  "rejectedReason",
  "convertedToProjectId",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const item = await Scope.findById(id)
    .populate("briefId", "briefId name email")
    .populate("convertedToProjectId", "title slug")
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
  const existing: any = await Scope.findById(id);
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

  // Basic validation on required fields
  if ("clientEmail" in changes && !changes.clientEmail) {
    return NextResponse.json(
      { ok: false, error: "Client email cannot be empty." },
      { status: 400 },
    );
  }
  if ("projectTitle" in changes && !changes.projectTitle) {
    return NextResponse.json(
      { ok: false, error: "Project title cannot be empty." },
      { status: 400 },
    );
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
    console.error("[scope.update]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to save." },
      { status: 500 },
    );
  }

  if (Object.keys(diff).length > 0) {
    await recordAdminAction({
      user: { id: user.sub, email: user.email },
      action: "scope.update",
      entity: {
        type: "scope",
        id: String(existing._id),
        label: `${existing.scopeRef} · ${existing.projectTitle}`,
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
  const existing: any = await Scope.findById(id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "not-found" },
      { status: 404 },
    );
  }

  const label = `${existing.scopeRef} · ${existing.projectTitle}`;
  await existing.deleteOne();

  await recordAdminAction({
    user: { id: user.sub, email: user.email },
    action: "scope.delete",
    entity: { type: "scope", id, label },
    req,
  });

  return NextResponse.json({ ok: true });
}
