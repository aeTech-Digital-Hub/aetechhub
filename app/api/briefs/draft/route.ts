import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Brief } from "@/models/Project";
import {
  completionPercent,
  EMPTY_BRIEF,
  type StructuredBrief,
} from "@/lib/brief";

export const dynamic = "force-dynamic";

// Public-facing brief IDs — capital letters + digits, easy to read on the phone.
// 6 chars from a 31-char alphabet ≈ 887 million combinations. Plenty.
const ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateBriefId(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return out;
}

/**
 * POST /api/briefs/draft
 *  – If `briefId` is provided, look up existing and update.
 *  – Otherwise, create a new draft. Requires contact info (name + email) on first call.
 *  – Returns the briefId so the client can include it on subsequent saves.
 *
 * Body: { briefId?, fingerprint, contact?: {name,email,company,phone}, structured?: Partial<StructuredBrief> }
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { briefId, fingerprint, contact, structured, source } = body || {};

    if (!fingerprint) {
      return NextResponse.json(
        { ok: false, error: "no-fingerprint" },
        { status: 400 },
      );
    }

    // Existing draft path
    if (briefId) {
      const doc = await Brief.findOne({ briefId });
      if (!doc)
        return NextResponse.json(
          { ok: false, error: "not-found" },
          { status: 404 },
        );

      // Light authorization — fingerprint must match. Prevents random URL trampling.
      if (doc.fingerprint && doc.fingerprint !== fingerprint) {
        return NextResponse.json(
          { ok: false, error: "forbidden" },
          { status: 403 },
        );
      }

      // Merge structured updates
      if (structured) {
        const merged: StructuredBrief = {
          ...EMPTY_BRIEF,
          ...(doc.structured?.toObject?.() ?? doc.structured ?? {}),
          ...structured,
        };
        doc.structured = merged;
        doc.completionPercent = completionPercent(merged);
      }
      // Update contact if provided (e.g., editing on a later visit)
      if (contact) {
        if (contact.name) doc.name = contact.name;
        if (contact.email) doc.email = contact.email;
        if (contact.company !== undefined) doc.company = contact.company;
        if (contact.phone !== undefined) doc.phone = contact.phone;
      }
      doc.lastEditedAt = new Date();
      await doc.save();

      return NextResponse.json({ ok: true, briefId: doc.briefId });
    }

    // New draft path — must include contact info
    if (!contact?.name || !contact?.email) {
      return NextResponse.json(
        { ok: false, error: "contact-required" },
        { status: 400 },
      );
    }

    // Generate a unique briefId
    let newId = generateBriefId();
    let safety = 0;
    while ((await Brief.exists({ briefId: newId })) && safety < 5) {
      newId = generateBriefId();
      safety++;
    }

    const doc = await Brief.create({
      briefId: newId,
      name: contact.name,
      email: contact.email,
      company: contact.company,
      phone: contact.phone,
      fingerprint,
      structured: { ...EMPTY_BRIEF, ...(structured || {}) },
      completionPercent: completionPercent({
        ...EMPTY_BRIEF,
        ...(structured || {}),
      }),
      status: "draft",
      source: source || "brief-editor",
      lastEditedAt: new Date(),
    });

    return NextResponse.json({ ok: true, briefId: doc.briefId });
  } catch (err) {
    console.error("[brief draft]", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

/**
 * GET /api/briefs/draft?fingerprint=...&briefId=...
 * Used to resume an in-progress draft. Returns minimal fields.
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const fingerprint = url.searchParams.get("fingerprint");
    const briefId = url.searchParams.get("briefId");
    if (!fingerprint) return NextResponse.json({ ok: false }, { status: 400 });

    // Look up by briefId first (explicit), fallback to most recent for fingerprint
    let doc = null;
    if (briefId) {
      doc = await Brief.findOne({ briefId, fingerprint }).lean<any>();
    }
    if (!doc) {
      doc = await Brief.findOne({
        fingerprint,
        status: { $in: ["draft", "abandoned"] },
      })
        .sort({ lastEditedAt: -1 })
        .lean<any>();
    }
    if (!doc) return NextResponse.json({ ok: true, brief: null });

    return NextResponse.json({
      ok: true,
      brief: {
        briefId: doc.briefId,
        name: doc.name,
        email: doc.email,
        company: doc.company || "",
        phone: doc.phone || "",
        structured: doc.structured || EMPTY_BRIEF,
        completionPercent: doc.completionPercent || 0,
        lastEditedAt: doc.lastEditedAt,
        status: doc.status,
      },
    });
  } catch (err) {
    console.error("[brief draft GET]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
