import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Invoice } from '@/models/Invoice';
import { requireAdmin } from '@/lib/auth-server';
import { sendEmail, emailLayout } from '@/lib/notify';
import { formatCurrency, formatDate } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await dbConnect();
  const { id } = await req.json();
  const inv: any = await Invoice.findById(id).lean();
  if (!inv) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  if (!inv.client?.email) return NextResponse.json({ ok: false, error: 'client email missing' }, { status: 400 });

  const itemRows = (inv.items || []).map((it: any) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;">${it.description}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${it.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:13px;">${formatCurrency(it.rate, inv.currency)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-family:monospace;">${formatCurrency(it.amount, inv.currency)}</td>
    </tr>
  `).join('');

  const html = emailLayout({
    heading: `Invoice ${inv.invoiceNo}`,
    body: `
      <p>Dear ${inv.client.name},</p>
      <p>Please find your invoice below from aeTech Digital Hub. Total due: <strong>${formatCurrency(inv.total || 0, inv.currency)}</strong>${inv.dueDate ? ` by <strong>${formatDate(inv.dueDate)}</strong>` : ''}.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:2px solid #2D0D50;">
        <tr style="background:#FAF8F5;">
          <th style="padding:10px 0;text-align:left;font-size:11px;letter-spacing:0.1em;color:#5C5448;text-transform:uppercase;">Description</th>
          <th style="padding:10px 0;text-align:center;font-size:11px;letter-spacing:0.1em;color:#5C5448;text-transform:uppercase;">Qty</th>
          <th style="padding:10px 0;text-align:right;font-size:11px;letter-spacing:0.1em;color:#5C5448;text-transform:uppercase;">Rate</th>
          <th style="padding:10px 0;text-align:right;font-size:11px;letter-spacing:0.1em;color:#5C5448;text-transform:uppercase;">Amount</th>
        </tr>
        ${itemRows}
        <tr><td colspan="3" style="padding:14px 0;text-align:right;font-size:14px;color:#5C5448;">Subtotal</td><td style="padding:14px 0;text-align:right;font-family:monospace;">${formatCurrency(inv.subtotal || 0, inv.currency)}</td></tr>
        ${inv.discountAmount ? `<tr><td colspan="3" style="padding:6px 0;text-align:right;font-size:14px;color:#5C5448;">Discount (${inv.discountPct}%)</td><td style="padding:6px 0;text-align:right;font-family:monospace;">− ${formatCurrency(inv.discountAmount, inv.currency)}</td></tr>` : ''}
        ${inv.taxAmount ? `<tr><td colspan="3" style="padding:6px 0;text-align:right;font-size:14px;color:#5C5448;">Tax (${inv.taxPct}%)</td><td style="padding:6px 0;text-align:right;font-family:monospace;">${formatCurrency(inv.taxAmount, inv.currency)}</td></tr>` : ''}
        <tr><td colspan="3" style="padding:14px 0;text-align:right;font-size:16px;font-family:Georgia,serif;color:#2D0D50;border-top:2px solid #2D0D50;"><strong>Total Due</strong></td><td style="padding:14px 0;text-align:right;font-family:monospace;font-size:18px;color:#2D0D50;border-top:2px solid #2D0D50;"><strong>${formatCurrency(inv.total || 0, inv.currency)}</strong></td></tr>
      </table>
      ${inv.terms ? `<p style="margin-top:24px;background:#FAF8F5;padding:14px;border-left:3px solid #C9A84C;font-size:13px;white-space:pre-wrap;line-height:1.6;">${inv.terms}</p>` : ''}
    `,
  });

  await sendEmail({
    to: inv.client.email,
    subject: `Invoice ${inv.invoiceNo} from aeTech Digital Hub — ${formatCurrency(inv.total || 0, inv.currency)}`,
    html,
  });

  // Update status to sent if it was draft
  if (inv.status === 'draft') {
    await Invoice.findByIdAndUpdate(id, { status: 'sent' });
  }

  return NextResponse.json({ ok: true });
}
