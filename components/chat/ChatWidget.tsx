"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, X, Send, RefreshCw, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────
type Msg = {
  sender: "client" | "admin" | "system";
  text: string;
  createdAt: string;
  name?: string;
  // Client-side only flags for optimistic UI + retry:
  clientId?: string; // uuid we generate for dedup vs server response
  pending?: boolean; // still in flight to server
  failed?: boolean; // send failed, offer retry
};

type ConnectionState = "ok" | "reconnecting" | "offline";

// ─── Constants ────────────────────────────────────────
const POLL_INTERVAL_MS = 5_000;
const POLL_INTERVAL_BACKOFF_MS = 30_000;
const MAX_BACKOFF_ERRORS = 2;

// ─── Session helper ───────────────────────────────────
function getSession(): string {
  if (typeof window === "undefined") return "";
  let s = localStorage.getItem("ae-chat-session");
  if (!s) {
    s = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("ae-chat-session", s);
  }
  return s;
}

function makeClientId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Safe fetch → JSON.
 * Returns null on any failure (network error, non-2xx, empty body, non-JSON).
 * Never throws to the caller — the chat widget should NEVER crash the app.
 */
async function safeFetchJson<T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [introDone, setIntroDone] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("ok");
  const [errorCount, setErrorCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Load session + saved intro ────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("ae-chat-info");
    if (saved) {
      try {
        const j = JSON.parse(saved);
        if (j.name) setName(j.name);
        if (j.email) setEmail(j.email);
        if (j.name && j.email) setIntroDone(true);
      } catch {
        // Corrupt localStorage — clear it, user re-enters
        localStorage.removeItem("ae-chat-info");
      }
    }
  }, []);

  // ─── Fetch messages from server, reconcile with local state ─
  const fetchMessages = useCallback(async () => {
    const sid = getSession();
    if (!sid) return;

    const data = await safeFetchJson<{ items: Msg[] }>(
      `/api/messages?sessionId=${encodeURIComponent(sid)}`,
    );

    if (!data) {
      // Fetch failed. Bump error count; set reconnecting/offline state.
      setErrorCount((n) => {
        const next = n + 1;
        setConnection(next >= MAX_BACKOFF_ERRORS ? "offline" : "reconnecting");
        return next;
      });
      return;
    }

    // Fetch succeeded. Reset error state.
    setErrorCount(0);
    setConnection("ok");

    // Reconcile: keep any pending/failed local messages, replace confirmed ones.
    setMsgs((prev) => {
      const serverItems = data.items || [];
      // Keep local pending messages that haven't been echoed by the server yet.
      const pendingLocal = prev.filter(
        (m) =>
          (m.pending || m.failed) &&
          !serverItems.some((s) => s.text === m.text && s.sender === m.sender),
      );
      return [...serverItems, ...pendingLocal];
    });
  }, []);

  // ─── Initial fetch when intro is done ──────────────
  useEffect(() => {
    if (!introDone) return;
    fetchMessages();
  }, [introDone, fetchMessages]);

  // ─── Polling with backoff + visibility awareness ──
  useEffect(() => {
    if (!open || !introDone) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      // Skip polling when tab is hidden — resume when it comes back
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        timer = setTimeout(tick, POLL_INTERVAL_MS);
        return;
      }
      await fetchMessages();
      if (cancelled) return;
      const delay =
        errorCount >= MAX_BACKOFF_ERRORS
          ? POLL_INTERVAL_BACKOFF_MS
          : POLL_INTERVAL_MS;
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, POLL_INTERVAL_MS);

    // Also refetch immediately when tab becomes visible again
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchMessages();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [open, introDone, errorCount, fetchMessages]);

  // ─── Auto-scroll to latest ─────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs, open]);

  // ─── Focus input on intro complete or open ─────────
  useEffect(() => {
    if (open && introDone) {
      // Small delay to let the animation settle
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, introDone]);

  // ─── Send a message (optimistic + reconciled) ──────
  async function sendMessage(bodyText: string) {
    const trimmed = bodyText.trim();
    if (!trimmed) return;

    const sid = getSession();
    const clientId = makeClientId();
    const now = new Date().toISOString();

    // Optimistic append
    const optimistic: Msg = {
      sender: "client",
      text: trimmed,
      createdAt: now,
      name,
      clientId,
      pending: true,
    };
    setMsgs((prev) => [...prev, optimistic]);

    // Try send
    const result = await safeFetchJson<{ ok: boolean }>("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sid,
        sender: "client",
        text: trimmed,
        name,
        email,
        clientId,
      }),
    });

    if (!result) {
      // Mark failed — user can retry
      setMsgs((prev) =>
        prev.map((m) =>
          m.clientId === clientId ? { ...m, pending: false, failed: true } : m,
        ),
      );
      setConnection("offline");
      return;
    }

    // Mark delivered — pending flag removed. Next poll will reconcile with server.
    setMsgs((prev) =>
      prev.map((m) =>
        m.clientId === clientId ? { ...m, pending: false, failed: false } : m,
      ),
    );
    // Trigger a refetch to pull the canonical server copy
    fetchMessages();
  }

  async function retryMessage(clientId: string) {
    const msg = msgs.find((m) => m.clientId === clientId);
    if (!msg) return;
    // Remove the failed one — sendMessage will re-append with a fresh clientId
    setMsgs((prev) => prev.filter((m) => m.clientId !== clientId));
    await sendMessage(msg.text);
  }

  async function handleIntro(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    localStorage.setItem("ae-chat-info", JSON.stringify({ name, email }));
    setIntroDone(true);
    await sendMessage(`Hi, I'm ${name}.`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = text;
    setText("");
    await sendMessage(t);
  }

  // ─── Render ────────────────────────────────────────
  return (
    <>
      {/* Trigger button — fixed bottom-right */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-ink text-bone shadow-2xl grid place-items-center hover:bg-purple-700 transition-colors"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X className="w-5 h-5" strokeWidth={2} />
        ) : (
          <MessageSquare className="w-5 h-5" strokeWidth={2} />
        )}
      </button>

      {/* Widget panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[520px] bg-bone border border-rule rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-ink text-bone px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-display text-lg leading-tight">Talk to us</p>
              <p className="text-[11px] text-bone/60 tracking-wider uppercase">
                {connection === "ok" && "Usually replies in < 1 hour"}
                {connection === "reconnecting" && "Reconnecting…"}
                {connection === "offline" && "Currently offline"}
              </p>
            </div>
            <ConnectionDot state={connection} />
          </div>

          {/* Body */}
          {!introDone ? (
            <form
              onSubmit={handleIntro}
              className="flex-1 flex flex-col p-5 gap-4"
            >
              <p className="text-sm text-ink/70">Quick intro before we chat?</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-700"
                required
                autoComplete="name"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-700"
                required
                autoComplete="email"
              />
              <button
                type="submit"
                className="btn-primary justify-center mt-auto"
                disabled={!name.trim() || !email.trim()}
              >
                Start chatting
              </button>
            </form>
          ) : (
            <>
              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {msgs.length === 0 && connection !== "offline" && (
                  <div className="text-sm text-ink/60 italic">
                    Send us a message and someone from the team will get back to
                    you shortly.
                  </div>
                )}
                {msgs.length === 0 && connection === "offline" && (
                  <div className="text-sm text-ink/60 italic flex items-start gap-2">
                    <AlertCircle
                      className="w-4 h-4 text-ink/40 mt-0.5 flex-shrink-0"
                      strokeWidth={2}
                    />
                    <span>
                      Chat is temporarily unavailable. Please email{" "}
                      <a
                        href="mailto:ephraim@aetechdigitalhub.com"
                        className="underline"
                      >
                        ephraim@aetechdigitalhub.com
                      </a>{" "}
                      or try again in a few minutes.
                    </span>
                  </div>
                )}

                {msgs.map((m, i) => (
                  <MessageBubble
                    key={m.clientId || `${m.createdAt}-${i}`}
                    msg={m}
                    onRetry={() => m.clientId && retryMessage(m.clientId)}
                  />
                ))}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="border-t border-rule p-3 flex gap-2"
              >
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    connection === "offline"
                      ? "Chat is offline…"
                      : "Type a message…"
                  }
                  className="flex-1 px-3 py-2 text-sm focus:outline-none bg-transparent disabled:opacity-50"
                  disabled={connection === "offline"}
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-full bg-ink text-bone grid place-items-center hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={connection === "offline" || !text.trim()}
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" strokeWidth={2} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ─── Subcomponents ────────────────────────────────────

function ConnectionDot({ state }: { state: ConnectionState }) {
  if (state === "ok") {
    return (
      <span
        className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
        title="Online"
      />
    );
  }
  if (state === "reconnecting") {
    return (
      <span
        className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"
        title="Reconnecting"
      />
    );
  }
  return <span className="w-2 h-2 rounded-full bg-red-400" title="Offline" />;
}

function MessageBubble({ msg, onRetry }: { msg: Msg; onRetry: () => void }) {
  const isClient = msg.sender === "client";
  const isSystem = msg.sender === "system";

  if (isSystem) {
    return (
      <div className="text-center text-[11px] text-ink/50 italic py-1">
        {msg.text}
      </div>
    );
  }

  return (
    <div className={`max-w-[80%] ${isClient ? "ml-auto" : ""}`}>
      <div
        className={`px-3.5 py-2 rounded-2xl text-sm ${
          isClient ? "bg-ink text-bone" : "bg-purple-100 text-ink"
        } ${msg.pending ? "opacity-60" : ""} ${msg.failed ? "opacity-50" : ""}`}
      >
        {msg.text}
      </div>
      {msg.pending && (
        <p className="text-[10px] text-ink/40 mt-1 text-right">Sending…</p>
      )}
      {msg.failed && (
        <button
          onClick={onRetry}
          className="text-[10px] text-red-600 hover:text-red-700 mt-1 flex items-center gap-1 ml-auto"
        >
          <RefreshCw className="w-2.5 h-2.5" strokeWidth={2} />
          Failed — tap to retry
        </button>
      )}
    </div>
  );
}
