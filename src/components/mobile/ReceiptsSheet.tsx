'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useUnit } from 'effector-react';
import { useState } from 'react';
import { money } from '@/lib/money/format';
import { sum } from '@/lib/money/math';
import { sheetClosed } from '@/model/mobile';
import { $currency, $wallet } from '@/model/wallet';
import { StatsView } from '@/components/stats/Stats';
import { ReceiptPaper } from '@/components/wall/Receipts';
import { Sheet } from './Sheet';

type Tab = 'receipts' | 'stats';

/** Tap on "Потрачено": the month's receipts (tap one to fix it), or the month-to-month stats. No judgement either way. */
export function ReceiptsSheet({ tab: initial }: { tab: Tab }) {
  const [w, cur] = useUnit([$wallet, $currency]);
  const [tab, setTab] = useState<Tab>(initial);
  const [openedAt] = useState(() => new Date().toISOString());
  const now = new Date();
  const month = now.toLocaleString('ru-RU', { month: 'long' });
  const inMonth = w.receipts.filter(r => {
    const d = new Date(r.at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const sourceName = (s: string) => (s === 'pile' ? 'Кошелёк' : (w.categories.find(c => c.id === s)?.name ?? '—'));
  const list = w.receipts.slice(0, 60);

  return (
    <Sheet title={tab === 'stats' ? 'Статистика' : 'Чеки'} onClose={() => sheetClosed()} tall>
      <div className="flex flex-col gap-3 px-5 pt-2.5 pb-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="grid flex-1 grid-cols-2 gap-1 rounded-2xl bg-field p-1">
            {(
              [
                ['receipts', 'Чеки'],
                ['stats', 'Статистика'],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`h-10 rounded-xl text-[15px] font-semibold text-ink ${tab === id ? 'bg-modal shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)]' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
          <Dialog.Close aria-label="Закрыть" className="h-11 w-11 flex-none rounded-full bg-btn2 text-base text-ink">
            ✕
          </Dialog.Close>
        </div>
        <span className="text-sm text-ink2">
          {tab === 'stats'
            ? 'Месяц к месяцу, стопками. Без графиков и без осуждения'
            : `${month[0].toUpperCase() + month.slice(1)}, потрачено ${money(sum(inMonth.map(r => r.amount)))} ${cur.symbol}. Без осуждения`}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-5 pt-1.5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)' }}>
        {tab === 'stats' ? (
          <StatsView compact />
        ) : list.length === 0 ? (
          <span className="text-sm leading-normal text-ink2">Пока ни одного чека. Подозрительно экономно.</span>
        ) : (
          list.map((r, i) => <ReceiptPaper key={r.id} r={r} i={i} fresh={r.at > openedAt} source={sourceName(r.source)} />)
        )}
      </div>
    </Sheet>
  );
}
