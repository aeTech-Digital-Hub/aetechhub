import Link from 'next/link';
import { dbConnect } from '@/lib/db';
import { Brief } from '@/models/Project';
import { Invoice } from '@/models/Invoice';
import { Booking, Subscriber } from '@/models';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getClients() {
  await dbConnect();

  // Aggregate clients across briefs + invoices + bookings
  const briefs   = await Brief.find().select('name email company phone createdAt').lean();
  const invoices = await Invoice.find().select('client total status createdAt').lean();
  const bookings = await Booking.find().select('name email phone date createdAt').lean();

  const map = new Map<string, any>();
  function add(email: string, base: any, type: string) {
    if (!email) return;
    const k = email.toLowerCase();
    const existing = map.get(k) || { email: k, name: base.name, company: base.company, phone: base.phone, briefs: 0, invoices: 0, paid: 0, outstanding: 0, bookings: 0, lastSeen: null };
    if (type === 'brief')   existing.briefs += 1;
    if (type === 'booking') existing.bookings += 1;
    if (base.name && !existing.name) existing.name = base.name;
    if (base.phone && !existing.phone) existing.phone = base.phone;
    if (base.company && !existing.company) existing.company = base.company;
    const ts = new Date(base.createdAt).getTime();
    if (!existing.lastSeen || ts > existing.lastSeen) existing.lastSeen = ts;
    map.set(k, existing);
  }

  briefs.forEach((b: any) => add(b.email, b, 'brief'));
  bookings.forEach((b: any) => add(b.email, b, 'booking'));
  invoices.forEach((inv: any) => {
    if (!inv.client?.email) return;
    const k = inv.client.email.toLowerCase();
    const existing = map.get(k) || { email: k, name: inv.client.name, company: inv.client.company, phone: inv.client.phone, briefs: 0, invoices: 0, paid: 0, outstanding: 0, bookings: 0, lastSeen: null };
    existing.invoices += 1;
    if (inv.status === 'paid') existing.paid += inv.total || 0;
    else if (['sent', 'viewed', 'overdue', 'partial'].includes(inv.status)) existing.outstanding += inv.total || 0;
    const ts = new Date(inv.createdAt).getTime();
    if (!existing.lastSeen || ts > existing.lastSeen) existing.lastSeen = ts;
    map.set(k, existing);
  });

  return Array.from(map.values()).sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
}

export default async function ClientsPage() {
  const clients = await getClients();
  const subCount = await Subscriber.countDocuments();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">— Clients</p>
          <h1 className="h-display text-4xl">People</h1>
          <p className="text-sm text-ink/60 mt-2">{clients.length} clients · {subCount} newsletter subscribers</p>
        </div>
      </div>

      <div className="border border-rule bg-bone overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-rule">
            <tr className="text-left">
              <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-ink/50 font-medium">Name</th>
              <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-ink/50 font-medium">Email</th>
              <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-ink/50 font-medium text-center">Briefs</th>
              <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-ink/50 font-medium text-center">Invoices</th>
              <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-ink/50 font-medium text-right">Paid</th>
              <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-ink/50 font-medium text-right">Outstanding</th>
              <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-ink/50 font-medium">Last seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {clients.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-ink/50 italic">No clients yet.</td></tr>}
            {clients.map((c: any) => (
              <tr key={c.email} className="hover:bg-cream/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name || '—'}</div>
                  {c.company && <div className="text-xs text-ink/50">{c.company}</div>}
                </td>
                <td className="px-4 py-3"><a href={`mailto:${c.email}`} className="text-xs link-underline">{c.email}</a></td>
                <td className="px-4 py-3 text-center font-mono text-xs">{c.briefs}</td>
                <td className="px-4 py-3 text-center font-mono text-xs">{c.invoices}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{formatCurrency(c.paid || 0)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-purple-700">{formatCurrency(c.outstanding || 0)}</td>
                <td className="px-4 py-3 text-xs text-ink/60">{c.lastSeen ? formatDate(new Date(c.lastSeen)) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
