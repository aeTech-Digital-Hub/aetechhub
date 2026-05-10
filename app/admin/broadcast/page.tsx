'use client';
import { useState } from 'react';
import { Send, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

const AUDIENCES = [
  { id: 'subscribers', label: 'Newsletter subscribers', desc: 'Everyone who joined the newsletter' },
  { id: 'briefs',      label: 'Brief submitters',       desc: 'Anyone who has filed a project brief' },
  { id: 'bookings',    label: 'Call bookers',           desc: 'People who booked a discovery call' },
  { id: 'invoiced',    label: 'Invoiced clients',       desc: 'Clients with at least one invoice' },
  { id: 'all',         label: 'Everyone',               desc: 'Combined, deduplicated audience' },
];

export default function BroadcastPage() {
  const [channel, setChannel]     = useState<'email' | 'sms'>('email');
  const [audience, setAudience]   = useState<string>('subscribers');
  const [subject, setSubject]     = useState('');
  const [message, setMessage]     = useState('');
  const [preview, setPreview]     = useState<{ count: number; sample: any[] } | null>(null);
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState<any>(null);

  async function dryRun() {
    setResult(null);
    const r = await fetch('/api/admin/broadcast', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience, channel, subject, message, dryRun: true }),
    });
    const d = await r.json();
    if (d.ok) setPreview({ count: d.count, sample: d.sample });
  }

  async function broadcast() {
    if (!message.trim()) return;
    if (!confirm(`This will send to ${preview?.count ?? '?'} ${channel === 'email' ? 'emails' : 'phone numbers'}. Continue?`)) return;
    setSending(true); setResult(null);
    const r = await fetch('/api/admin/broadcast', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience, channel, subject, message }),
    });
    const d = await r.json();
    setSending(false);
    setResult(d);
  }

  const charCount = message.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">— Broadcast</p>
        <h1 className="h-display text-4xl">Send to many</h1>
        <p className="text-sm text-ink/60 mt-2">Reach your full audience — newsletter, prospects, or invoiced clients — in one go.</p>
      </div>

      <div className="border border-amber-300 bg-amber-50 p-4 text-sm flex gap-3">
        <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="text-amber-900">
          Use this tool sparingly. People opted in for occasional dispatches, not promotional volume. Always run a <strong>dry-run preview</strong> before sending.
        </div>
      </div>

      {/* Channel */}
      <Section title="Channel">
        <div className="grid grid-cols-2 gap-2">
          {(['email', 'sms'] as const).map(c => (
            <button key={c} onClick={() => setChannel(c)} className={`p-4 border rounded-lg text-left ${channel === c ? 'bg-ink text-bone border-ink' : 'bg-bone border-rule hover:border-purple-700'}`}>
              <p className="font-display text-lg capitalize">{c}</p>
              <p className={`text-xs mt-1 ${channel === c ? 'text-bone/70' : 'text-ink/50'}`}>
                {c === 'email' ? 'Branded HTML email via SMTP' : 'SMS via Termii or Twilio'}
              </p>
            </button>
          ))}
        </div>
      </Section>

      {/* Audience */}
      <Section title="Audience">
        <div className="space-y-2">
          {AUDIENCES.map(a => (
            <label key={a.id} className={`block p-4 border rounded-lg cursor-pointer ${audience === a.id ? 'bg-cream border-purple-700' : 'bg-bone border-rule hover:border-purple-300'}`}>
              <div className="flex items-baseline gap-3">
                <input type="radio" checked={audience === a.id} onChange={() => setAudience(a.id)} />
                <div className="flex-1">
                  <p className="font-medium">{a.label}</p>
                  <p className="text-xs text-ink/50">{a.desc}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Compose */}
      <Section title="Compose">
        {channel === 'email' && (
          <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-rule px-3 py-2 mb-3 focus:outline-none focus:border-purple-700" />
        )}
        <textarea
          placeholder={channel === 'email' ? 'Write your email…' : 'SMS message (160 chars per segment)'}
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={channel === 'sms' ? 4 : 10}
          className="w-full border border-rule p-3 text-sm focus:outline-none focus:border-purple-700"
        />
        {channel === 'sms' && (
          <p className="text-[11px] text-ink/50 mt-2">{charCount} characters · {smsSegments} segment{smsSegments > 1 ? 's' : ''} per recipient</p>
        )}
      </Section>

      {/* Preview & Send */}
      <div className="flex gap-3">
        <button onClick={dryRun} disabled={!message} className="btn-ghost disabled:opacity-30">
          <Users className="w-4 h-4" /> Preview audience
        </button>
        {preview && (
          <button onClick={broadcast} disabled={sending} className="btn-primary disabled:opacity-30">
            <Send className="w-4 h-4" /> {sending ? 'Sending…' : `Send to ${preview.count}`}
          </button>
        )}
      </div>

      {preview && (
        <div className="border border-rule bg-bone p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-3">Audience preview</p>
          <p className="font-display text-2xl mb-3">{preview.count} recipients</p>
          {preview.sample.length > 0 && (
            <div className="text-xs space-y-1">
              <p className="text-ink/50">Sample:</p>
              {preview.sample.map((s: any, i: number) => (
                <p key={i} className="font-mono">{s.name || '—'} · {s.email || s.phone}</p>
              ))}
              {preview.count > preview.sample.length && <p className="text-ink/40">…and {preview.count - preview.sample.length} more</p>}
            </div>
          )}
        </div>
      )}

      {result && (
        <div className={`border p-5 ${result.ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <div className="flex gap-3">
            {result.ok ? <CheckCircle2 className="w-5 h-5 text-green-700 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0" />}
            <div>
              {result.ok ? (
                <>
                  <p className="font-medium">Broadcast complete</p>
                  <p className="text-sm mt-1">Sent to {result.sent} of {result.total} recipients{result.failed ? ` · ${result.failed} failed` : ''}.</p>
                  {result.errors?.length > 0 && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer">Show errors</summary>
                      <pre className="mt-2 whitespace-pre-wrap">{result.errors.join('\n')}</pre>
                    </details>
                  )}
                </>
              ) : (
                <p className="font-medium text-red-900">Failed: {result.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-3">— {title}</p>
      {children}
    </div>
  );
}
