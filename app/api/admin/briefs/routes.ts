import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Brief } from "@/models/Project";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/briefs
 * Returns all briefs (drafts + submitted + won etc.). Admin only.
 * Optional query params:
 *   - status: filter by single status
 *   - limit: max results (default 500)
 */
export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();

  const url = req.nextUrl;
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 500, 1000);

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const items = await Brief.find(query)
    .sort({ submittedAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ ok: true, items });
}
