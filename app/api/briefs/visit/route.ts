import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { BriefVisit } from "@/models/Project";
import { ipHashFromRequest } from "@/lib/ip-hash";

export const dynamic = "force-dynamic";

/**
 * Records an anonymous visit to a brief-related page.
 * No PII. Used to track funnel + drop-off rates and to recognise returning visitors.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fingerprint, page } = body || {};

    if (
      !fingerprint ||
      !["guide", "editor", "submitted", "gate"].includes(page)
    ) {
      return NextResponse.json(
        { ok: false, error: "invalid" },
        { status: 400 },
      );
    }

    await dbConnect();
    await BriefVisit.create({
      fingerprint,
      page,
      ipHash: ipHashFromRequest(req),
      userAgent: req.headers.get("user-agent")?.slice(0, 200) || undefined,
      referrer: req.headers.get("referer")?.slice(0, 300) || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Visit tracking is best-effort. Never fail the user-facing flow because of it.
    return NextResponse.json({ ok: true });
  }
}
