'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { money } from '@/lib/money/format';
import { receiptEditOpened } from '@/model/ui';
import { $wallet } from '@/model/wallet';
import type { Receipt } from '@/model/types';

export function when(iso: string) {
  const d = new Date(iso), now = new Date();
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return 'сегодня, ' + time;
  if (diff === 1) return 'вчера, ' + time;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '') + ', ' + time;
}

function Row({ a, b, className = '' }: { a: string; b: string; className?: string }) {
  return (
    <div className={`flex justify-between gap-2.5 ${className}`}>
      <span className="truncate">{a}</span>
      <span>{b}</span>
    </div>
  );
}

export function ReceiptPaper({ r, i, fresh, source }: { r: Receipt; i: number; fresh: boolean; source: string }) {
  return (
    <button
      onClick={() => receiptEditOpened(r.id)}
      title="Поправить чек"
      className="group block w-full text-left transition-transform duration-200 hover:-translate-y-0.5"
      style={{ transform: `rotate(${i % 2 ? 0.7 : -0.6}deg)`, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.12)) drop-shadow(0 8px 10px rgba(40,20,0,0.18))' }}
    >
      <div className={fresh ? 'animate-[receipt-in_.9s_cubic-bezier(.22,.8,.3,1)_both]' : ''}>
        <div className="relative bg-paper px-4 pt-3.5 pb-2 font-mono text-xs leading-[1.55] text-[#2a231b]">
          <span className="absolute top-3 right-3 rounded-full bg-[rgba(42,35,27,0.08)] px-2 py-0.5 font-sans text-[11px] font-semibold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            ✎ поправить
          </span>
          <div className="truncate pr-20 text-[13px] font-semibold uppercase">{r.label}</div>
          <div className="text-[#857866]">{when(r.at)}</div>
          <div className="my-2 border-t border-dashed border-[rgba(42,35,27,0.3)]" />
          <Row a={source} b={money(r.amount)} />
          <Row a="дал" b={money(r.paid)} className="text-[#857866]" />
          <Row a="сдача" b={money(r.paid - r.amount)} className="text-[#857866]" />
          <div className="my-2 border-t border-dashed border-[rgba(42,35,27,0.3)]" />
          <Row a="ИТОГО" b={money(r.amount)} className="text-sm font-semibold" />
        </div>
        <div
          className="h-2"
          style={{
            background:
              'linear-gradient(-45deg, transparent 5.5px, var(--paper) 0) 0 0 / 10px 8px repeat-x, linear-gradient(45deg, transparent 5.5px, var(--paper) 0) 0 0 / 10px 8px repeat-x',
          }}
        />
      </div>
    </button>
  );
}

/** Paper receipts of recent spending. */
export function Receipts() {
  const w = useUnit($wallet);
  // Only receipts printed during this visit get the tear-off animation; CSS plays it once on mount.
  const [openedAt] = useState(() => new Date().toISOString());

  const sourceName = (s: string) => (s === 'pile' ? 'Кошелёк' : (w.categories.find(c => c.id === s)?.name ?? '—'));
  const list = w.receipts.slice(0, 12);

  return (
    <div className="flex max-h-[600px] min-h-0 flex-1 flex-col gap-3.5 overflow-auto rounded-[20px] bg-panel p-[18px] pb-5">
      <span className="text-base font-semibold">Куда ушли деньги</span>
      {list.length === 0 ? (
        <span className="text-sm leading-normal text-ink2">Пока ни одного чека. Подозрительно экономно.</span>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((r, i) => (
            <ReceiptPaper key={r.id} r={r} i={i} fresh={r.at > openedAt} source={sourceName(r.source)} />
          ))}
        </div>
      )}
    </div>
  );
}
