import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Brief } from "@/models/Project";
import { sendEmail } from "@/lib/notify";
import { completionPercent } from "@/lib/brief";

export const dynamic = "force-dynamic";

/**
 * POST /api/briefs/submit
 * Body: { briefId, fingerprint }
 * Marks the draft as submitted, computes final completion, notifies admin.
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { briefId, fingerprint } = await req.json();
    if (!briefId || !fingerprint) {
      return NextResponse.json(
        { ok: false, error: "invalid" },
        { status: 400 },
      );
    }

    const doc = await Brief.findOne({ briefId });
    if (!doc)
      return NextResponse.json(
        { ok: false, error: "not-found" },
        { status: 404 },
      );
    if (doc.fingerprint && doc.fingerprint !== fingerprint) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }

    doc.status = "submitted";
    doc.submittedAt = new Date();
    if (doc.structured) {
      doc.completionPercent = completionPercent(
        doc.structured.toObject?.() ?? doc.structured,
      );
    }
    await doc.save();

    // Best-effort admin email — don't fail the user-facing flow if SMTP is down
    if (process.env.ADMIN_EMAIL) {
      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: `New brief submitted · ${doc.briefId} · ${doc.name}`,
          text: [
            `A new brief has been submitted.`,
            ``,
            `Brief ID: ${doc.briefId}`,
            `Name: ${doc.name}`,
            `Email: ${doc.email}`,
            doc.company ? `Company: ${doc.company}` : "",
            doc.phone ? `Phone: ${doc.phone}` : "",
            ``,
            `Completion: ${doc.completionPercent}%`,
            ``,
            `Review at: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/briefs/${doc._id}`,
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } catch (err) {
        console.error("[brief submit notify]", err);
      }
    }

    return NextResponse.json({ ok: true, briefId: doc.briefId });
  } catch (err) {
    console.error("[brief submit]", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
