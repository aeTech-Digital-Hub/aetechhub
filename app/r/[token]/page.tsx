import { dbConnect } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PublicReceiptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await dbConnect();
  const inv: any = await Invoice.findOne({
    receiptShareToken: token,
    receiptShareTokenExpires: { $gt: new Date() },
    status: "paid",
  }).lean();
  if (!inv) return notFound();

  const receiptNo = inv.invoiceNo.replace(/^INV/i, "RCP");

  return (
    <main className="min-h-[100dvh] bg-base flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-rule bg-white p-8 text-center">
          <p className="eyebrow mb-3">Receipt ready</p>
          <h1 className="h-display text-[26px] tracking-tighter mb-3">
            {receiptNo}
          </h1>
          <p className="text-[14px] text-ink-2 mb-2 leading-relaxed">
            For {inv.client?.name}
            {inv.client?.company ? ` · ${inv.client.company}` : ""}.
          </p>
          <p className="text-[13px] text-ink-3 mb-6">
            Confirms payment of invoice {inv.invoiceNo}.
          </p>
          <a
            href={`/api/r/${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex"
          >
            View receipt (PDF)
          </a>
          <p className="mt-6 text-[11px] text-ink-3 leading-relaxed">
            This link expires on{" "}
            {new Date(inv.receiptShareTokenExpires).toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "long",
                year: "numeric",
              },
            )}
            . If the link expires, ask aeTech for a new one.
          </p>
        </div>
      </div>
    </main>
  );
}
