import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Subscriber } from '@/models';

export async function POST(req: NextRequest) {
  try {
    const { email, name, source } = await req.json();
    if (!email) return NextResponse.json({ ok: false }, { status: 400 });
    await dbConnect();
    await Subscriber.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $setOnInsert: { email, name, source } },
      { upsert: true, new: true }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
