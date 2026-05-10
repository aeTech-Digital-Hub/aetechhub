'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Trash2, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/uiSlice';

const STATUSES = ['new', 'reviewing', 'in-discussion', 'quoted', 'won', 'lost', 'archived'];

export default function BriefDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [showSms, setShowSms] = useState(false);
  const [replySubj, setReplySubj] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [smsMsg, setSmsMsg] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { setItem(d.item); setLoading(false); });
  }, [id]);

  if (loading) return <p className="text-ink/50 italic">Loading…</p>;
  if (!item)   return <p className="text-ink/50 italic">Not found.</p>;

  async function save(patch: any) {
    setSaving(true);
    const res = await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    const d = await res.json();
    if (d.item) setItem(d.item);
    setSaving(false);
    dispatch(pushToast('Saved', 'success'));
  }

  async function sendReply() {
    const res = await fetch('/api/admin/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: item.email,
        subject: replySubj || `Re: your project brief — aeTech Digital Hub`,
        message: replyBody,
        contextLabel: `Brief: ${item.name}`,
      }),
    });
    const d = await res.json();
    if (d.ok) {
      dispatch(pushToast('Email sent', 'success'));
      setShowReply(false); setReplySubj(''); setReplyBody('');
    } else {
      dispatch(pushToast(`Failed: ${d.error}`, 'error'));
    }
  }

  async function sendSms() {
    const res = await fetch('/api/admin/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: item.phone, message: smsMsg }),
    });
    const d = await res.json();
    if (d.ok) {
      dispatch(pushToast('SMS sent', 'success'));
      setShowSms(false); setSmsMsg('');
    } else {
      dispatch(pushToast(`Failed: ${d.error}`, 'error'));
    }
  }

  async function del() {
    if (!confirm('Delete this brief?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    dispatch(pushToast('Brief deleted', 'info'));
    router.push('/admin/projects');
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <Link href="/admin/projects" className="text-sm text-ink/60 hover:text-purple-700 inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> All briefs
      </Link>

      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">Brief · {formatDate(item.createdAt)}</p>
          <h1 className="h-display text-4xl">{item.name}</h1>
          <p className="text-sm text-ink/60 mt-1">{item.email}{item.company ? ` · ${item.company}` : ''}{item.phone ? ` · ${item.phone}` : ''}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {item.email && <button onClick={() => setShowReply(true)} className="btn-primary !py-2 !text-xs"><Mail className="w-3.5 h-3.5" /> Reply via email</button>}
          {item.phone && <button onClick={() => setShowSms(true)}   className="btn-ghost !py-2 !text-xs"><MessageSquare className="w-3.5 h-3.5" /> Send SMS</button>}
          <button onClick={del} className="text-red-700 hover:bg-red-50 px-3 py-2 rounded-full text-xs flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
        </div>
      </div>

      {showReply && (
        <div className="fixed inset-0 bg-ink/50 z-50 grid place-items-center p-4" onClick={() => setShowReply(false)}>
          <div className="bg-bone w-full max-w-2xl border border-rule" onClick={e => e.stopPropagation()}>
            <div className="border-b border-rule p-5"><h3 className="font-display text-xl">Reply to {item.name}</h3><p className="text-xs text-ink/60">to: {item.email}</p></div>
            <div className="p-5 space-y-4">
              <input placeholder="Subject" value={replySubj} onChange={e => setReplySubj(e.target.value)} className="w-full border border-rule px-3 py-2 text-sm focus:outline-none focus:border-purple-700" />
              <textarea placeholder="Write your reply…" value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={10} className="w-full border border-rule p-3 text-sm focus:outline-none focus:border-purple-700" />
            </div>
            <div className="border-t border-rule p-4 flex justify-end gap-2">
              <button onClick={() => setShowReply(false)} className="text-sm text-ink/60 hover:text-ink px-3 py-2">Cancel</button>
              <button onClick={sendReply} disabled={!replyBody} className="btn-primary !py-2 !text-xs disabled:opacity-30"><Send className="w-3.5 h-3.5" /> Send email</button>
            </div>
          </div>
        </div>
      )}

      {showSms && (
        <div className="fixed inset-0 bg-ink/50 z-50 grid place-items-center p-4" onClick={() => setShowSms(false)}>
          <div className="bg-bone w-full max-w-md border border-rule" onClick={e => e.stopPropagation()}>
            <div className="border-b border-rule p-5"><h3 className="font-display text-xl">Send SMS to {item.name}</h3><p className="text-xs text-ink/60">to: {item.phone}</p></div>
            <div className="p-5 space-y-2">
              <textarea placeholder="Type your message…" value={smsMsg} onChange={e => setSmsMsg(e.target.value)} rows={5} className="w-full border border-rule p-3 text-sm focus:outline-none focus:border-purple-700" />
              <p className="text-[11px] text-ink/50">{smsMsg.length} characters · {Math.ceil(smsMsg.length / 160) || 1} message(s)</p>
            </div>
            <div className="border-t border-rule p-4 flex justify-end gap-2">
              <button onClick={() => setShowSms(false)} className="text-sm text-ink/60 hover:text-ink px-3 py-2">Cancel</button>
              <button onClick={sendSms} disabled={!smsMsg} className="btn-primary !py-2 !text-xs disabled:opacity-30"><Send className="w-3.5 h-3.5" /> Send SMS</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Summary"><p className="text-ink/80 leading-relaxed whitespace-pre-wrap">{item.summary || '—'}</p></Section>

          {item.aiScopeTranscript?.length > 0 && (
            <Section title="Scoping conversation">
              <div className="space-y-3">
                {item.aiScopeTranscript.map((t: any, i: number) => (
                  <div key={i} className="text-sm">
                    <p className="text-ink/60">Q: {t.q}</p>
                    <p className="font-medium">A: {t.a}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Internal notes">
            <textarea
              defaultValue={item.notes}
              onBlur={e => save({ notes: e.target.value })}
              rows={6}
              placeholder="Notes only your team will see…"
              className="w-full border border-rule p-3 text-sm focus:outline-none focus:border-purple-700"
            />
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Status">
            <select
              value={item.status}
              onChange={e => save({ status: e.target.value })}
              className="w-full border border-rule px-3 py-2 text-sm focus:outline-none focus:border-purple-700"
            >
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            {saving && <p className="text-xs text-ink/50 mt-2">Saving…</p>}
          </Section>

          <Section title="Project details">
            <Detail label="Type"     value={item.projectType} />
            <Detail label="Services" value={(item.services || []).join(', ')} />
            <Detail label="Budget"   value={item.budget} />
            <Detail label="Timeline" value={item.timeline} />
          </Section>

          {(item.suggestedPackage || item.estimatedCost) && (
            <Section title="AI recommendation">
              <Detail label="Package"  value={item.suggestedPackage} />
              <Detail label="Estimate" value={item.estimatedCost ? `$${item.estimatedCost.toLocaleString()}` : undefined} />
            </Section>
          )}

          <Link href={`/admin/invoices/new?briefId=${item._id}`} className="btn-primary justify-center w-full !text-xs">Create invoice from brief →</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-rule bg-bone p-5">
      <p className="font-mono text-[10.5px] uppercase tracking-wider text-purple-700 mb-3">— {title}</p>
      {children}
    </div>
  );
}
function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-baseline border-b border-rule py-2 last:border-0 text-sm">
      <span className="text-ink/50 text-xs">{label}</span>
      <span className="text-right">{value || '—'}</span>
    </div>
  );
}
