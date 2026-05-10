import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailLayout } from '@/lib/notify';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, phone } = await req.json();
    if (!name || !email || !message) return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 });

    const adminEmail = process.env.ADMIN_EMAIL || 'ephraim@aetechdigitalhub.com';

    // To client
    sendEmail({
      to: email,
      subject: 'We received your message — aeTech Digital Hub',
      html: emailLayout({
        heading: `Hi ${name.split(' ')[0]}, we got your message.`,
        body: `
          <p>Thank you for reaching out. We've received your note and someone from the team will get back to you shortly.</p>
          <p style="background:#FAF8F5;padding:16px;border-left:3px solid #C9A84C;font-size:14px;white-space:pre-wrap;">${message}</p>
        `,
      }),
    }).catch(() => {});

    // To admin
    sendEmail({
      to: adminEmail,
      subject: `Contact form: ${subject || `from ${name}`}`,
      html: emailLayout({
        heading: 'New contact message',
        body: `
          <p><strong>${name}</strong> &lt;${email}&gt; wrote:</p>
          ${phone ? `<p style="font-size:14px;color:#5C5448;">Phone: ${phone}</p>` : ''}
          <p style="background:#FAF8F5;padding:16px;border-left:3px solid #2D0D50;font-size:14px;white-space:pre-wrap;">${message}</p>
        `,
      }),
      replyTo: email,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
