import Link from 'next/link';
import { dbConnect } from '@/lib/db';
import { Brief } from '@/models/Project';
import { Invoice } from '@/models/Invoice';
import { Booking, Track, Message } from '@/models';
import { ArrowUpRight, FileText, Receipt, MessageSquare, CalendarClock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

async function getStats() {
  await dbConnect();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [
    briefsTotal, briefsNew, briefsRecent,
    invoicesTotal, invoicesPaid, invoicesOutstanding, invoicesRecent,
    bookingsUpcoming, messagesUnread, pageViews30,
  ] = await Promise.all([
    Brief.countDocuments(),
    Brief.countDocuments({ status: 'new' }),
    Brief.find().sort({ createdAt: -1 }).limit(5).lean(),
    Invoice.countDocuments(),
    Invoice.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, sum: { $sum: '$total' } } }]),
    Invoice.aggregate([{ $match: { status: { $in: ['sent', 'viewed', 'overdue', 'partial'] } } }, { $group: { _id: null, sum: { $sum: '$total' } } }]),
    Invoice.find().sort({ createdAt: -1 }).limit(5).lean(),
    Booking.countDocuments({ date: { $gte: new Date() }, status: { $in: ['requested', 'confirmed'] } }),
    Message.countDocuments({ sender: 'client', read: false }),
    Track.countDocuments({ event: 'page_view', createdAt: { $gte: since } }),
  ]);

  return {
    briefsTotal, briefsNew, briefsRecent,
    invoicesTotal,
    paidTotal: invoicesPaid[0]?.sum || 0,
    outstandingTotal: invoicesOutstanding[0]?.sum || 0,
    invoicesRecent,
    bookingsUpcoming, messagesUnread, pageViews30,
  };
}

export default async function AdminDashboard() {
  const s = await getStats();

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">— Overview</p>
        <h1 className="h-display text-5xl">Studio dashboard</h1>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-rule border border-rule">
        <Kpi label="New briefs"     value={s.briefsNew} sub={`${s.briefsTotal} total`} href="/admin/projects" />
        <Kpi label="Paid revenue"   value={formatCurrency(s.paidTotal)} sub={`${s.invoicesTotal} invoices`} href="/admin/invoices" mono />
        <Kpi label="Outstanding"    value={formatCurrency(s.outstandingTotal)} sub="awaiting payment" href="/admin/invoices?status=sent" mono accent />
        <Kpi label="Page views"     value={s.pageViews30.toLocaleString()} sub="last 30 days" href="/admin/funnel" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
        <Kpi label="Upcoming calls"   value={s.bookingsUpcoming} icon={CalendarClock} href="/admin/bookings" />
        <Kpi label="Unread messages"  value={s.messagesUnread}    icon={MessageSquare} href="/admin/chat" accent={s.messagesUnread > 0} />
        <Kpi label="Quick action"     value="New invoice" icon={Receipt} href="/admin/invoices/new" />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent briefs */}
        <Card title="Recent briefs" href="/admin/projects" icon={FileText}>
          {s.briefsRecent.length === 0 ? <p className="text-sm text-ink/50 italic">No briefs yet.</p> : (
            <div className="divide-y divide-rule">
              {s.briefsRecent.map((b: any) => (
                <Link key={b._id} href={`/admin/projects/${b._id}`} className="block py-3 group">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-xs text-ink/50 truncate">{b.email} · {b.projectType || 'general'}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap ${statusColor(b.status)}`}>{b.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent invoices */}
        <Card title="Recent invoices" href="/admin/invoices" icon={Receipt}>
          {s.invoicesRecent.length === 0 ? <p className="text-sm text-ink/50 italic">No invoices yet.</p> : (
            <div className="divide-y divide-rule">
              {s.invoicesRecent.map((inv: any) => (
                <Link key={inv._id} href={`/admin/invoices/${inv._id}`} className="block py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.invoiceNo} · {inv.client?.name}</p>
                      <p className="text-xs text-ink/50">{formatDate(inv.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{formatCurrency(inv.total || 0, inv.currency)}</p>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${invStatusColor(inv.status)}`}>{inv.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, href, icon: Icon, mono, accent }: any) {
  return (
    <Link href={href} className="bg-bone p-6 hover:bg-cream transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] uppercase tracking-wider text-ink/50">{label}</p>
        {Icon ? <Icon className="w-4 h-4 text-ink/30" strokeWidth={1.5} /> : <ArrowUpRight className="w-4 h-4 text-ink/30 group-hover:text-purple-700 transition-colors" strokeWidth={1.5} />}
      </div>
      <p className={`${mono ? 'font-mono' : 'font-display'} text-3xl ${accent ? 'text-purple-700' : ''}`}>{value}</p>
      {sub && <p className="text-xs text-ink/50 mt-1">{sub}</p>}
    </Link>
  );
}

function Card({ title, children, href, icon: Icon }: { title: string; children: React.ReactNode; href?: string; icon?: any }) {
  return (
    <div className="border border-rule bg-bone p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-purple-700" strokeWidth={1.5} />}
          <h3 className="font-display text-xl">{title}</h3>
        </div>
        {href && <Link href={href} className="text-xs text-purple-700 hover:underline">View all →</Link>}
      </div>
      {children}
    </div>
  );
}

function statusColor(s: string) {
  return ({
    new: 'bg-purple-100 text-purple-800',
    reviewing: 'bg-blue-100 text-blue-800',
    'in-discussion': 'bg-yellow-100 text-yellow-800',
    quoted: 'bg-amber-100 text-amber-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-gray-100 text-gray-700',
    archived: 'bg-gray-50 text-gray-500',
  } as any)[s] || 'bg-gray-100 text-gray-700';
}

function invStatusColor(s: string) {
  return ({
    draft:   'bg-gray-100 text-gray-700',
    sent:    'bg-blue-100 text-blue-800',
    viewed:  'bg-indigo-100 text-indigo-800',
    paid:    'bg-green-100 text-green-800',
    partial: 'bg-amber-100 text-amber-800',
    overdue: 'bg-red-100 text-red-800',
    void:    'bg-gray-50 text-gray-500',
  } as any)[s] || 'bg-gray-100 text-gray-700';
}
