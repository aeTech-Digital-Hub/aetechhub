import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { dbConnect } from '@/lib/db';
import { Brief } from '@/models/Project';
import { Booking, Subscriber } from '@/models';
import { Invoice } from '@/models/Invoice';
import { sendEmail, sendSms, emailLayout } from '@/lib/notify';

type Audience = 'subscribers' | 'briefs' | 'bookings' | 'invoiced' | 'all';

async function buildAudience(audience: Audience, channel: 'email' | 'sms') {
  await dbConnect();
  const records = new Map<string, { email?: string; phone?: string; name?: string }>();

  function add(email?: string, phone?: string, name?: string) {
    const key = (email || phone || '').toLowerCase();
    if (!key) return;
    const ex = records.get(key) || {};
    records.set(key, { email: ex.email || email, phone: ex.phone || phone, name: ex.name || name });
  }

  if (audience === 'subscribers' || audience === 'all') {
    const subs = await Subscriber.find().select('email name').lean();
    subs.forEach((s: any) => add(s.email, undefined, s.name));
  }
  if (audience === 'briefs' || audience === 'all') {
    const briefs = await Brief.find().select('email phone name').lean();
    briefs.forEach((b: any) => add(b.email, b.phone, b.name));
  }
  if (audience === 'bookings' || audience === 'all') {
    const bookings = await Booking.find().select('email phone name').lean();
    bookings.forEach((b: any) => add(b.email, b.phone, b.name));
  }
  if (audience === 'invoiced' || audience === 'all') {
    const invs = await Invoice.find().select('client').lean();
    invs.forEach((i: any) => add(i.client?.email, i.client?.phone, i.client?.name));
  }

  return Array.from(records.values()).filter(r => channel === 'email' ? !!r.email : !!r.phone);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { audience, channel, subject, message, dryRun } = await req.json();
    if (!audience || !channel || !message) {
      return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 });
    }

    const recipients = await buildAudience(audience, channel);

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        count: recipients.length,
        sample: recipients.slice(0, 5),
      });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send sequentially to avoid rate-limit spikes
    for (const r of recipients) {
      try {
        if (channel === 'email' && r.email) {
          await sendEmail({
            to: r.email,
            subject: subject || 'A note from aeTech Digital Hub',
            html: emailLayout({
              heading: subject || 'A note from aeTech Digital Hub',
              body: `<div style="white-space:pre-wrap;line-height:1.7;">${escapeHtml(message)}</div>`,
            }),
          });
          sent++;
        } else if (channel === 'sms' && r.phone) {
          const result = await sendSms({ to: r.phone, message });
          if (result.ok) sent++;
          else { failed++; errors.push(`${r.phone}: ${result.error || 'send failed'}`); }
        }
      } catch (e: any) {
        failed++;
        errors.push(`${r.email || r.phone}: ${e.message}`);
      }
    }

    return NextResponse.json({ ok: true, sent, failed, total: recipients.length, errors: errors.slice(0, 10) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
