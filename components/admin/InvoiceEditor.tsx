"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  Download,
  Share2,
  Copy,
  Check,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useUsdToGhsRate } from "@/components/Price";

type LineItem = { description: string; qty: number; rate: number };
type Client = {
  name: string;
  email?: string;
  company?: string;
  address?: string;
  phone?: string;
};

type Invoice = {
  _id?: string;
  invoiceNo?: string;
  client: Client;
  items: LineItem[];
  discountPct?: number;
  taxPct?: number;
  currency?: "USD" | "GHS";
  issueDate?: string;
  dueDate?: string;
  status?: string;
  notes?: string;
  terms?: string;
  total?: number;
};

const DEFAULT_TERMS = `50% deposit required to commence work — 50% balance due upon final delivery.

Payment options:
• International wire transfer (USD)
• Bank: Fidelity Bank · A/C: 2400052995517 · Aetech Digital Hub · Branch: Spintex (GHS)
• Mobile money (MoMo) — request details on request

Valid for 14 days from issue date.`;

export function InvoiceEditor({
  initial,
  mode,
}: {
  initial: Invoice;
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const [data, setData] = useState<Invoice>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const ghsRate = useUsdToGhsRate();

  // Share state — for the invoice
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTo, setShareTo] = useState(initial.client?.email || "");
  const [shareLink, setShareLink] = useState<string>("");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);

  // Receipt-share state — only used when status === 'paid'
  const [receiptShareOpen, setReceiptShareOpen] = useState(false);
  const [receiptShareTo, setReceiptShareTo] = useState(
    initial.client?.email || "",
  );
  const [receiptShareLink, setReceiptShareLink] = useState<string>("");
  const [receiptShareCopied, setReceiptShareCopied] = useState(false);
  const [receiptShareBusy, setReceiptShareBusy] = useState(false);

  const isPaid = data.status === "paid";

  function downloadReceipt() {
    if (!data._id) {
      setMsg("Save the invoice first.");
      return;
    }
    if (!isPaid) {
      setMsg("Receipts are only available for fully paid invoices.");
      return;
    }
    window.open(`/api/admin/invoices/${data._id}/receipt`, "_blank");
  }

  async function generateReceiptShareLink(sendEmail = false) {
    if (!data._id || !isPaid) {
      setMsg("Receipts are only available for fully paid invoices.");
      return;
    }
    setReceiptShareBusy(true);
    try {
      const res = await fetch(`/api/admin/invoices/${data._id}/receipt-share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendTo: sendEmail ? receiptShareTo : undefined,
          expireDays: 90,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "failed");
      setReceiptShareLink(json.url);
      if (sendEmail) {
        setMsg(`Receipt sent to ${receiptShareTo} ✓`);
        setReceiptShareOpen(false);
      }
    } catch (err: any) {
      setMsg(err?.message || "Receipt share failed");
    } finally {
      setReceiptShareBusy(false);
    }
  }

  async function copyReceiptShareLink() {
    if (!receiptShareLink) return;
    try {
      await navigator.clipboard.writeText(receiptShareLink);
      setReceiptShareCopied(true);
      setTimeout(() => setReceiptShareCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function downloadPdf() {
    if (!data._id) {
      setMsg("Save the invoice first.");
      return;
    }
    window.open(`/api/admin/invoices/${data._id}/pdf`, "_blank");
  }

  async function generateShareLink(sendEmail = false) {
    if (!data._id) {
      setMsg("Save the invoice first.");
      return;
    }
    setShareBusy(true);
    try {
      const res = await fetch(`/api/admin/invoices/${data._id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendTo: sendEmail ? shareTo : undefined,
          expireDays: 30,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "failed");
      setShareLink(json.url);
      if (sendEmail) {
        setMsg(`Sent to ${shareTo} ✓`);
        setShareOpen(false);
      }
    } catch (err: any) {
      setMsg(err?.message || "Share failed");
    } finally {
      setShareBusy(false);
    }
  }

  async function copyShareLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const subtotal = useMemo(
    () =>
      data.items.reduce(
        (s, it) => s + Number(it.qty || 1) * Number(it.rate || 0),
        0,
      ),
    [data.items],
  );
  const discountAmt = subtotal * ((data.discountPct || 0) / 100);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = afterDiscount * ((data.taxPct || 0) / 100);
  const total = afterDiscount + taxAmt;

  // Live equivalent for the alternate currency
  const isUsd = (data.currency || "USD") === "USD";
  const equivalent = ghsRate
    ? isUsd
      ? `≈ GHS ${(total * ghsRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `≈ $${(total / ghsRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

  function update(patch: Partial<Invoice>) {
    setData((p) => ({ ...p, ...patch }));
  }
  function setItem(i: number, patch: Partial<LineItem>) {
    setData((p) => ({
      ...p,
      items: p.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));
  }
  function addItem() {
    setData((p) => ({
      ...p,
      items: [...p.items, { description: "", qty: 1, rate: 0 }],
    }));
  }
  function removeItem(i: number) {
    setData((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  }

  async function save(opts?: { andSend?: boolean }) {
    setBusy(true);
    setMsg("");
    const url = mode === "new" ? "/api/invoices" : `/api/invoices/${data._id}`;
    const method = mode === "new" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    if (!d.ok) {
      setMsg(d.error || "Save failed");
      setBusy(false);
      return;
    }
    const id = d.invoice?._id || d.item?._id || data._id;

    if (opts?.andSend) {
      await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setMsg("Invoice sent to client ✓");
    } else {
      setMsg("Saved ✓");
    }
    setBusy(false);
    if (mode === "new") router.push(`/admin/invoices/${id}`);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/admin/invoices"
        className="text-sm text-ink/60 hover:text-purple-700 inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> All invoices
      </Link>

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">
            {mode === "new" ? "— New invoice" : `— ${data.invoiceNo}`}
          </p>
          <h1 className="h-display text-4xl">
            {mode === "new" ? "Create invoice" : "Edit invoice"}
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => save()}
            disabled={busy}
            className="btn-ghost !py-2 !text-xs"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          {data._id && (
            <>
              <button
                onClick={downloadPdf}
                disabled={busy}
                className="btn-ghost !py-2 !text-xs"
                title="Download PDF"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button
                onClick={() => {
                  setShareOpen(true);
                  if (!shareLink) generateShareLink(false);
                }}
                disabled={busy}
                className="btn-ghost !py-2 !text-xs"
                title="Share link"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              {isPaid && (
                <>
                  <span
                    className="w-px h-5 bg-rule self-center mx-1"
                    aria-hidden
                  />
                  <button
                    onClick={downloadReceipt}
                    disabled={busy}
                    className="btn-ghost !py-2 !text-xs"
                    title="Download receipt"
                    style={{ color: "#15803D" }}
                  >
                    <ReceiptIcon className="w-3.5 h-3.5" /> Receipt
                  </button>
                  <button
                    onClick={() => {
                      setReceiptShareOpen(true);
                      if (!receiptShareLink) generateReceiptShareLink(false);
                    }}
                    disabled={busy}
                    className="btn-ghost !py-2 !text-xs"
                    title="Share receipt"
                    style={{ color: "#15803D" }}
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share receipt
                  </button>
                </>
              )}
            </>
          )}
          {data.client?.email && (
            <button
              onClick={() => save({ andSend: true })}
              disabled={busy}
              className="btn-primary !py-2 !text-xs"
            >
              <Send className="w-3.5 h-3.5" /> Save & email to client
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="border-l-4 border-purple-700 bg-purple-50 p-3 text-sm">
          {msg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Client */}
          <Section title="Client">
            <div className="grid sm:grid-cols-2 gap-3">
              <Inp
                label="Name *"
                v={data.client?.name || ""}
                s={(v) => update({ client: { ...data.client, name: v } })}
              />
              <Inp
                label="Email"
                v={data.client?.email || ""}
                s={(v) => update({ client: { ...data.client, email: v } })}
              />
              <Inp
                label="Company"
                v={data.client?.company || ""}
                s={(v) => update({ client: { ...data.client, company: v } })}
              />
              <Inp
                label="Phone"
                v={data.client?.phone || ""}
                s={(v) => update({ client: { ...data.client, phone: v } })}
              />
              <Inp
                label="Address"
                v={data.client?.address || ""}
                s={(v) => update({ client: { ...data.client, address: v } })}
                className="sm:col-span-2"
              />
            </div>
          </Section>

          {/* Items */}
          <Section title="Line items">
            <div className="border border-rule">
              <div className="grid grid-cols-12 gap-2 bg-cream px-3 py-2 text-[11px] uppercase tracking-wider text-ink/50">
                <div className="col-span-7">Description</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>
              {data.items.map((it, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 border-t border-rule px-2 py-2 items-center"
                >
                  <input
                    className="col-span-7 px-2 py-1.5 text-sm focus:outline-none focus:bg-cream rounded"
                    value={it.description}
                    onChange={(e) =>
                      setItem(i, { description: e.target.value })
                    }
                    placeholder="What was delivered…"
                  />
                  <input
                    className="col-span-1 px-2 py-1.5 text-sm text-center focus:outline-none focus:bg-cream rounded"
                    value={it.qty}
                    onChange={(e) =>
                      setItem(i, { qty: Number(e.target.value) })
                    }
                    type="number"
                  />
                  <input
                    className="col-span-2 px-2 py-1.5 text-sm text-right focus:outline-none focus:bg-cream rounded"
                    value={it.rate}
                    onChange={(e) =>
                      setItem(i, { rate: Number(e.target.value) })
                    }
                    type="number"
                  />
                  <div className="col-span-1 text-right font-mono text-xs">
                    {(it.qty * it.rate).toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeItem(i)}
                    className="col-span-1 text-ink/30 hover:text-red-700 grid place-items-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addItem}
                className="border-t border-rule w-full px-3 py-2 text-xs text-purple-700 hover:bg-cream flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add line item
              </button>
            </div>
          </Section>

          <Section title="Notes & terms">
            <div className="space-y-3">
              <textarea
                placeholder="Internal notes / payment terms shown on invoice"
                rows={3}
                value={data.notes || ""}
                onChange={(e) => update({ notes: e.target.value })}
                className="w-full border border-rule p-2.5 text-sm focus:outline-none focus:border-purple-700 rounded"
              />
              <textarea
                placeholder="Terms"
                rows={5}
                value={data.terms || ""}
                onChange={(e) => update({ terms: e.target.value })}
                className="w-full border border-rule p-2.5 text-sm focus:outline-none focus:border-purple-700 rounded font-mono text-[12.5px]"
              />
            </div>
          </Section>
        </div>

        {/* Side */}
        <div className="space-y-4">
          <Section title="Status">
            <select
              value={data.status}
              onChange={(e) => update({ status: e.target.value })}
              className="w-full border border-rule px-3 py-2 text-sm focus:outline-none focus:border-purple-700"
            >
              {[
                "draft",
                "sent",
                "viewed",
                "paid",
                "partial",
                "overdue",
                "void",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Section>

          <Section title="Dates & currency">
            <div className="space-y-2">
              <Inp
                label="Invoice no"
                v={data.invoiceNo || ""}
                s={(v) => update({ invoiceNo: v })}
              />
              <Inp
                label="Issue date"
                type="date"
                v={data.issueDate?.slice(0, 10) || ""}
                s={(v) => update({ issueDate: v })}
              />
              <Inp
                label="Due date"
                type="date"
                v={data.dueDate?.slice(0, 10) || ""}
                s={(v) => update({ dueDate: v })}
              />
              <select
                value={data.currency || "USD"}
                onChange={(e) => update({ currency: e.target.value as any })}
                className="w-full border border-rule px-3 py-2 text-sm"
              >
                <option value="USD">USD · US Dollars</option>
                <option value="GHS">GHS · Ghana Cedis</option>
              </select>
            </div>
          </Section>

          <Section title="Totals">
            <div className="space-y-2 text-sm">
              <Row k="Subtotal" v={formatCurrency(subtotal, data.currency)} />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-ink/60 w-20">Discount %</span>
                <input
                  value={data.discountPct || 0}
                  onChange={(e) =>
                    update({ discountPct: Number(e.target.value) })
                  }
                  type="number"
                  className="flex-1 border border-rule px-2 py-1 text-sm rounded"
                />
              </div>
              <Row
                k="Discount"
                v={`− ${formatCurrency(discountAmt, data.currency)}`}
                subtle
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink/60 w-20">Tax %</span>
                <input
                  value={data.taxPct || 0}
                  onChange={(e) => update({ taxPct: Number(e.target.value) })}
                  type="number"
                  className="flex-1 border border-rule px-2 py-1 text-sm rounded"
                />
              </div>
              <Row k="Tax" v={formatCurrency(taxAmt, data.currency)} subtle />
              <div className="border-t border-rule pt-3 mt-2">
                <Row
                  k="Total"
                  v={
                    <span className="font-display text-lg text-purple-700">
                      {formatCurrency(total, data.currency)}
                    </span>
                  }
                  bold
                />
                {equivalent && (
                  <p className="text-[11px] text-ink/40 mt-1 text-right">
                    {equivalent} at today&apos;s rate
                  </p>
                )}
              </div>
            </div>
          </Section>
        </div>
      </div>
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-rule p-6 lg:p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow mb-2">Share invoice</p>
            <h3 className="h-display text-[22px] tracking-tighter mb-4">
              Send {data.invoiceNo} to the client.
            </h3>

            {/* Public share link */}
            <div className="mb-5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-1.5 block">
                Secure link · expires in 30 days
              </label>
              <div className="flex items-stretch border border-rule rounded-lg overflow-hidden bg-base">
                <input
                  value={
                    shareLink ||
                    (shareBusy ? "Generating…" : "Click below to generate")
                  }
                  readOnly
                  className="flex-1 bg-transparent px-3 py-2 text-[13px] font-mono text-ink-2 outline-none"
                />
                <button
                  onClick={copyShareLink}
                  disabled={!shareLink}
                  className="px-3 border-l border-rule hover:bg-tint-1 disabled:opacity-40 transition-colors"
                  title="Copy link"
                >
                  {shareCopied ? (
                    <Check
                      className="w-3.5 h-3.5"
                      strokeWidth={2}
                      style={{ color: "var(--brand)" }}
                    />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-ink-2" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            {/* Email it directly */}
            <div className="mb-5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-1.5 block">
                Or email it directly
              </label>
              <input
                type="email"
                value={shareTo}
                onChange={(e) => setShareTo(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 rounded-lg border border-rule bg-base text-[13px] focus:outline-none focus:border-ink-3 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-rule">
              <button
                onClick={() => setShareOpen(false)}
                className="btn-ghost !py-2 !text-xs"
                disabled={shareBusy}
              >
                Close
              </button>
              <button
                onClick={() => generateShareLink(true)}
                disabled={
                  shareBusy || !shareTo || !/\S+@\S+\.\S+/.test(shareTo)
                }
                className="btn-primary !py-2 !text-xs"
              >
                <Send className="w-3.5 h-3.5" /> Send by email
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptShareOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setReceiptShareOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-rule p-6 lg:p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow mb-2" style={{ color: "#15803D" }}>
              Share receipt
            </p>
            <h3 className="h-display text-[22px] tracking-tighter mb-4">
              Send receipt for {data.invoiceNo} to the client.
            </h3>

            <div className="mb-5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-1.5 block">
                Secure link · expires in 90 days
              </label>
              <div className="flex items-stretch border border-rule rounded-lg overflow-hidden bg-base">
                <input
                  value={
                    receiptShareLink ||
                    (receiptShareBusy
                      ? "Generating…"
                      : "Click below to generate")
                  }
                  readOnly
                  className="flex-1 bg-transparent px-3 py-2 text-[13px] font-mono text-ink-2 outline-none"
                />
                <button
                  onClick={copyReceiptShareLink}
                  disabled={!receiptShareLink}
                  className="px-3 border-l border-rule hover:bg-tint-1 disabled:opacity-40 transition-colors"
                  title="Copy link"
                >
                  {receiptShareCopied ? (
                    <Check
                      className="w-3.5 h-3.5"
                      strokeWidth={2}
                      style={{ color: "#15803D" }}
                    />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-ink-2" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-1.5 block">
                Or email it directly
              </label>
              <input
                type="email"
                value={receiptShareTo}
                onChange={(e) => setReceiptShareTo(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 rounded-lg border border-rule bg-base text-[13px] focus:outline-none focus:border-ink-3 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-rule">
              <button
                onClick={() => setReceiptShareOpen(false)}
                className="btn-ghost !py-2 !text-xs"
                disabled={receiptShareBusy}
              >
                Close
              </button>
              <button
                onClick={() => generateReceiptShareLink(true)}
                disabled={
                  receiptShareBusy ||
                  !receiptShareTo ||
                  !/\S+@\S+\.\S+/.test(receiptShareTo)
                }
                className="btn-primary !py-2 !text-xs"
                style={{ background: "#15803D" }}
              >
                <Send className="w-3.5 h-3.5" /> Send by email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-rule bg-bone p-5">
      <p className="font-mono text-[10.5px] uppercase tracking-wider text-purple-700 mb-3">
        — {title}
      </p>
      {children}
    </div>
  );
}
function Inp({
  label,
  v,
  s,
  type = "text",
  className = "",
}: {
  label: string;
  v: string | number;
  s: (val: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[11px] uppercase tracking-wider text-ink/50 block mb-1">
        {label}
      </label>
      <input
        type={type}
        value={v}
        onChange={(e) => s(e.target.value)}
        className="w-full border border-rule px-2.5 py-1.5 text-sm focus:outline-none focus:border-purple-700 rounded"
      />
    </div>
  );
}
function Row({
  k,
  v,
  subtle,
  bold,
}: {
  k: React.ReactNode;
  v: React.ReactNode;
  subtle?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-baseline ${subtle ? "text-ink/60 text-xs" : ""} ${bold ? "font-medium" : ""}`}
    >
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}

export { DEFAULT_TERMS };
