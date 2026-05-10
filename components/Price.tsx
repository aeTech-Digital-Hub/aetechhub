'use client';
import { useAppSelector } from '@/store/hooks';
import { formatUsd, formatGhs, convertUsdToGhs } from '@/lib/currency';

/**
 * Hook for components that just need the live USD→GHS rate.
 * Reads from the Redux currency slice (which is populated on app boot by StoreProvider).
 */
export function useUsdToGhsRate(): number | null {
  return useAppSelector((s) => s.currency.rate);
}

export function Price({
  usd,
  size = 'md',
  align = 'left',
  inline = false,
}: {
  usd: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'right' | 'center';
  inline?: boolean;
}) {
  const rate = useUsdToGhsRate();
  const ghs = rate ? convertUsdToGhs(usd, rate) : null;

  const sizes: Record<string, string> = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : '';

  if (inline) {
    return (
      <span className={alignClass}>
        <span className="font-display">{formatUsd(usd)}</span>
        {ghs !== null && <span className="text-ink/50 ml-2 text-sm">≈ {formatGhs(ghs)}</span>}
      </span>
    );
  }

  return (
    <div className={alignClass}>
      <p className={`font-display ${sizes[size]}`}>{formatUsd(usd)}</p>
      <p className={`text-ink/50 ${size === 'sm' ? 'text-[11px]' : 'text-xs'} mt-0.5`}>
        {ghs !== null ? `≈ ${formatGhs(ghs)} at today's rate` : 'fetching rate…'}
      </p>
    </div>
  );
}
