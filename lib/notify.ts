import nodemailer from 'nodemailer';

// ── EMAIL ──────────────────────────────────────────
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
  return transporter;
}

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
};

export async function sendEmail(payload: EmailPayload) {
  const t = getTransporter();
  const from = process.env.SMTP_FROM || 'aeTech Digital Hub <hello@aetechdigitalhub.com>';
  if (!t) {
    console.warn('[email] SMTP not configured, would send:', payload.subject, '→', payload.to);
    return { ok: true, mocked: true };
  }
  const info = await t.sendMail({ from, ...payload });
  return { ok: true, messageId: info.messageId };
}

// ── BRANDED HTML WRAPPER ───────────────────────────
export function emailLayout({ heading, body, cta }: { heading: string; body: string; cta?: { label: string; href: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://aetechdigitalhub.com';
  const logoUrl = `${baseUrl}/aetech-logo-light.png`;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:Inter,Helvetica,Arial,sans-serif;color:#0E0A1A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E8E2DA;">
        <!-- header -->
        <tr><td style="background:#2D0D50;padding:24px 32px;color:#fff;">
          <table width="100%"><tr>
            <td style="vertical-align:middle;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="vertical-align:middle;padding-right:12px;">
                  <img src="${logoUrl}" width="36" height="36" alt="aeTech" style="display:block;width:36px;height:36px;" />
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-family:Georgia,serif;font-size:22px;letter-spacing:-0.02em;color:#fff;">aeTech<span style="font-style:italic;font-weight:300;"> Digital Hub</span></span>
                </td>
              </tr></table>
            </td>
            <td align="right" style="font-size:11px;color:#E8D5F5;letter-spacing:0.12em;text-transform:uppercase;vertical-align:middle;">…You dream, We build</td>
          </tr></table>
        </td></tr>
        <tr><td style="height:3px;background:#C9A84C;"></td></tr>
        <!-- body -->
        <tr><td style="padding:48px 40px;">
          <h1 style="font-family:Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;letter-spacing:-0.025em;margin:0 0 24px;color:#0E0A1A;">${heading}</h1>
          <div style="font-size:15px;line-height:1.7;color:#3a3149;">${body}</div>
          ${cta ? `<table cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td style="background:#0E0A1A;border-radius:999px;"><a href="${cta.href}" style="display:inline-block;color:#fff;text-decoration:none;padding:14px 28px;font-size:14px;font-weight:500;letter-spacing:0.01em;">${cta.label} →</a></td></tr></table>` : ''}
        </td></tr>
        <!-- footer -->
        <tr><td style="border-top:1px solid #E8E2DA;padding:24px 40px;font-size:12px;color:#5C5448;line-height:1.6;">
          aeTech Digital Hub · Spintex Flower Port, Accra, Ghana<br>
          <a href="mailto:ephraim@aetechdigitalhub.com" style="color:#5C3373;">ephraim@aetechdigitalhub.com</a> · +233 554 448 061
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

// ── SMS ────────────────────────────────────────────
// Supports Termii (default for Ghana/West Africa) + Twilio fallback
export type SmsPayload = { to: string; message: string };

export async function sendSms({ to, message }: SmsPayload) {
  // Normalize phone — assume +233 if Ghana number without country code
  let normalized = to.replace(/[^\d+]/g, '');
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('0')) normalized = '+233' + normalized.slice(1);
    else if (normalized.startsWith('233')) normalized = '+' + normalized;
    else normalized = '+233' + normalized;
  }

  if (process.env.TERMII_API_KEY) {
    try {
      const res = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TERMII_API_KEY,
          to: normalized.replace('+', ''),
          from: process.env.TERMII_SENDER || 'aeTech',
          sms: message,
          type: 'plain',
          channel: 'generic',
        }),
      });
      const data = await res.json();
      return { ok: res.ok, provider: 'termii', data };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  if (process.env.TWILIO_SID) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_SID}:${process.env.TWILIO_TOKEN}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: process.env.TWILIO_FROM!, To: normalized, Body: message }).toString(),
      });
      const data = await res.json();
      return { ok: res.ok, provider: 'twilio', data };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  console.warn('[sms] No provider configured, would send:', normalized, '→', message);
  return { ok: true, mocked: true };
}
