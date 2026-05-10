'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { formatDate, slugify } from '@/lib/utils';

export default function AnnouncementsAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({ title: '', slug: '', type: 'announcement', excerpt: '', body: '', pinned: false, published: true });

  async function load() {
    const r = await fetch('/api/announcements?published=0');
    const d = await r.json();
    setItems(d.items || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!draft.title) return;
    const slug = draft.slug || slugify(draft.title);
    await fetch('/api/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, slug }),
    });
    setDraft({ title: '', slug: '', type: 'announcement', excerpt: '', body: '', pinned: false, published: true });
    setShowNew(false);
    load();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">— Announcements</p>
          <h1 className="h-display text-4xl">News & launches</h1>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary"><Plus className="w-4 h-4" /> New announcement</button>
      </div>

      {showNew && (
        <div className="border border-rule bg-bone p-6 space-y-4">
          <input placeholder="Title *" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value, slug: slugify(e.target.value) })} className="w-full border-b border-rule py-2 focus:outline-none focus:border-purple-700" />
          <input placeholder="Slug (auto from title)" value={draft.slug} onChange={e => setDraft({ ...draft, slug: e.target.value })} className="w-full border-b border-rule py-2 text-sm font-mono focus:outline-none" />
          <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })} className="border border-rule px-3 py-2 text-sm">
            <option value="announcement">Announcement</option>
            <option value="launch">Launch</option>
            <option value="patronage">Patronage</option>
            <option value="milestone">Milestone</option>
          </select>
          <textarea placeholder="One-line excerpt" value={draft.excerpt} onChange={e => setDraft({ ...draft, excerpt: e.target.value })} rows={2} className="w-full border border-rule p-3 text-sm focus:outline-none focus:border-purple-700" />
          <textarea placeholder="Body (plain text)" value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} rows={8} className="w-full border border-rule p-3 text-sm focus:outline-none focus:border-purple-700" />
          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.pinned} onChange={e => setDraft({ ...draft, pinned: e.target.checked })} /> Pin to top bar</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.published} onChange={e => setDraft({ ...draft, published: e.target.checked })} /> Publish immediately</label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNew(false)} className="text-sm text-ink/60 hover:text-ink px-3 py-2">Cancel</button>
            <button onClick={create} className="btn-primary !text-xs !py-2">Publish</button>
          </div>
        </div>
      )}

      <div className="border border-rule bg-bone divide-y divide-rule">
        {loading && <p className="p-6 text-ink/50 italic">Loading…</p>}
        {!loading && items.length === 0 && <p className="p-6 text-ink/50 italic">No announcements yet.</p>}
        {items.map((a: any) => (
          <div key={a._id} className="p-5 flex items-baseline justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">{a.type}</span>
                {a.pinned && <span className="text-[10px] text-accent">★ pinned</span>}
                {!a.published && <span className="text-[10px] text-ink/50">draft</span>}
              </div>
              <h3 className="font-display text-xl">{a.title}</h3>
              <p className="text-xs text-ink/50 mt-1">{a.publishedAt ? formatDate(a.publishedAt) : 'unpublished'}</p>
            </div>
            <Link href={`/announcements/${a.slug}`} target="_blank" className="text-xs text-purple-700 hover:underline">View public →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
