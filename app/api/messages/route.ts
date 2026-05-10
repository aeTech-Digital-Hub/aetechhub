import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Message } from '@/models';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await dbConnect();
    const m = await Message.create(body);
    return NextResponse.json({ ok: true, item: m });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ items: [] });
  await dbConnect();
  const items = await Message.find({ sessionId }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ items });
}
