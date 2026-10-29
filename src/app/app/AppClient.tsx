'use client';

import dynamic from 'next/dynamic';

// Pixi, Howler and localStorage are browser-only.
const MoneyApp = dynamic(() => import('@/components/MoneyApp'), { ssr: false });

export function AppClient() {
  return <MoneyApp />;
}
