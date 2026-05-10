'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { formatDate, slugify } from '@/lib/utils';

export default function ResearchAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({ title: '', slug: '', category: 'research', excerpt: '', body: '', author: '', tags: '', readTime: 5, published: true });

  async function load() {
    const r = await fetch('/api/research?published=0');
    const d = await r.json();
    setItems(d.items || []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!draft.title) return;
    const payload = {
      ...draft,
      slug: draft.slug || slugify(draft.title),
      tags: draft.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    await fetch('/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setDraft({ title: '', slug: '', category: 'research', excerpt: '', body: '', author: '', tags: '', readTime: 5, published: true });
    setShowNew(false);
    load();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">— Research</p>
          <h1 className="h-display text-4xl">Articles</h1>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary"><Plus className="w-4 h-4" /> New article</button>
      </div>

      {showNew && (
        <div className="border border-rule bg-bone p-6 space-y-4">
          <input placeholder="Title *" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value, slug: slugify(e.target.value) })} className="w-full border-b border-rule py-2 focus:outline-none focus:border-purple-700" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Slug" value={draft.slug} onChange={e => setDraft({ ...draft, slug: e.target.value })} className="border-b border-rule py-2 text-sm font-mono focus:outline-none" />
            <select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} className="border border-rule px-3 py-2 text-sm">
              <option value="research">Research</option>
              <option value="engineering">Engineering</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
            </select>
            <input placeholder="Author" value={draft.author} onChange={e => setDraft({ ...draft, author: e.target.value })} className="border-b border-rule py-2 text-sm focus:outline-none" />
            <input type="number" placeholder="Read time (min)" value={draft.readTime} onChange={e => setDraft({ ...draft, readTime: Number(e.target.value) })} className="border-b border-rule py-2 text-sm focus:outline-none" />
          </div>
          <textarea placeholder="Excerpt" value={draft.excerpt} onChange={e => setDraft({ ...draft, excerpt: e.target.value })} rows={2} className="w-full border border-rule p-3 text-sm focus:outline-none focus:border-purple-700" />
          <textarea placeholder="Body" value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} rows={12} className="w-full border border-rule p-3 text-sm focus:outline-none focus:border-purple-700 font-serif" />
          <input placeholder="Tags (comma separated)" value={draft.tags} onChange={e => setDraft({ ...draft, tags: e.target.value })} className="w-full border-b border-rule py-2 text-sm focus:outline-none" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.published} onChange={e => setDraft({ ...draft, published: e.target.checked })} /> Publish immediately</label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNew(false)} className="text-sm text-ink/60 hover:text-ink px-3 py-2">Cancel</button>
            <button onClick={create} className="btn-primary !text-xs !py-2">Publish</button>
          </div>
        </div>
      )}

      <div className="border border-rule bg-bone divide-y divide-rule">
        {items.length === 0 && <p className="p-6 text-ink/50 italic">No articles yet.</p>}
        {items.map((a: any) => (
          <div key={a._id} className="p-5 flex items-baseline justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full mb-2 inline-block">{a.category}</span>
              <h3 className="font-display text-xl">{a.title}</h3>
              <p className="text-xs text-ink/50 mt-1">{a.author} · {a.readTime} min · {a.publishedAt ? formatDate(a.publishedAt) : 'unpublished'}</p>
            </div>
            <Link href={`/research/${a.slug}`} target="_blank" className="text-xs text-purple-700 hover:underline">View →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
