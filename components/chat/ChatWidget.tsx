'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

type Msg = { sender: 'client' | 'admin' | 'system'; text: string; createdAt: string; name?: string };

function getSession() {
  if (typeof window === 'undefined') return '';
  let s = localStorage.getItem('ae-chat-session');
  if (!s) { s = `c_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; localStorage.setItem('ae-chat-session', s); }
  return s;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [introDone, setIntroDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load existing session
  useEffect(() => {
    const sid = getSession();
    if (!sid) return;
    const saved = localStorage.getItem('ae-chat-info');
    if (saved) { try { const j = JSON.parse(saved); setName(j.name); setEmail(j.email); setIntroDone(true); } catch {} }
    fetch(`/api/messages?sessionId=${sid}`).then((r) => r.json()).then((d) => setMsgs(d.items || []));
  }, []);

  // Poll for admin replies every 5s when open
  useEffect(() => {
    if (!open || !introDone) return;
    const sid = getSession();
    const i = setInterval(() => {
      fetch(`/api/messages?sessionId=${sid}`).then((r) => r.json()).then((d) => setMsgs(d.items || []));
    }, 5000);
    return () => clearInterval(i);
  }, [open, introDone]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, open]);

  async function intro(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    localStorage.setItem('ae-chat-info', JSON.stringify({ name, email }));
    setIntroDone(true);
    await send(`Hi, I'm ${name}.`, true);
  }

  async function send(textArg?: string, isIntro = false) {
    const sid = getSession();
    const body = textArg ?? text;
    if (!body.trim()) return;
    if (!isIntro) setText('');
    setMsgs((prev) => [...prev, { sender: 'client', text: body, createdAt: new Date().toISOString(), name }]);
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, sender: 'client', text: body, name, email }),
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-ink text-bone shadow-2xl grid place-items-center hover:bg-purple-700 transition-colors"
        aria-label="Open chat"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[520px] bg-bone border border-rule rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-down">
          <div className="bg-ink text-bone px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-display text-lg leading-tight">Talk to us</p>
              <p className="text-[11px] text-bone/60 tracking-wider uppercase">Usually replies in &lt; 1 hour</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          {!introDone ? (
            <form onSubmit={intro} className="flex-1 flex flex-col p-5 gap-4">
              <p className="text-sm text-ink/70">Hi 👋 — quick intro before we chat?</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-700" required />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-700" required />
              <button className="btn-primary justify-center mt-auto">Start chatting</button>
            </form>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgs.length === 0 && (
                  <div className="text-sm text-ink/60 italic">Send us a message and someone from the team will get back to you shortly.</div>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className={`max-w-[80%] ${m.sender === 'client' ? 'ml-auto' : ''}`}>
                    <div className={`px-3.5 py-2 rounded-2xl text-sm ${m.sender === 'client' ? 'bg-ink text-bone' : 'bg-purple-100 text-ink'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="border-t border-rule p-3 flex gap-2"
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-2 text-sm focus:outline-none bg-transparent"
                />
                <button className="w-9 h-9 rounded-full bg-ink text-bone grid place-items-center hover:bg-purple-700">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
