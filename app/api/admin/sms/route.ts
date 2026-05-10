import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { sendSms } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    const { to, message } = await req.json();
    if (!to || !message) return NextResponse.json({ ok: false, error: 'missing to/message' }, { status: 400 });
    const result = await sendSms({ to, message });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
