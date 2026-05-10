import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Brief } from '@/models/Project';
import { requireAdmin } from '@/lib/auth-server';



export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  await dbConnect();
  const item = await Brief.findById(id).lean();
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  await dbConnect();
  const body = await req.json();
  const item = await Brief.findByIdAndUpdate(id, body, { new: true }).lean();
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  await dbConnect();
  await Brief.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
