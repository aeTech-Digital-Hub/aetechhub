'use client';
import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { track } from '@/components/marketing/Tracker';

export function ContactForm() {
  const [data, setData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      track('contact_submitted');
      setDone(true);
    } catch { alert('Something went wrong.'); }
    finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="border border-rule bg-cream p-10">
        <CheckCircle2 className="w-10 h-10 text-purple-700 mb-5" strokeWidth={1.2} />
        <h2 className="h-display text-3xl mb-3">Got it. Thank you.</h2>
        <p className="text-ink/70 leading-relaxed">A confirmation has been sent to <strong>{data.email}</strong>. We'll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-rule bg-bone p-6 lg:p-10 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Inp label="Name *"    val={data.name}   set={(v) => setData({ ...data, name: v })} />
        <Inp label="Email *"   val={data.email}  set={(v) => setData({ ...data, email: v })} type="email" />
        <Inp label="Phone"     val={data.phone}  set={(v) => setData({ ...data, phone: v })} type="tel" />
        <Inp label="Subject"   val={data.subject} set={(v) => setData({ ...data, subject: v })} />
      </div>
      <div>
        <label className="eyebrow text-ink/70 mb-3 block">Message *</label>
        <textarea value={data.message} onChange={(e) => setData({ ...data, message: e.target.value })} rows={6} required className="w-full border border-rule rounded-lg p-4 focus:outline-none focus:border-purple-700 text-base bg-bone" />
      </div>
      <button disabled={busy} className="btn-primary disabled:opacity-30">
        {busy ? 'Sending…' : 'Send message'} <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </form>
  );
}

function Inp({ label, val, set, type = 'text' }: { label: string; val: string; set: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="eyebrow text-ink/70 mb-2 block">{label}</label>
      <input type={type} value={val} onChange={(e) => set(e.target.value)} required={label.includes('*')} className="w-full border-b border-ink/20 bg-transparent py-2.5 focus:outline-none focus:border-purple-700 text-base" />
    </div>
  );
}
