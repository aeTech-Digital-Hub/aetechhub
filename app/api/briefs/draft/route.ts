import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Brief } from "@/models/Project";
import { requireAdmin } from "@/lib/auth-server";
import { sendEmail, emailLayout } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ────────────────────────────────────────────────────────────────
// Public-facing brief IDs — 6 chars from 31-char alphabet.
// Skips visually confusing chars (I, L, O, 0, 1).
// Same format used by /api/briefs/draft for consistency.
// ────────────────────────────────────────────────────────────────
const ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateBriefId(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return out;
}

/**
 * POST /api/briefs
 * Public endpoint. Called by the /start-project form.
 *
 * Fixes vs previous version:
 *   1. Forces status='submitted' + submittedAt=now (was defaulting to 'draft')
 *   2. Sets lastEditedAt so admin list queries include the brief
 *   3. Generates a unique briefId (short public reference)
 *   4. Validates name + email
 *   5. Fixed admin email CTA: /admin/briefs (was /admin/projects)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await dbConnect();

    // Validate the two required fields
    if (!body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required." },
        { status: 400 },
      );
    }

    // Generate a unique briefId — retry up to 5 times if there's a collision
    let briefId = generateBriefId();
    let attempts = 0;
    while ((await Brief.exists({ briefId })) && attempts < 5) {
      briefId = generateBriefId();
      attempts++;
    }

    // Force lifecycle fields — do NOT trust anything from the client
    const now = new Date();
    const brief = await Brief.create({
      ...body,
      briefId,
      status: "submitted", // ← the fix
      submittedAt: now, // ← the fix
      lastEditedAt: now, // ← the fix (so admin queries match)
      source: body.source || "start-project",
    });

    const adminEmail =
      process.env.ADMIN_EMAIL || "ephraim@aetechdigitalhub.com";
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      "https://aetechdigitalhub.com";

    // Client acknowledgement email (best-effort)
    if (brief.email) {
      sendEmail({
        to: brief.email,
        subject: "We received your brief — aeTech Digital Hub",
        html: emailLayout({
          heading: `Hi ${(brief.name || "").split(" ")[0]}, thanks for the brief.`,
          body: `
            <p>We've received your project request and someone from the team will review it personally and get back to you within <strong>48 hours</strong>.</p>
            <p>For reference, here's a summary of what you sent:</p>
            <p style="background:#FAF8F5;padding:16px;border-left:3px solid #C9A84C;font-size:14px;">
              <strong>Reference:</strong> #${brief.briefId}<br>
              <strong>Services:</strong> ${(brief.services || []).join(", ") || "—"}<br>
              <strong>Budget:</strong> ${brief.budget || "—"}<br>
              <strong>Timeline:</strong> ${brief.timeline || "—"}
            </p>
            <p>If you'd like to add anything before we reach out, simply reply to this email.</p>
          `,
          cta: { label: "Book a discovery call", href: `${baseUrl}/book` },
        }),
      }).catch(() => {});
    }

    // Admin notification (best-effort)
    // FIXED: CTA now points to /admin/briefs (was /admin/projects)
    sendEmail({
      to: adminEmail,
      subject: `New brief: ${brief.name} — ${(brief.services || []).join(", ") || "general"}`,
      html: emailLayout({
        heading: "New project brief received",
        body: `
          <p><strong>${brief.name}</strong> &lt;${brief.email}&gt;${brief.company ? ` from ${brief.company}` : ""} just submitted a brief.</p>
          <p style="background:#FAF8F5;padding:16px;border-left:3px solid #2D0D50;font-size:14px;">
            <strong>Reference:</strong> #${brief.briefId}<br>
            <strong>Project type:</strong> ${brief.projectType || "—"}<br>
            <strong>Services:</strong> ${(brief.services || []).join(", ") || "—"}<br>
            <strong>Budget:</strong> ${brief.budget || "—"}<br>
            <strong>Timeline:</strong> ${brief.timeline || "—"}<br>
            <strong>Phone:</strong> ${brief.phone || "—"}
          </p>
          <p style="white-space:pre-wrap;">${brief.summary || ""}</p>
        `,
        cta: {
          label: "Open in admin",
          href: `${baseUrl}/admin/briefs/${brief._id}`, // ← the fix (was /admin/projects)
        }
      }),
      replyTo: brief.email,
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      id: brief._id,
      briefId: brief.briefId,
    });
  } catch (e: any) {
    console.error("[briefs.create]", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 400 },
    );
  }
}

/**
 * GET /api/briefs — admin only, returns all briefs.
 * Left in for compatibility with older admin tooling. New admin UI reads
 * from /api/admin/briefs which has stricter response filtering.
 */
export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  await dbConnect();
  const items = await Brief.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ ok: true, items });
}
