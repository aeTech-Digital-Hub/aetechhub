'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

function getSession() {
  if (typeof window === 'undefined') return '';
  let s = localStorage.getItem('ae-session');
  if (!s) { s = `s_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; localStorage.setItem('ae-session', s); }
  return s;
}

export function track(event: string, meta: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: getSession(),
      event,
      path: window.location.pathname,
      referrer: document.referrer,
      meta,
    }),
    keepalive: true,
  }).catch(() => {});
}

export function Tracker() {
  const path = usePathname();

  useEffect(() => { track('page_view', { path }); }, [path]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest('[data-track]');
      if (t) track('cta_click', { label: t.getAttribute('data-track') });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
