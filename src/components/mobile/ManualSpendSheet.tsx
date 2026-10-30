'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { money, moneyShort } from '@/lib/money/format';
import { sum } from '@/lib/money/math';
import { DEFAULT_JOKE, JOKES } from '@/model/defaults';
import { sheetClosed } from '@/model/mobile';
import { frequentAmounts, planSpend, sourceLocation, totalIn } from '@/model/ops';
import { toastShown } from '@/model/ui';
import { $currency, $wallet, spent } from '@/model/wallet';
import { play } from '@/sound/sfx';
import { Sheet } from './Sheet';

export const parseAmount = (text: string) => {
  const v = Math.round(parseFloat(text.replace(/\s/g, '').replace(',', '.')) * 100);
  return Number.isFinite(v) && v > 0 ? v : 0;
};

/** Spending by typing: amount and where it came from. The bills and the change are worked out for you. */
export function ManualSpendSheet({ source: preset }: { source?: string }) {
  const [w, cur] = useUnit([$wallet, $currency]);
  const sources = [...w.categories.map(c => ({ id: c.id, name: c.name })), { id: 'pile', name: 'Кошелёк' }];
  const withMoney = (id: string) => totalIn(w, sourceLocation(id)) > 0;
  const [source, setSource] = useState(() => preset ?? ['eda', ...sources.map(s => s.id)].find(withMoney) ?? 'eda');
  const [text, setText] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const amount = parseAmount(text);
  const plan = planSpend(w, source, amount);
  const name = sources.find(s => s.id === source)?.name ?? '';

  let planText: string;
  if (!plan.ok) {
    planText =
      plan.reason === 'no-amount'
        ? 'Впиши сумму или тапни частую. Купюры подберу сам.'
        : `В «${name}» только ${moneyShort(plan.total)}. Не хватает ${money(amount - plan.total)} — выбери другое место или переложи туда денег.`;
  } else {
    planText = `Возьму ${plan.taken.map(b => moneyShort(b.value)).join(' + ')} из «${name}».`;
    if (plan.paid === amount) planText += ' Без сдачи.';
    else {
      if (plan.back.length) planText += ` Сдача ${plan.back.map(moneyShort).join(' + ')} вернётся туда же.`;
      const c = sum(plan.coins);
      if (c) planText += ` ${money(c)} мелочью — свинке.`;
    }
  }

  const submit = () => {
    if (!plan.ok) return;
    spent({ source, billIds: plan.taken.map(b => b.id), change: [...plan.back, ...plan.coins], label: note ?? undefined });
    toastShown((JOKES[source] ?? DEFAULT_JOKE) + ' · −' + money(amount));
    play('till');
    sheetClosed();
  };

  return (
    <Sheet title="Потратить" onClose={() => sheetClosed()} className="gap-4 px-5">
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-bold tracking-[-0.025em]">Потратить</span>
        <span className="text-sm text-ink2">Впиши сумму — купюры и сдачу посчитаю сам</span>
      </div>

      <label className="flex h-16 items-center gap-2 rounded-[18px] border border-line bg-field px-4">
        <input
          autoFocus
          value={text}
          inputMode="decimal"
          enterKeyHint="done"
          placeholder="0"
          aria-label="Сумма"
          onChange={e => setText(e.target.value.replace(/[^\d.,]/g, '').slice(0, 10))}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="w-full min-w-0 bg-transparent text-[32px] font-bold tracking-[-0.03em] text-ink"
        />
        <span className="text-lg font-medium text-ink2">{cur.symbol}</span>
      </label>

      <div className="flex flex-wrap gap-2">
        {frequentAmounts(w).map(a => {
          const on = amount === a;
          return (
            <button
              key={a}
              onClick={() => setText(String(a / 100).replace('.', ','))}
              className="h-10 rounded-full border-[1.5px] px-4 text-[15px] font-semibold"
              style={{ borderColor: on ? 'var(--ink)' : 'var(--line)', background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--page)' : 'var(--ink)' }}
            >
              {moneyShort(a)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-ink2">Откуда</span>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {sources.map(s => {
            const k = totalIn(w, sourceLocation(s.id));
            const on = s.id === source;
            return (
              <button
                key={s.id}
                disabled={k === 0}
                onClick={() => setSource(s.id)}
                className={`flex flex-none flex-col items-start rounded-[14px] border-2 px-3 py-1.5 text-left disabled:opacity-40 ${on ? 'border-accent bg-accent-wash' : 'border-line'}`}
              >
                <span className="text-sm font-semibold whitespace-nowrap">{s.name}</span>
                <span className="text-xs whitespace-nowrap text-ink2">{k ? moneyShort(k) : 'пусто'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-field px-[15px] py-[13px] text-sm leading-normal" style={{ color: plan.ok || !amount ? 'var(--ink2)' : 'var(--danger)' }}>
        {planText}
      </div>

      {note === null ? (
        <button onClick={() => setNote('')} className="self-start text-sm text-ink2 underline underline-offset-[3px]">
          + комментарий
        </button>
      ) : (
        <input
          autoFocus
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="На что, если хочешь"
          className="h-[46px] rounded-[14px] border border-line bg-field px-[15px] text-[15px] text-ink"
        />
      )}

      <div className="flex gap-2.5">
        <button onClick={() => sheetClosed()} className="h-[54px] rounded-[18px] border border-line px-5 text-[15px] font-medium text-ink">
          Отмена
        </button>
        <button onClick={submit} disabled={!plan.ok} className="h-[54px] flex-1 rounded-[18px] bg-accent text-base font-semibold text-accent-ink disabled:opacity-40">
          {amount ? `Потратить ${money(amount)}` : 'Потратить'}
        </button>
      </div>
    </Sheet>
  );
}
