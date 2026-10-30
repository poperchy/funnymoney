'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useUnit } from 'effector-react';
import { useState } from 'react';
import { money } from '@/lib/money/format';
import { sum } from '@/lib/money/math';
import { sheetClosed } from '@/model/mobile';
import { $currency, $wallet } from '@/model/wallet';
import { ReceiptPaper } from '@/components/wall/Receipts';
import { Sheet } from './Sheet';

/** Tap on "Потрачено": the month's receipts. No charts, no judgement. Tap a receipt to fix it. */
export function ReceiptsSheet() {
  const [w, cur] = useUnit([$wallet, $currency]);
  const [openedAt] = useState(() => new Date().toISOString());
  const now = new Date();
  const month = now.toLocaleString('ru-RU', { month: 'long' });
  const inMonth = w.receipts.filter(r => {
    const d = new Date(r.at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const sourceName = (s: string) => (s === 'pile' ? 'Куча' : (w.categories.find(c => c.id === s)?.name ?? '—'));
  const list = w.receipts.slice(0, 60);

  return (
    <Sheet title="Чеки" onClose={() => sheetClosed()} tall>
      <div className="flex items-center justify-between gap-3 px-5 pt-2.5 pb-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[26px] font-bold tracking-[-0.025em]">Чеки</span>
          <span className="text-sm text-ink2">
            {month[0].toUpperCase() + month.slice(1)}, потрачено {money(sum(inMonth.map(r => r.amount)))} {cur.symbol}. Без осуждения
          </span>
        </div>
        <Dialog.Close aria-label="Закрыть" className="h-11 w-11 flex-none rounded-full bg-btn2 text-base text-ink">
          ✕
        </Dialog.Close>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-[22px] pt-1.5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)' }}>
        {list.length === 0 ? (
          <span className="text-sm leading-normal text-ink2">Пока ни одного чека. Подозрительно экономно.</span>
        ) : (
          list.map((r, i) => <ReceiptPaper key={r.id} r={r} i={i} fresh={r.at > openedAt} source={sourceName(r.source)} />)
        )}
      </div>
    </Sheet>
  );
}
