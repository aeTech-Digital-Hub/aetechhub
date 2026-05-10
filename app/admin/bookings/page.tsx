"use client";
import { useEffect, useState } from "react";
import { Mail, MessageSquare, Send, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Booking = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  topic?: string;
  date: string;
  timeSlot: string;
  status: string;
  notes?: string;
};

export default function AdminBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    kind: "email" | "sms";
    booking: Booking;
  } | null>(null);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setLoading(false);
      });
  }, []);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  }

  async function send() {
    if (!modal || !text.trim()) return;
    setBusy(true);
    if (modal.kind === "email") {
      const r = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: modal.booking.email,
          subject:
            subject || `Re: your call on ${formatDate(modal.booking.date)}`,
          message: text,
          contextLabel: `Booking ${modal.booking.timeSlot} on ${formatDate(modal.booking.date)}`,
        }),
      });
      const d = await r.json();
      flash(d.ok ? "Email sent ✓" : `Failed: ${d.error}`);
    } else {
      const r = await fetch("/api/admin/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: modal.booking.phone, message: text }),
      });
      const d = await r.json();
      flash(d.ok ? "SMS sent ✓" : `Failed: ${d.error}`);
    }
    setBusy(false);
    setModal(null);
    setSubject("");
    setText("");
  }

  const upcoming = items.filter(
    (b) => new Date(b.date) >= new Date(new Date().setHours(0, 0, 0, 0)),
  );
  const past = items.filter(
    (b) => new Date(b.date) < new Date(new Date().setHours(0, 0, 0, 0)),
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">
          — Bookings
        </p>
        <h1 className="h-display text-4xl">Discovery calls</h1>
      </div>

      {toast && (
        <div className="border-l-4 border-purple-700 bg-purple-50 p-3 text-sm">
          {toast}
        </div>
      )}

      <Section
        title={`Upcoming (${upcoming.length})`}
        items={upcoming}
        loading={loading}
        onEmail={(b) => setModal({ kind: "email", booking: b })}
        onSms={(b) => setModal({ kind: "sms", booking: b })}
      />
      <Section
        title={`Past (${past.length})`}
        items={past}
        loading={loading}
        onEmail={(b) => setModal({ kind: "email", booking: b })}
        onSms={(b) => setModal({ kind: "sms", booking: b })}
      />

      {modal && (
        <div
          className="fixed inset-0 bg-ink/50 z-50 grid place-items-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-bone w-full max-w-2xl border border-rule"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-rule p-5 flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl">
                  {modal.kind === "email" ? "Email" : "SMS"}{" "}
                  {modal.booking.name}
                </h3>
                <p className="text-xs text-ink/60 mt-1">
                  to:{" "}
                  {modal.kind === "email"
                    ? modal.booking.email
                    : modal.booking.phone}
                </p>
                <p className="text-xs text-ink/40">
                  {formatDate(modal.booking.date)} · {modal.booking.timeSlot}
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="text-ink/50 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {modal.kind === "email" && (
                <input
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-rule px-3 py-2 text-sm focus:outline-none focus:border-purple-700"
                />
              )}
              <textarea
                placeholder={
                  modal.kind === "email"
                    ? "Write your message…"
                    : "SMS (160 chars per segment)"
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={modal.kind === "email" ? 8 : 4}
                className="w-full border border-rule p-3 text-sm focus:outline-none focus:border-purple-700"
              />
              {modal.kind === "sms" && (
                <p className="text-[11px] text-ink/50">
                  {text.length} chars · {Math.ceil(text.length / 160) || 1}{" "}
                  segment(s)
                </p>
              )}
            </div>
            <div className="border-t border-rule p-4 flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="text-sm text-ink/60 px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={send}
                disabled={busy || !text}
                className="btn-primary !py-2 !text-xs disabled:opacity-30"
              >
                <Send className="w-3.5 h-3.5" /> {busy ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  loading,
  onEmail,
  onSms,
}: {
  title: string;
  items: Booking[];
  loading: boolean;
  onEmail: (b: Booking) => void;
  onSms: (b: Booking) => void;
}) {
  if (loading)
    return (
      <div>
        <h2 className="font-display text-2xl mb-3">{title}</h2>
        <p className="text-sm text-ink/50 italic p-4">Loading…</p>
      </div>
    );

  return (
    <div>
      <h2 className="font-display text-2xl mb-3">{title}</h2>
      <div className="border border-rule bg-bone overflow-hidden">
        {items.length === 0 ? (
          <p className="text-sm text-ink/50 italic p-6">None.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream border-b border-rule">
              <tr className="text-left">
                <Th>Date</Th>
                <Th>Time</Th>
                <Th>Name</Th>
                <Th>Topic</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {items.map((b: Booking) => (
                <tr key={b._id} className="hover:bg-cream/50">
                  <Td className="text-xs">{formatDate(b.date)}</Td>
                  <Td className="font-mono text-xs">{b.timeSlot}</Td>
                  <Td>
                    <div>{b.name}</div>
                    <div className="text-xs text-ink/50">
                      {b.email}
                      {b.phone ? ` · ${b.phone}` : ""}
                    </div>
                  </Td>
                  <Td className="text-xs">{b.topic || "—"}</Td>
                  <Td>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {b.status}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEmail(b)}
                        className="text-purple-700 hover:underline text-xs flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" /> Email
                      </button>
                      {b.phone && (
                        <button
                          onClick={() => onSms(b)}
                          className="text-ink/60 hover:text-ink text-xs flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> SMS
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({ children }: any) {
  return (
    <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-ink/50 font-medium">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: any) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
