import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { requireAdmin } from "@/lib/auth-server";
import { renderToStream } from "@react-pdf/renderer";
import { ReceiptPdf, type ReceiptPdfData } from "@/lib/pdf/receipt-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/invoices/[id]/receipt
 * Returns a receipt PDF — only valid when the invoice is fully paid.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return new Response("Unauthorized", { status: 401 });

  await dbConnect();
  const { id } = await params;
  const inv: any = await Invoice.findById(id).lean();
  if (!inv) return new Response("Not found", { status: 404 });
  if (inv.status !== "paid") {
    return new Response("Receipt only available for fully paid invoices.", {
      status: 400,
    });
  }

  const data: ReceiptPdfData = {
    receiptNo: deriveReceiptNo(inv.invoiceNo),
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
      "Content-Disposition": `inline; filename="${data.receiptNo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

/** Mirrors invoice numbering: INV-2026-0042 → RCP-2026-0042 */
function deriveReceiptNo(invoiceNo: string): string {
  return invoiceNo.replace(/^INV/i, "RCP");
}
