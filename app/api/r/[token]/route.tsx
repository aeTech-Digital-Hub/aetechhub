import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { renderToStream } from "@react-pdf/renderer";
import { ReceiptPdf, type ReceiptPdfData } from "@/lib/pdf/receipt-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/r/[token]
 * Public PDF stream for a token-shared receipt. Token is the auth.
 * Receipts are only generated for fully paid invoices.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  await dbConnect();
  const { token } = await params;
  const inv: any = await Invoice.findOne({
    receiptShareToken: token,
    receiptShareTokenExpires: { $gt: new Date() },
    status: "paid",
  }).lean();
  if (!inv) return new Response("Link not valid or expired.", { status: 404 });

  const receiptNo = inv.invoiceNo.replace(/^INV/i, "RCP");
  const data: ReceiptPdfData = {
    receiptNo,
    invoiceNo: inv.invoiceNo,
    client: inv.client,
    items: inv.items || [],
    subtotal: inv.subtotal || 0,
    discountAmount: inv.discountAmount,
    taxAmount: inv.taxAmount,
    total: inv.total || 0,
    paidAmount: inv.paidAmount || inv.total || 0,
    currency: inv.currency || "USD",
    issueDate: inv.issueDate,
    paidAt: inv.paidAt || new Date(),
    paymentMethod: inv.paymentMethod,
  };

  const stream = await renderToStream(<ReceiptPdf rec={data} />);
  // @ts-expect-error — Node stream is web-stream-compatible enough
  return new Response(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receiptNo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
