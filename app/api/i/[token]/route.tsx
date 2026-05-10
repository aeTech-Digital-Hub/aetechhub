import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdf, type InvoicePdfData } from "@/lib/pdf/invoice-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/i/[token]
 * Public PDF stream for a token-shared invoice. No auth — token is the auth.
 * Token must exist and not be expired.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  await dbConnect();
  const { token } = await params;
  const inv: any = await Invoice.findOne({
    shareToken: token,
    shareTokenExpires: { $gt: new Date() },
  }).lean();
  if (!inv) return new Response("Link not valid or expired.", { status: 404 });

  // Mark first-view if status was 'sent'
  if (inv.status === "sent") {
    await Invoice.updateOne({ _id: inv._id }, { $set: { status: "viewed" } });
  }

  const data: InvoicePdfData = {
    invoiceNo: inv.invoiceNo,
    client: inv.client,
    items: inv.items || [],
    subtotal: inv.subtotal || 0,
    discountAmount: inv.discountAmount,
    taxAmount: inv.taxAmount,
    total: inv.total || 0,
    currency: inv.currency || "USD",
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    notes: inv.notes,
    terms: inv.terms,
    status: inv.status,
  };

  const stream = await renderToStream(<InvoicePdf inv={data} />);
  // @ts-expect-error - Node Readable stream is web-stream-compatible enough for our use
  return new Response(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${inv.invoiceNo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
