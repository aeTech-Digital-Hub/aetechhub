'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvoiceEditor, DEFAULT_TERMS } from '@/components/admin/InvoiceEditor';

export default function NewInvoicePage() {
  const params = useSearchParams();
  const briefId = params.get('briefId');
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    const base: any = {
      client: { name: '', email: '', company: '', address: '', phone: '' },
      items: [{ description: '', qty: 1, rate: 0 }],
      currency: 'USD',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      status: 'draft',
      terms: DEFAULT_TERMS,
      discountPct: 0,
      taxPct: 0,
      briefId: briefId || undefined,
    };

    if (briefId) {
      fetch(`/api/projects/${briefId}`).then(r => r.json()).then(d => {
        const b = d.item;
        if (b) {
          base.client = { name: b.name, email: b.email, company: b.company, phone: b.phone };
          base.items = (b.services || []).length > 0
            ? b.services.map((s: string) => ({ description: `${s.replace(/-/g, ' ')} engagement`, qty: 1, rate: 0 }))
            : [{ description: b.summary?.slice(0, 80) || 'Project work', qty: 1, rate: 0 }];
          if (b.estimatedCost && base.items.length === 1) base.items[0].rate = b.estimatedCost;
        }
        setInitial(base);
      });
    } else {
      setInitial(base);
    }
  }, [briefId]);

  if (!initial) return <p className="text-ink/50 italic">Loading…</p>;
  return <InvoiceEditor initial={initial} mode="new" />;
}
