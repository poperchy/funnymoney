'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { pageHref } from '@/lib/paths';

// Painted bills, stores and sounds are browser-only. The placeholders hold the space, so the text doesn't jump.
export const LiveWall = dynamic(() => import('./LiveWall').then(m => m.LiveWall), { ssr: false, loading: () => <div className="h-[556px]" /> });
export const BoardExamples = dynamic(() => import('./BoardExamples').then(m => m.BoardExamples), { ssr: false, loading: () => <div className="h-[580px]" /> });
export const PigShow = dynamic(() => import('./PigShow').then(m => m.PigShow), { ssr: false, loading: () => <div className="h-[460px]" /> });

const noSubscribe = () => () => undefined;
function hasWall() {
  try {
    return !!JSON.parse(localStorage.getItem('nalichka:wallet') ?? 'null')?.onboarded;
  } catch {
    return false;
  }
}

/** The main button. Someone who already has a wall goes back to it, without being sold it again. */
export function StartLink({ className = '', label = 'Повесить зарплату на стену →', back = 'Вернуться к своей стене →' }: { className?: string; label?: string; back?: string }) {
  const returning = useSyncExternalStore(noSubscribe, hasWall, () => false);
  return (
    <a href={pageHref('/app/')} className={className}>
      {returning ? back : label}
    </a>
  );
}
