'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { money, moneyShort } from '@/lib/money/format';
import { changeFor, sum } from '@/lib/money/math';
import { DEFAULT_JOKE, JOKES } from '@/model/defaults';
import { billsIn, frequentAmounts, sourceLocation } from '@/model/ops';
import { $spendDraft, draftCancelled, draftChanged, draftConfirmed, draftTopUp, toastShown } from '@/model/ui';
import { $currency, $wallet } from '@/model/wallet';
import { CoinFace } from '@/components/money/BillImg';
import { play } from '@/sound/sfx';
import { billImg } from './parts';
import { Sheet } from './Sheet';

/** After a bill lands in "Потрачено": a frequent amount in one tap, or tap in the change you got. */
export function SpendSheet() {
  const [draft, w, cur] = useUnit([$spendDraft, $wallet, $currency]);
  const [manual, setManual] = useState<string | null>(null);
  if (!draft) return null;

  const paidBills = draft.billIds.map(id => w.bills.find(b => b.id === id)).filter(b => !!b);
  const paid = sum(paidBills.map(b => b.value));
  const changeSum = sum(draft.change);
  const spent = paid - changeSum;
  const name = draft.source === 'pile' ? 'кучи' : '«' + (w.categories.find(c => c.id === draft.source)?.name ?? '') + '»';
  const rest = billsIn(w, sourceLocation(draft.source)).filter(b => !draft.billIds.includes(b.id));
  const topUps = [...new Set(rest.map(b => b.value))].sort((a, b) => a - b);
  const quick = frequentAmounts(w).filter(a => a < paid);
  const change = [...cur.bills.filter(v => v < paid).reverse(), ...cur.coins.slice(-5).reverse()];
  const back = draft.change.filter(v => v >= cur.bills[0]);
  const coins = sum(draft.change.filter(v => v < cur.bills[0]));

  const pick = (amount: number) => {
    draftChanged({ change: changeFor(paid - amount, cur) });
    setManual(null);
  };
  const add = (v: number) => {
    if (changeSum + v >= paid) {
      toastShown('Сдача больше купюры? Так не бывает');
      return;
    }
    draftChanged({ change: [...draft.change, v] });
    play(v >= cur.bills[0] ? 'rustle' : 'clink');
  };
  const remove = (v: number) => {
    const i = draft.change.lastIndexOf(v);
    if (i >= 0) draftChanged({ change: draft.change.filter((_, j) => j !== i) });
  };
  const applyManual = () => {
    const k = Math.round(parseFloat((manual ?? '').replace(/\s/g, '').replace(',', '.')) * 100);
    if (!Number.isFinite(k) || k <= 0 || k > paid) {
      toastShown('Больше купюры не потратишь. Ну, с этой');
      return;
    }
    pick(k);
  };

  let summary = 'Потратил всю купюру. Без сдачи, красиво.';
  if (changeSum) {
    summary = `Потратил ${money(spent)}, сдача ${money(changeSum)}.`;
    if (back.length) summary += ` ${back.map(moneyShort).join(' + ')} вернутся в ${name}.`;
    if (coins) summary += ` ${money(coins)} мелочью упадут в свинку.`;
  }

  const confirm = () => {
    if (spent <= 0) return;
    toastShown('Прощай, дружок · −' + money(spent) + (coins ? ' · ' + money(coins) + ' мелочью в свинку' : ''));
    play('till');
    draftConfirmed();
  };
  const cancel = () => {
    toastShown('Передумал? Правильно, пусть лежит');
    play('rustle');
    draftCancelled();
  };

  const chip = (label: string, amount: number) => {
    const on = spent === amount && manual === null;
    return (
      <button
        key={label}
        onClick={() => pick(amount)}
        className="h-11 rounded-full border-[1.5px] px-4 text-[15px] font-semibold"
        style={{ borderColor: on ? 'var(--ink)' : 'var(--line)', background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--page)' : 'var(--ink)' }}
      >
        {label}
      </button>
    );
  };

  return (
    <Sheet title="Трата" onClose={cancel} className="gap-4 px-5">
      <div className="flex items-center gap-4">
        <div className="relative flex-none -rotate-[7deg]">
          {paidBills[0] && billImg(paidBills[0].value, cur, 84, { boxShadow: '0 1px 1px rgba(0,0,0,0.22), 0 6px 10px -4px rgba(40,20,0,0.45)' })}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-2xl font-bold tracking-[-0.025em]">Прощай, дружок</span>
          <span className="text-sm text-ink2">
            {JOKES[draft.source] ?? DEFAULT_JOKE}
            {paidBills.length > 1 && ` · ${paidBills.map(b => moneyShort(b.value)).join(' + ')} ${cur.symbol}`}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[13px] text-ink2">Сколько ушло из {name}?</span>
        <div className="flex flex-wrap gap-2">
          {chip('Всю, без сдачи', paid)}
          {quick.map(a => chip(moneyShort(a), a))}
          {manual === null ? (
            <button onClick={() => setManual('')} className="h-11 px-1.5 text-sm text-ink2 underline underline-offset-[3px]">
              другая сумма
            </button>
          ) : (
            <input
              autoFocus
              value={manual}
              inputMode="decimal"
              placeholder={moneyShort(Math.round(paid / 3))}
              onChange={e => setManual(e.target.value.replace(/[^\d.,]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && applyManual()}
              onBlur={() => manual && applyManual()}
              className="h-11 w-[110px] rounded-full border border-line bg-field px-3.5 text-base font-semibold text-ink"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[13px] text-ink2">Или натапай сдачу, которую дали</span>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-3.5">
          {change.map(v => {
            const bill = v >= cur.bills[0];
            const n = draft.change.filter(x => x === v).length;
            return (
              <div key={v} className="relative" style={bill ? { width: 76, height: 38 } : { width: 44, height: 44 }}>
                <button onClick={() => add(v)} aria-label={'Сдача ' + moneyShort(v)} className="absolute inset-0 transition-transform active:scale-95">
                  {bill ? billImg(v, cur, 76, { boxShadow: '0 1px 1px rgba(0,0,0,0.22), 0 6px 10px -4px rgba(40,20,0,0.45)' }) : <CoinFace value={v} size={44} />}
                </button>
                {n > 0 && (
                  <button
                    onClick={() => remove(v)}
                    aria-label={'Убрать ' + moneyShort(v)}
                    className="absolute -top-[11px] -right-[9px] z-[2] h-6 rounded-full border-2 border-modal bg-ink px-[7px] text-xs font-bold whitespace-nowrap text-page"
                  >
                    ×{n} −
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {topUps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink2">
          <span>Не хватило? Докинь:</span>
          {topUps.map(v => (
            <button
              key={v}
              onClick={() => {
                const b = rest.find(x => x.value === v);
                if (!b) return;
                draftTopUp(b.id);
                play('rustle');
              }}
              className="h-[34px] rounded-full border border-line bg-btn2 px-3.5 text-sm font-semibold text-ink"
            >
              +{moneyShort(v)}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-field px-[15px] py-[13px] text-sm leading-normal text-ink2">{summary}</div>

      {draft.showNote ? (
        <input
          autoFocus
          value={draft.note}
          onChange={e => draftChanged({ note: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && confirm()}
          placeholder="На что, если хочешь"
          className="h-[46px] rounded-[14px] border border-line bg-field px-[15px] text-[15px] text-ink"
        />
      ) : (
        <button onClick={() => draftChanged({ showNote: true })} className="self-start text-sm text-ink2 underline underline-offset-[3px]">
          + комментарий
        </button>
      )}

      <div className="flex gap-2.5">
        <button onClick={cancel} className="h-[54px] rounded-[18px] border border-line px-5 text-[15px] font-medium text-ink">
          Вернуть
        </button>
        <button onClick={confirm} disabled={spent <= 0} className="h-[54px] flex-1 rounded-[18px] bg-accent text-base font-semibold text-accent-ink disabled:opacity-40">
          Готово · −{money(spent)}
        </button>
      </div>
    </Sheet>
  );
}
