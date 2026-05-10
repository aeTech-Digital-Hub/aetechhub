import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Subscriber } from "@/models/Subscriber";
import { ipHashFromRequest } from "@/lib/ip-hash";

export const dynamic = "force-dynamic";

const ALLOWED_SOURCES = ["footer", "welcome", "brief", "manual"] as const;

/**
 * POST /api/subscribe
 * Body: { email, name?, source? }
 *
 * Idempotent — submitting an existing email returns ok: true without changes.
 * Resurrects soft-deleted (unsubscribed) records if they re-subscribe.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, name, source } = await req.json();

    if (!email || !/\S+@\S+\.\S+/.test(String(email))) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email." },
        { status: 400 },
      );
    }

    const safeSource = ALLOWED_SOURCES.includes(source) ? source : "footer";
    const lowerEmail = String(email).toLowerCase().trim();
    const ipHash = ipHashFromRequest(req);

    await dbConnect();

    // Upsert with $setOnInsert so we never overwrite an existing subscriber's
    // confirmation state, but DO clear unsubscribedAt if they're returning.
    await Subscriber.findOneAndUpdate(
      { email: lowerEmail },
      {
        $setOnInsert: {
          email: lowerEmail,
          name: name ? String(name).trim() : undefined,
          source: safeSource,
          ipHashAtSignup: ipHash,
        },
        $unset: { unsubscribedAt: "" },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json(
      { ok: false, error: "Could not subscribe right now." },
      { status: 500 },
    );
  }
}
