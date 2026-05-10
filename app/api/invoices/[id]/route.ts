import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Invoice } from '@/models/Invoice';
import { requireAdmin } from '@/lib/auth-server';



export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  await dbConnect();
  const inv = await Invoice.findById(id).lean();
  return NextResponse.json({ ok: true, item: inv });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  await dbConnect();
  const body = await req.json();

  let update: any = { ...body };
  if (Array.isArray(body.items)) {
    const items = body.items.map((it: any) => ({ ...it, amount: Number(it.qty || 1) * Number(it.rate || 0) }));
    const subtotal = items.reduce((s: number, it: any) => s + it.amount, 0);
    const discountAmount = subtotal * (Number(body.discountPct || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (Number(body.taxPct || 0) / 100);
    update = { ...update, items, subtotal, discountAmount, taxAmount, total: afterDiscount + taxAmount };
  }
  if (body.status === 'paid' && !body.paidAt) update.paidAt = new Date();

  const inv = await Invoice.findByIdAndUpdate(id, update, { new: true }).lean();
  return NextResponse.json({ ok: true, item: inv });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  await dbConnect();
  await Invoice.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
