import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Scope, Brief } from "@/models/Project";
import { requireAdmin } from "@/lib/auth-server";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Generate the next SCOPE reference for the current year.
 * Format: SCOPE-YYYY-NNNN (e.g. SCOPE-2026-0001).
 *
 * Uses countDocuments — fine for admin-side low volume. If you ever
 * automate scope creation from user actions, swap to an atomic counter.
 */
async function generateScopeRef(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SCOPE-${year}-`;
  const existing = await Scope.countDocuments({
    scopeRef: { $regex: `^${prefix}` },
  });
  const next = String(existing + 1).padStart(4, "0");
  return `${prefix}${next}`;
}

/**
 * GET /api/admin/scopes
 * Returns all scopes. Admin only.
 */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const items = await Scope.find({})
    .sort({ status: 1, sentAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(500)
    .lean();

  return NextResponse.json({ ok: true, items });
}

/**
 * POST /api/admin/scopes
 * Create a new scope.
 *
 * Body options:
 *   - briefId: string (optional)  — prefill client + project fields from Brief
 *   - Any other Scope field to override
 *
 * If briefId is provided:
 *   - Client info populated from Brief.name, .email, .company, .phone
 *   - projectTitle from Brief.projectType or Brief.company
 *   - projectDescription from Brief.summary or Brief.structured?.problem
 *   - timelineDescription from Brief.timeline
 *   - notes references the brief for admin traceability
 */
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const body = await req.json().catch(() => ({}));

  let prefill: Record<string, unknown> = {};
  let briefRef = "";

  // If briefId provided, load and prefill
  if (body.briefId) {
    const brief: any = await Brief.findById(body.briefId).lean();
    if (!brief) {
      return NextResponse.json(
        { ok: false, error: "Brief not found." },
        { status: 404 },
      );
    }

    briefRef = brief.briefId || String(brief._id);
    prefill = {
      briefId: brief._id,
      clientName: brief.name || "",
      clientEmail: brief.email || "",
      clientCompany: brief.company || "",
      clientPhone: brief.phone || "",
      projectTitle:
        brief.company?.trim() ||
        brief.projectType?.trim() ||
        `Project for ${brief.name || "client"}`,
      projectDescription: brief.summary || brief.structured?.problem || "",
      timelineDescription: brief.timeline || "",
      notes: `Prefilled from brief #${briefRef} on ${new Date().toLocaleDateString(
        "en-GB",
        { day: "2-digit", month: "short", year: "numeric" },
      )}.`,
    };
  }

  // Merge prefill with any overrides from body
  const scopeData: Record<string, unknown> = {
    ...prefill,
    ...body,
    // Always fresh reference — do NOT allow client to spoof
    scopeRef: await generateScopeRef(),
    status: "draft",
    createdBy: user.sub,
  };

  // Require these minimums even after prefill
  if (!scopeData.clientName || !scopeData.clientEmail) {
    return NextResponse.json(
      { ok: false, error: "Client name and email are required." },
      { status: 400 },
    );
  }
  if (!scopeData.projectTitle) {
    return NextResponse.json(
      { ok: false, error: "Project title is required." },
      { status: 400 },
    );
  }

  try {
    const item: any = await Scope.create(scopeData);

    await recordAdminAction({
      user: { id: user.sub, email: user.email },
      action: "scope.create",
      entity: {
        type: "scope",
        id: String(item._id),
        label: `${item.scopeRef} · ${item.projectTitle}`,
      },
      req,
      metadata: briefRef ? { briefRef } : undefined,
    });

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    console.error("[scope.create]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create scope." },
      { status: 500 },
    );
  }
}
