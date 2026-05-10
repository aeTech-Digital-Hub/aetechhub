'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { InvoiceEditor } from '@/components/admin/InvoiceEditor';

export default function EditInvoicePage() {
  const { id } = useParams() as { id: string };
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then(r => r.json()).then(d => setItem(d.item));
  }, [id]);

  if (!item) return <p className="text-ink/50 italic">Loading…</p>;
  return <InvoiceEditor initial={item} mode="edit" />;
}
