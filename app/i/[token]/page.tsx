import { dbConnect } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdf, type InvoicePdfData } from "@/lib/pdf/invoice-pdf";
import { notFound } from "next/navigation";
import React from "react";

// Force dynamic — token validation must run per-request
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public-facing invoice link.
 *
 * GET /i/[token] streams the PDF inline so the recipient can view it in-browser.
 * The token is rotated on every share, and expires after the admin's chosen window.
 */
export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // We can't return a stream from a normal page component, so this page
  // just shows a message — the actual PDF is served by /api/i/[token].
  // The link admins share IS this page URL, which then redirects to the API.
  // (Doing it this way lets us guard the page with React-rendered errors
  //  if the token is invalid/expired, instead of a generic API error.)

  const { token } = await params;
  await dbConnect();
  const inv: any = await Invoice.findOne({
    shareToken: token,
    shareTokenExpires: { $gt: new Date() },
  }).lean();
  if (!inv) return notFound();

  return (
    <main className="min-h-[100dvh] bg-base flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-rule bg-white p-8 text-center">
          <p className="eyebrow mb-3">Invoice ready</p>
          <h1 className="h-display text-[26px] tracking-tighter mb-3">
            {inv.invoiceNo}
          </h1>
          <p className="text-[14px] text-ink-2 mb-6 leading-relaxed">
            For {inv.client?.name}
            {inv.client?.company ? ` · ${inv.client.company}` : ""}. Click below
            to view or download.
          </p>
          <a
            href={`/api/i/${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex"
          >
            View invoice (PDF)
          </a>
          <p className="mt-6 text-[11px] text-ink-3 leading-relaxed">
            This link expires on{" "}
            {new Date(inv.shareTokenExpires).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            . If the link expires, ask aeTech for a new one.
          </p>
        </div>
      </div>
    </main>
  );
}
