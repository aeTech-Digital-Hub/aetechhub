import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { requireAdmin } from "@/lib/auth-server";
import { sendEmail } from "@/lib/notify";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/invoices/[id]/share
 * Body: { sendTo?: string, expireDays?: number }
 *
 * Generates a fresh share token and (optionally) emails it to the client.
 * Returns the public URL and the token's expiry.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const inv: any = await Invoice.findById(id);
  if (!inv)
    return NextResponse.json(
      { ok: false, error: "not-found" },
      { status: 404 },
    );

  const body = await req.json().catch(() => ({}));
  const { sendTo, expireDays = 30 } = body || {};

  // Rotate the token every share — old links die, even if previously copied
  const token = randomBytes(20).toString("hex");
  inv.shareToken = token;
  inv.shareTokenExpires = new Date(Date.now() + expireDays * 24 * 3600 * 1000);
  inv.shareCount = (inv.shareCount || 0) + 1;
  inv.lastSharedAt = new Date();
  await inv.save();

  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const url = `${base}/i/${token}`;

  // Optionally email it
  if (sendTo) {
    try {
      await sendEmail({
        to: sendTo,
        subject: `Your invoice from aeTech Digital Hub · ${inv.invoiceNo}`,
        text: [
          `Hi ${inv.client?.name || ""},`,
          ``,
          `Your invoice ${inv.invoiceNo} is ready to view at the secure link below.`,
          `It will be available for ${expireDays} days.`,
          ``,
          url,
          ``,
          `If you have any questions, just reply to this email.`,
          ``,
          `aeTech Digital Hub`,
          `ephraim@aetechdigitalhub.com`,
        ].join("\n"),
      });
    } catch (err) {
      console.error("[share email]", err);
      // Don't fail the share — link still works even if email failed
    }
  }

  return NextResponse.json({
    ok: true,
    url,
    expiresAt: inv.shareTokenExpires,
  });
}
