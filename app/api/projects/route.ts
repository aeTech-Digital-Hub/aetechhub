import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Brief } from '@/models/Project';
import { requireAdmin } from '@/lib/auth-server';
import { sendEmail, emailLayout } from '@/lib/notify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await dbConnect();
    const brief = await Brief.create(body);

    const adminEmail = process.env.ADMIN_EMAIL || 'ephraim@aetechdigitalhub.com';
    const baseUrl = process.env.NEXTAUTH_URL || 'https://aetechdigitalhub.com';

    if (brief.email) {
      sendEmail({
        to: brief.email,
        subject: 'We received your brief — aeTech Digital Hub',
        html: emailLayout({
          heading: `Hi ${(brief.name || '').split(' ')[0]}, thanks for the brief.`,
          body: `
            <p>We've received your project request and someone from the team will review it personally and get back to you within <strong>48 hours</strong>.</p>
            <p>For reference, here's a summary of what you sent:</p>
            <p style="background:#FAF8F5;padding:16px;border-left:3px solid #C9A84C;font-size:14px;">
              <strong>Services:</strong> ${(brief.services || []).join(', ') || '—'}<br>
              <strong>Budget:</strong> ${brief.budget || '—'}<br>
              <strong>Timeline:</strong> ${brief.timeline || '—'}
            </p>
            <p>If you'd like to add anything before we reach out, simply reply to this email.</p>
          `,
          cta: { label: 'Book a discovery call', href: `${baseUrl}/book` },
        }),
      }).catch(() => {});
    }

    sendEmail({
      to: adminEmail,
      subject: `New brief: ${brief.name} — ${(brief.services || []).join(', ') || 'general'}`,
      html: emailLayout({
        heading: 'New project brief received',
        body: `
          <p><strong>${brief.name}</strong> &lt;${brief.email}&gt;${brief.company ? ` from ${brief.company}` : ''} just submitted a brief.</p>
          <p style="background:#FAF8F5;padding:16px;border-left:3px solid #2D0D50;font-size:14px;">
            <strong>Project type:</strong> ${brief.projectType || '—'}<br>
            <strong>Services:</strong> ${(brief.services || []).join(', ') || '—'}<br>
            <strong>Budget:</strong> ${brief.budget || '—'}<br>
            <strong>Timeline:</strong> ${brief.timeline || '—'}<br>
            <strong>Phone:</strong> ${brief.phone || '—'}
          </p>
          <p style="white-space:pre-wrap;">${brief.summary || ''}</p>
        `,
        cta: { label: 'Open in admin', href: `${baseUrl}/admin/projects` },
      }),
      replyTo: brief.email,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: brief._id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const items = await Brief.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ ok: true, items });
}
