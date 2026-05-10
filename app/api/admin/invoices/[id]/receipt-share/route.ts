import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { requireAdmin } from "@/lib/auth-server";
import { sendEmail } from "@/lib/notify";
import { randomBytes } from "crypto";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/invoices/[id]/receipt-share
 * Body: { sendTo?: string, expireDays?: number }
 *
 * Generates a fresh receipt share token. Only works on fully paid invoices.
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
  if (inv.status !== "paid") {
    return NextResponse.json(
      { ok: false, error: "invoice-not-paid" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { sendTo, expireDays = 90 } = body || {};

  // Rotate the receipt token on each share
  const token = randomBytes(20).toString("hex");
  inv.receiptShareToken = token;
  inv.receiptShareTokenExpires = new Date(
    Date.now() + expireDays * 24 * 3600 * 1000,
  );
  inv.receiptShareCount = (inv.receiptShareCount || 0) + 1;
  inv.lastReceiptSharedAt = new Date();
  await inv.save();

  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const url = `${base}/r/${token}`;
  const receiptNo = inv.invoiceNo.replace(/^INV/i, "RCP");

  if (sendTo) {
    try {
      await sendEmail({
        to: sendTo,
        subject: `Your receipt from aeTech Digital Hub · ${receiptNo}`,
        text: [
          `Hi ${inv.client?.name || ""},`,
          ``,
          `Thank you for your payment.`,
          ``,
          `Your receipt ${receiptNo} (for invoice ${inv.invoiceNo}) is ready to view at the secure link below.`,
          `It will be available for ${expireDays} days.`,
          ``,
          url,
          ``,
          `If you need anything, just reply to this email.`,
          ``,
          `aeTech Digital Hub`,
          `ephraim@aetechdigitalhub.com`,
        ].join("\n"),
      });
    } catch (err) {
      console.error("[receipt share email]", err);
    }
  }

  // Audit
  await recordAdminAction({
    user: { id: user.id, email: user.email },
    action: "invoice.receipt-share",
    entity: { type: "invoice", id: String(inv._id), label: receiptNo },
    req,
    metadata: { sentTo: sendTo || null, expireDays },
  });

  return NextResponse.json({
    ok: true,
    url,
    expiresAt: inv.receiptShareTokenExpires,
    receiptNo,
  });
}
