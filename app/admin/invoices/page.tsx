'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUSES = ['all', 'draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'void'];

export default function InvoicesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false); });
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  const totalPaid = items.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const totalOutstanding = items.filter(i => ['sent', 'viewed', 'overdue', 'partial'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">— Invoices</p>
          <h1 className="h-display text-4xl">Billing</h1>
        </div>
        <Link href="/admin/invoices/new" className="btn-primary"><Plus className="w-4 h-4" /> New invoice</Link>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-px bg-rule border border-rule">
        <div className="bg-bone p-5"><p className="text-[11px] uppercase tracking-wider text-ink/50">Paid</p><p className="font-mono text-2xl mt-1">{formatCurrency(totalPaid)}</p></div>
        <div className="bg-bone p-5"><p className="text-[11px] uppercase tracking-wider text-ink/50">Outstanding</p><p className="font-mono text-2xl mt-1 text-purple-700">{formatCurrency(totalOutstanding)}</p></div>
        <div className="bg-bone p-5"><p className="text-[11px] uppercase tracking-wider text-ink/50">Total invoices</p><p className="font-mono text-2xl mt-1">{items.length}</p></div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider ${filter === s ? 'bg-ink text-bone' : 'text-ink/60 hover:bg-rule'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="border border-rule bg-bone overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-rule">
            <tr className="text-left">
              <Th>Invoice</Th><Th>Client</Th><Th>Issued</Th><Th>Due</Th><Th>Status</Th><Th className="text-right">Total</Th><Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {loading && <tr><td colSpan={7} className="p-8 text-center text-ink/50">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-ink/50 italic">No invoices.</td></tr>}
            {filtered.map(inv => (
              <tr key={inv._id} className="hover:bg-cream/50">
                <Td className="font-mono text-xs">{inv.invoiceNo}</Td>
                <Td>
                  <div>{inv.client?.name}</div>
                  <div className="text-xs text-ink/50">{inv.client?.email || '—'}</div>
                </Td>
                <Td className="text-xs text-ink/60">{formatDate(inv.issueDate || inv.createdAt)}</Td>
                <Td className="text-xs text-ink/60">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</Td>
                <Td><StatusPill s={inv.status} /></Td>
                <Td className="text-right font-mono">{formatCurrency(inv.total || 0, inv.currency)}</Td>
                <Td><Link href={`/admin/invoices/${inv._id}`} className="text-purple-700 hover:underline text-xs">Open →</Link></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = '' }: any) {
  return <th className={`px-4 py-3 text-[11px] uppercase tracking-wider text-ink/50 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = '' }: any) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function StatusPill({ s }: { s: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-indigo-100 text-indigo-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-amber-100 text-amber-800',
    overdue: 'bg-red-100 text-red-800',
    void: 'bg-gray-50 text-gray-500',
  };
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${colors[s] || 'bg-gray-100'}`}>{s}</span>;
}
