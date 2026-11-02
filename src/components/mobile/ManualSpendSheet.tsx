'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { money, moneyShort } from '@/lib/money/format';
import { sum } from '@/lib/money/math';
import { DEFAULT_JOKE, JOKES } from '@/model/defaults';
import { sheetClosed } from '@/model/mobile';
import { planSpend, sourceLocation, totalIn } from '@/model/ops';
import { toastShown } from '@/model/ui';
import { $currency, $wallet, spent } from '@/model/wallet';
import { play } from '@/sound/sfx';
import { flightTime, flyMoney, type Hop } from './fly';
import { Sheet } from './Sheet';

export const parseAmount = (text: string) => {
  const v = Math.round(parseFloat(text.replace(/\s/g, '').replace(',', '.')) * 100);
  return Number.isFinite(v) && v > 0 ? v : 0;
};

/** Spending on a phone: type the amount, hit the button, watch it go. Bills and change are worked out for you. */
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
  const short = amount > 0 && !plan.ok;

  const submit = () => {
    if (!plan.ok) return;
    const { taken, back, coins } = plan;
    const coinSum = sum(coins);
    const changeAt = flightTime(taken.length);
    const hops: Hop[] = [
      {
        from: source,
        to: 'spent',
        values: taken.map(t => t.value),
        swallow: true,
        onLand: () => {
          play('till');
          navigator.vibrate?.(12);
          toastShown(`${JOKES[source] ?? DEFAULT_JOKE} · −${money(amount)}${coinSum ? ` · ${money(coinSum)} мелочью в кошелёк` : ''}`);
        },
      },
    ];
    if (back.length) hops.push({ from: 'spent', to: source, values: back, at: changeAt, onLand: () => play('rustle') });
    if (coins.length) hops.push({ from: 'spent', to: 'pile', values: coins, at: changeAt, onLand: () => play('clink') });
    sheetClosed();
    play('flutter');
    flyMoney(hops, () => spent({ source, billIds: taken.map(b => b.id), change: [...back, ...coins], label: note ?? undefined }));
  };

  return (
    <Sheet title="Потратить" onClose={() => sheetClosed()} className="gap-4 px-5 pt-2">
      <span className="text-2xl font-bold tracking-[-0.025em]">Сколько улетело?</span>

      <label className="flex h-[76px] shrink-0 items-center gap-2 rounded-[20px] border border-line bg-field px-5">
        <input
          autoFocus
          value={text}
          inputMode="decimal"
          enterKeyHint="done"
          placeholder="0"
          aria-label="Сумма"
          onChange={e => setText(e.target.value.replace(/[^\d.,]/g, '').slice(0, 10))}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="w-full min-w-0 bg-transparent text-[42px] font-bold tracking-[-0.03em] text-ink"
        />
        <span className="text-xl font-medium text-ink2">{cur.symbol}</span>
      </label>

      <div className="no-scrollbar -mx-5 flex shrink-0 gap-2 overflow-x-auto px-5">
        {sources.map(s => {
          const k = totalIn(w, sourceLocation(s.id));
          const on = s.id === source;
          return (
            <button
              key={s.id}
              disabled={k === 0}
              onClick={() => setSource(s.id)}
              className={`flex min-h-[60px] flex-none flex-col items-start justify-center rounded-2xl border-2 px-4 text-left disabled:opacity-40 ${on ? 'border-accent bg-accent-wash' : 'border-line'}`}
            >
              <span className="text-[15px] font-semibold whitespace-nowrap">{s.name}</span>
              <span className="text-[13px] whitespace-nowrap text-ink2">{k ? moneyShort(k) : 'пусто'}</span>
            </button>
          );
        })}
      </div>

      {short && (
        <span className="text-sm leading-snug text-danger">
          В «{name}» только {moneyShort(plan.total)}. Не хватает {money(amount - plan.total)}. Выбери другое место или переложи сюда денег
        </span>
      )}

      {note === null ? (
        <button onClick={() => setNote('')} className="-my-1 self-start py-1.5 text-sm text-ink2 underline underline-offset-[3px]">
          + комментарий
        </button>
      ) : (
        <input
          autoFocus
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="На что, если хочешь"
          className="h-[50px] shrink-0 rounded-[14px] border border-line bg-field px-[15px] text-base text-ink"
        />
      )}

      <button onClick={submit} disabled={!plan.ok} className="h-[64px] shrink-0 rounded-[20px] bg-accent px-4 text-[17px] font-semibold text-accent-ink disabled:opacity-40">
        {plan.ok ? `Прощай, дружок · −${moneyShort(amount)} ${cur.symbol}` : short ? 'Столько тут нет' : 'Сначала сумма'}
      </button>
    </Sheet>
  );
}
