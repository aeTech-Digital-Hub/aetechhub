import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Track } from '@/models';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await dbConnect();
    await Track.create({ ...body, userAgent: req.headers.get('user-agent') || '' });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
