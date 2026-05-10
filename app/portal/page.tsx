import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Receipt,
  FolderOpen,
  ArrowUpRight,
} from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Brief, Project } from "@/models/Project";
import { Invoice } from "@/models/Invoice";
import { getCurrentUser } from "@/lib/auth-server";
import { Reveal } from "@/components/motion/Reveal";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your portal",
  robots: { index: false, follow: false },
};

async function getData(email: string) {
  await dbConnect();

  const lower = email.toLowerCase();
  const [briefs, invoices] = await Promise.all([
    Brief.find({ email: lower }).sort({ updatedAt: -1 }).limit(20).lean(),
    Invoice.find({ "client.email": lower })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  return {
    briefs: JSON.parse(JSON.stringify(briefs)) as any[],
    invoices: JSON.parse(JSON.stringify(invoices)) as any[],
  };
}

export default async function PortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=" + encodeURIComponent("/portal"));

  // Admins use the admin dashboard, not the portal
  if (user.role === "admin") redirect("/admin/dashboard");

  const { briefs, invoices } = await getData(user.email);

  // Guaranteed-string display name for places that don't accept undefined
  const displayName = user.name?.trim() || user.email.split("@")[0] || "there";

  const submittedBriefs = briefs.filter((b) => b.status === "submitted");
  const draftBriefs = briefs.filter((b) => b.status === "draft");
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const openInvoices = invoices.filter((i) => i.status !== "paid");

  return (
    <>
      <section className="container-px pt-28 pb-10 lg:pt-36 lg:pb-12 bg-base">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              Back home
            </Link>
            <p className="eyebrow mb-5">Your portal</p>
            <h1 className="h-display text-[40px] sm:text-[48px] lg:text-[56px] tracking-tightest mb-3 leading-[1.02]">
              Hi, {displayName.split(" ")[0]}.
            </h1>
            <p className="text-[15px] lg:text-[16px] text-ink-2 leading-relaxed max-w-xl">
              Everything we&apos;ve worked on together — your briefs, invoices,
              and projects in one place.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-px pb-32 lg:pb-40 bg-base">
        <div className="max-w-5xl mx-auto space-y-12">
          <PortalSection
            title="Briefs in progress"
            description="Drafts you can resume."
            items={draftBriefs.map((b) => ({
              key: String(b._id),
              icon: (
                <FileText
                  className="w-4 h-4"
                  strokeWidth={2}
                  style={{ color: "var(--brand)" }}
                />
              ),
              title: `Brief ${b.briefId || ""}`,
              meta: `${b.completionPercent || 0}% complete · last edited ${formatDate(b.lastEditedAt || b.updatedAt)}`,
              href: "/brief",
            }))}
            emptyText="You don't have a draft brief in progress."
          />

          <PortalSection
            title="Submitted briefs"
            description="We've received these and will reply within 48 hours."
            items={submittedBriefs.map((b) => ({
              key: String(b._id),
              icon: (
                <FileText
                  className="w-4 h-4"
                  strokeWidth={2}
                  style={{ color: "var(--brand)" }}
                />
              ),
              title: `Brief ${b.briefId || ""}`,
              meta: `Submitted ${formatDate(b.submittedAt || b.updatedAt)} · status: ${b.status}`,
            }))}
            emptyText="You haven't submitted a brief yet."
          />

          <PortalSection
            title="Open invoices"
            description="Invoices we've sent you that need attention."
            items={openInvoices.map((i) => ({
              key: String(i._id),
              icon: (
                <Receipt
                  className="w-4 h-4"
                  strokeWidth={2}
                  style={{ color: "var(--brand)" }}
                />
              ),
              title: i.invoiceNo,
              meta: `${i.currency} ${(i.total || 0).toLocaleString()} · ${i.status}${
                i.dueDate ? ` · due ${formatDate(i.dueDate)}` : ""
              }`,
              // Public link if a share token exists
              href: i.shareToken ? `/i/${i.shareToken}` : undefined,
            }))}
            emptyText="No open invoices."
          />

          <PortalSection
            title="Paid invoices · receipts"
            description="Past invoices and their receipts."
            items={paidInvoices.map((i) => ({
              key: String(i._id),
              icon: (
                <Receipt
                  className="w-4 h-4"
                  strokeWidth={2}
                  style={{ color: "#15803D" }}
                />
              ),
              title: i.invoiceNo,
              meta: `${i.currency} ${(i.total || 0).toLocaleString()} · paid ${formatDate(i.paidAt)}`,
              href: i.receiptShareToken
                ? `/r/${i.receiptShareToken}`
                : undefined,
            }))}
            emptyText="No paid invoices yet."
          />

          {/* Account section */}
          <div className="rounded-2xl border border-rule bg-white p-6 lg:p-8">
            <p className="eyebrow mb-3">Account</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <Field label="Name" value={displayName} />
              <Field label="Email" value={user.email} />
            </div>
            <form action="/api/auth/logout" method="POST">
              <button className="btn-ghost lift" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function PortalSection({
  title,
  description,
  items,
  emptyText,
}: {
  title: string;
  description: string;
  items: {
    key: string;
    icon: React.ReactNode;
    title: string;
    meta: string;
    href?: string;
  }[];
  emptyText: string;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="h-display text-[20px] tracking-tighter">{title}</h2>
          <p className="text-[12.5px] text-ink-3 mt-0.5">{description}</p>
        </div>
        <span className="text-[11px] font-mono text-ink-3">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-ink-3 italic py-8 text-center bg-tint-1 rounded-xl">
          {emptyText}
        </p>
      ) : (
        <div className="rounded-xl border border-rule bg-white overflow-hidden">
          <ul className="divide-y divide-rule">
            {items.map((it) => {
              const inner = (
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-tint-1 transition-colors group">
                  <span
                    className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0"
                    style={{ background: "var(--brand-100)" }}
                  >
                    {it.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate">
                      {it.title}
                    </p>
                    <p className="text-[12.5px] text-ink-2 truncate">
                      {it.meta}
                    </p>
                  </div>
                  {it.href && (
                    <ArrowUpRight
                      className="w-3.5 h-3.5 text-ink-3 group-hover:text-brand transition-colors flex-shrink-0"
                      strokeWidth={2}
                    />
                  )}
                </div>
              );
              return (
                <li key={it.key}>
                  {it.href ? <Link href={it.href}>{inner}</Link> : inner}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">
        {label}
      </p>
      <p className="text-[14px] text-ink">{value}</p>
    </div>
  );
}
