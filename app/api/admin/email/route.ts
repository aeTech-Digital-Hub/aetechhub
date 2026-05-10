import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { sendEmail, emailLayout } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { to, subject, message, contextLabel } = await req.json();
    if (!to || !message)
      return NextResponse.json(
        { ok: false, error: "missing to/message" },
        { status: 400 },
      );

    const senderName = user?.name || "aeTech Digital Hub";
    const html = emailLayout({
      heading: subject || "A note from aeTech Digital Hub",
      body: `
        <div style="white-space:pre-wrap;line-height:1.7;">${escapeHtml(message)}</div>
        <p style="margin-top:32px;color:#5C5448;font-size:14px;">— ${escapeHtml(senderName)}<br>aeTech Digital Hub</p>
        ${contextLabel ? `<p style="font-size:11px;color:#9b9285;margin-top:24px;">Ref: ${escapeHtml(contextLabel)}</p>` : ""}
      `,
    });

    const result = await sendEmail({
      to,
      subject: subject || `A note from ${senderName}`,
      html,
      replyTo: user?.email || undefined,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
