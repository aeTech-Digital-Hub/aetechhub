'use client';
import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from './index';
import { fetchCurrentUser } from './slices/authSlice';
import { fetchRate } from './slices/currencySlice';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    // Bootstrap: get current user + currency rate as soon as the app loads
    storeRef.current?.dispatch(fetchCurrentUser());
    storeRef.current?.dispatch(fetchRate());
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
