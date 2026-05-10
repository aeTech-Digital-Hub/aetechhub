import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Booking } from '@/models';
import { requireAdmin } from '@/lib/auth-server';
import { sendEmail, emailLayout } from '@/lib/notify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await dbConnect();
    const b = await Booking.create(body);

    const adminEmail = process.env.ADMIN_EMAIL || 'ephraim@aetechdigitalhub.com';
    const dateStr = new Date(b.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (b.email) {
      sendEmail({
        to: b.email,
        subject: `Your call is booked — ${dateStr} at ${b.timeSlot}`,
        html: emailLayout({
          heading: `Booking confirmed.`,
          body: `
            <p>Hi ${(b.name || '').split(' ')[0]},</p>
            <p>Your call with the aeTech team is set for:</p>
            <p style="background:#FAF8F5;padding:16px;border-left:3px solid #C9A84C;font-size:16px;font-family:Georgia,serif;">
              ${dateStr}<br>${b.timeSlot} GMT · 30 minutes
            </p>
            <p>You'll receive a Google Meet link 24 hours before the call. If anything changes, simply reply to this email.</p>
          `,
        }),
      }).catch(() => {});
    }

    sendEmail({
      to: adminEmail,
      subject: `New call booked: ${b.name} on ${dateStr} ${b.timeSlot}`,
      html: emailLayout({
        heading: 'New call booking',
        body: `
          <p><strong>${b.name}</strong> &lt;${b.email}&gt; booked a call.</p>
          <p style="background:#FAF8F5;padding:16px;border-left:3px solid #2D0D50;font-size:14px;">
            <strong>When:</strong> ${dateStr} at ${b.timeSlot}<br>
            <strong>Phone:</strong> ${b.phone || '—'}<br>
            <strong>Topic:</strong> ${b.topic || '—'}
          </p>
        `,
      }),
      replyTo: b.email,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: b._id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }
  await dbConnect();
  const items = await Booking.find().sort({ date: 1 }).lean();
  return NextResponse.json({ items });
}
