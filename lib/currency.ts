// Live USD ↔ GHS rate with 1-hour module-level cache.
// Primary: open.er-api.com (no API key, no signup, ~daily updates)
// Fallback: fawazahmed0/currency-api on Cloudflare/jsDelivr (no key, hourly updates, 200+ currencies)
// Final fallback: hardcoded reasonable rate (16.5 GHS per USD as of mid-2025)

type RateCache = { rate: number; fetchedAt: number; source: string };

const FALLBACK_RATE = 16.5;          // GHS per 1 USD
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cache: RateCache | null = null;

const PRIMARY  = 'https://open.er-api.com/v6/latest/USD';
const FALLBACK = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';

export async function getUsdToGhsRate(): Promise<RateCache> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache;

  // Try primary
  try {
    const res = await fetch(PRIMARY, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.GHS;
      if (typeof rate === 'number' && rate > 0) {
        cache = { rate, fetchedAt: Date.now(), source: 'open.er-api.com' };
        return cache;
      }
    }
  } catch {}

  // Try fallback
  try {
    const res = await fetch(FALLBACK, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const rate = data?.usd?.ghs;
      if (typeof rate === 'number' && rate > 0) {
        cache = { rate, fetchedAt: Date.now(), source: 'fawazahmed0' };
        return cache;
      }
    }
  } catch {}

  // Fallback constant
  if (cache) return cache; // keep stale cache rather than fallback to constant
  cache = { rate: FALLBACK_RATE, fetchedAt: Date.now(), source: 'fallback-constant' };
  return cache;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatGhs(amount: number): string {
  return `GHS ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function convertUsdToGhs(usd: number, rate: number): number {
  return usd * rate;
}
