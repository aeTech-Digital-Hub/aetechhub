import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Invoice } from '@/models/Invoice';
import { requireAdmin } from '@/lib/auth-server';
import { genInvoiceNo } from '@/lib/utils';



export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await dbConnect();
  const status = req.nextUrl.searchParams.get('status');
  const q: any = {};
  if (status) q.status = status;
  const items = await Invoice.find(q).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await dbConnect();
  const body = await req.json();

  // Compute totals
  const items = (body.items || []).map((it: any) => ({
    ...it,
    amount: Number(it.qty || 1) * Number(it.rate || 0),
  }));
  const subtotal = items.reduce((s: number, it: any) => s + it.amount, 0);
  const discountAmount = subtotal * (Number(body.discountPct || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (Number(body.taxPct || 0) / 100);
  const total = afterDiscount + taxAmount;

  const invoice = await Invoice.create({
    ...body,
    invoiceNo: body.invoiceNo || genInvoiceNo(),
    items,
    subtotal,
    discountAmount,
    taxAmount,
    total,
  });

  return NextResponse.json({ ok: true, invoice });
}
