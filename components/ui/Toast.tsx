'use client';
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { dismissToast } from '@/store/slices/uiSlice';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastViewport() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  const dispatch = useAppDispatch();

  // Auto-dismiss after 4s
  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => dispatch(dismissToast(t.id)), 4000)
    );
    return () => { timers.forEach(clearTimeout); };
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[60] space-y-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? AlertCircle : Info;
        const colors = t.tone === 'success'
          ? 'bg-green-50 border-green-200 text-green-900'
          : t.tone === 'error'
            ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-bone border-rule text-ink';
        return (
          <div
            key={t.id}
            className={`flex gap-3 items-start border ${colors} px-4 py-3 shadow-lg rounded-lg animate-slide-up`}
          >
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1 text-sm leading-snug">{t.message}</div>
            <button onClick={() => dispatch(dismissToast(t.id))} className="opacity-50 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
