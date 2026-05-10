import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { requireAdmin } from "@/lib/auth-server";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdf, type InvoicePdfData } from "@/lib/pdf/invoice-pdf";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/invoices/[id]/pdf
 * Returns a PDF stream of the invoice. Admin-only.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const inv: any = await Invoice.findById(id).lean();
  if (!inv) {
    return new Response("Not found", { status: 404 });
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
