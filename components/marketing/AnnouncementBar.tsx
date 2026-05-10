'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type Pinned = { title: string; slug: string; type: string } | null;

export function AnnouncementBar() {
  const [item, setItem] = useState<Pinned>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('ann-bar-closed') === '1') {
      setClosed(true);
      return;
    }
    fetch('/api/announcements?pinned=1&limit=1')
      .then((r) => r.json())
      .then((d) => setItem(d.items?.[0] || null))
      .catch(() => {});
  }, []);

  if (closed || !item) return null;

  return (
    <div className="bg-ink text-bone text-[12.5px] tracking-wide">
      <div className="container-px h-9 flex items-center justify-center gap-3">
        <span className="text-accent uppercase tracking-[0.18em] text-[10.5px] font-medium">{item.type}</span>
        <Link href={`/announcements/${item.slug}`} className="hover:text-accent flex items-center gap-1.5">
          {item.title}
          <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
        </Link>
        <button
          onClick={() => { sessionStorage.setItem('ann-bar-closed', '1'); setClosed(true); }}
          className="absolute right-4 text-bone/50 hover:text-bone text-xs"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
