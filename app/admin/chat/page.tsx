'use client';
import { useEffect, useState } from 'react';
import { Send, Search } from 'lucide-react';

type Session = { sessionId: string; lastText: string; name?: string; email?: string; updatedAt: string; unread?: number };

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<string>('');
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');

  // Load sessions list
  async function loadSessions() {
    const r = await fetch('/api/admin/chat/sessions');
    const d = await r.json();
    setSessions(d.items || []);
  }
  async function loadMessages(sid: string) {
    const r = await fetch(`/api/messages?sessionId=${sid}`);
    const d = await r.json();
    setMsgs(d.items || []);
  }

  useEffect(() => { loadSessions(); const i = setInterval(loadSessions, 8000); return () => clearInterval(i); }, []);
  useEffect(() => {
    if (!active) return;
    loadMessages(active);
    const i = setInterval(() => loadMessages(active), 5000);
    return () => clearInterval(i);
  }, [active]);

  async function send() {
    if (!active || !text.trim()) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: active, sender: 'admin', text }),
    });
    // Also email the client so they don't miss the reply
    if (activeSession?.email) {
      fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: activeSession.email,
          subject: 'A reply from aeTech Digital Hub',
          message: text + '\n\n— You can also continue the conversation in the chat on our website.',
          contextLabel: `Chat session ${active}`,
        }),
      }).catch(() => {});
    }
    setText('');
    loadMessages(active);
  }

  const filtered = sessions.filter(s =>
    !q || `${s.name || ''} ${s.email || ''} ${s.lastText || ''}`.toLowerCase().includes(q.toLowerCase())
  );
  const activeSession = sessions.find(s => s.sessionId === active);

  return (
    <div>
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">— Live chat</p>
        <h1 className="h-display text-4xl">Conversations</h1>
      </div>

      <div className="grid grid-cols-12 gap-px bg-rule border border-rule h-[calc(100vh-220px)]">
        {/* Sidebar */}
        <div className="col-span-4 bg-bone overflow-hidden flex flex-col">
          <div className="p-3 border-b border-rule flex items-center gap-2">
            <Search className="w-4 h-4 text-ink/40" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="flex-1 text-sm focus:outline-none bg-transparent" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-rule">
            {filtered.length === 0 && <p className="p-5 text-sm text-ink/50 italic">No conversations yet.</p>}
            {filtered.map(s => (
              <button key={s.sessionId} onClick={() => setActive(s.sessionId)} className={`w-full text-left p-3 hover:bg-cream ${active === s.sessionId ? 'bg-cream' : ''}`}>
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="font-medium text-sm">{s.name || 'Anonymous'}</span>
                  {s.unread ? <span className="text-[10px] bg-purple-700 text-bone rounded-full w-4 h-4 grid place-items-center">{s.unread}</span> : null}
                </div>
                <p className="text-xs text-ink/50 truncate">{s.lastText}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation pane */}
        <div className="col-span-8 bg-bone flex flex-col">
          {!active ? (
            <div className="flex-1 grid place-items-center text-ink/40 italic text-sm">Select a conversation</div>
          ) : (
            <>
              <div className="p-4 border-b border-rule">
                <p className="font-display text-lg">{activeSession?.name || 'Anonymous'}</p>
                <p className="text-xs text-ink/50">{activeSession?.email || '—'}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgs.map((m, i) => (
                  <div key={i} className={`max-w-[70%] ${m.sender === 'admin' ? 'ml-auto text-right' : ''}`}>
                    <div className={`inline-block px-3.5 py-2 rounded-2xl text-sm ${m.sender === 'admin' ? 'bg-ink text-bone' : 'bg-purple-100'}`}>
                      {m.text}
                    </div>
                    <p className="text-[10px] text-ink/40 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={e => { e.preventDefault(); send(); }} className="border-t border-rule p-3 flex gap-2">
                <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a reply…" className="flex-1 px-3 py-2 text-sm focus:outline-none bg-transparent" />
                <button className="w-9 h-9 rounded-full bg-ink text-bone grid place-items-center hover:bg-purple-700"><Send className="w-4 h-4" /></button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
