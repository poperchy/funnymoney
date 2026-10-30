'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { billIndex, type Currency } from '@/lib/money/currency';
import { moneyShort } from '@/lib/money/format';
import { changeFor } from '@/lib/money/math';
import { monthKey, prevMonthKey, spendingByMonth } from '@/model/ops';
import { $statsOpen, statsToggled } from '@/model/ui';
import { $currency, $wallet } from '@/model/wallet';
import { Modal } from '@/components/ui/Modal';
import { billUrl } from '@/scene/paint';
import { BILL_PAL } from '@/scene/palette';

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
/** "против сентября" */
const MONTHS_OF = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
/** "в сентябре" */
const MONTHS_IN = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
const monthOf = (key: string) => Number(key.split('-')[1]) - 1;
const yearOf = (key: string) => Number(key.split('-')[0]);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const monthName = (key: string, thisYear = new Date().getFullYear()) => cap(MONTHS[monthOf(key)]) + (yearOf(key) === thisYear ? '' : ' ' + yearOf(key));

/** One bill-thick layer of a stack, in px. */
const LAYER = 3;

/**
 * A stack of money seen from the front: bill edges in the colours of the bills it would be paid with,
 * biggest at the bottom, the top bill lying flat. Height is `amount / unit` layers, so stacks compare.
 */
export function MoneyStack({ amount, unit, cur, width = 60, dim }: { amount: number; unit: number; cur: Currency; width?: number; dim?: boolean }) {
  const layers = amount > 0 ? Math.max(1, Math.min(40, Math.round(amount / unit))) : 0;
  const top = width * 0.3;
  if (!layers) {
    return <div className="rounded-md border-2 border-dashed border-line" style={{ width, height: top + 4, opacity: dim ? 0.6 : 1 }} />;
  }
  const bills = changeFor(amount, cur).filter(v => v >= cur.bills[0]);
  const values = bills.length ? bills : [cur.bills[0]];
  // Bottom layers are the big bills, the top ones the small change; the flat top bill is the smallest.
  const colorAt = (i: number) => BILL_PAL[billIndex(cur, values[Math.min(values.length - 1, Math.floor((i / layers) * values.length))])];
  return (
    <div className="relative" style={{ width, height: layers * LAYER + top, opacity: dim ? 0.5 : 1, filter: dim ? 'saturate(0.6)' : undefined }}>
      {Array.from({ length: layers }, (_, i) => {
        const [p0, p1, p2] = colorAt(i);
        return (
          <div
            key={i}
            className="absolute inset-x-0 rounded-[2px]"
            style={{
              bottom: i * LAYER,
              height: LAYER + 1,
              // Each bill lies a little off, like a real stack.
              transform: `translateX(${((i * 37) % 5) - 2}px)`,
              background: `linear-gradient(90deg, ${p1}, ${p0} 45%, ${p1})`,
              boxShadow: `inset 0 -1px 0 ${p2}`,
            }}
          />
        );
      })}
      {/* The top bill, lying flat. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
      <img
        src={billUrl(values[values.length - 1], cur)}
        alt=""
        width={width}
        height={width / 2}
        draggable={false}
        className="absolute left-0 origin-bottom rounded-[3px]"
        style={{ bottom: layers * LAYER - 1, transform: 'perspective(160px) rotateX(58deg)' }}
      />
      {layers >= 10 && (
        <div
          className="absolute rounded-[1px] shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
          style={{ left: width * 0.42, width: width * 0.14, bottom: 0, height: layers * LAYER + 1, background: '#efe2c3' }}
        />
      )}
    </div>
  );
}

function delta(now: number, before: number, prevIn: string) {
  if (!before && !now) return '';
  if (!before) return 'новенькое';
  const d = now - before;
  if (d === 0) return `как ${prevIn}`;
  return d > 0 ? `на ${moneyShort(d)} больше` : `на ${moneyShort(-d)} меньше, экономия`;
}

/** Spending per category, this month next to the month before, as stacks of money. */
export function StatsView({ compact }: { compact?: boolean }) {
  const [w, cur] = useUnit([$wallet, $currency]);
  const byMonth = spendingByMonth(w);
  const now = monthKey(new Date());
  const months = [...new Set([now, ...byMonth.keys()])].sort().reverse().slice(0, 12);
  const [month, setMonth] = useState(now);
  const prev = prevMonthKey(month);
  const a = byMonth.get(month) ?? { total: 0, bySource: {} };
  const b = byMonth.get(prev) ?? { total: 0, bySource: {} };
  const prevIn = 'в ' + MONTHS_IN[monthOf(prev)];

  const nameOf = (s: string) => (s === 'pile' ? 'Из кошелька' : (w.categories.find(c => c.id === s)?.name ?? 'Удалённая ячейка'));
  // Categories in wall order, then whatever else was spent from; empty in both months are left out.
  const sources = [...new Set([...w.categories.map(c => c.id), 'pile', ...Object.keys(a.bySource), ...Object.keys(b.bySource)])].filter(
    s => (a.bySource[s] ?? 0) + (b.bySource[s] ?? 0) > 0,
  );
  const maxCell = Math.max(1, ...sources.flatMap(s => [a.bySource[s] ?? 0, b.bySource[s] ?? 0]));
  const maxTotal = Math.max(1, a.total, b.total);
  const stackW = compact ? 48 : 56;

  let verdict: string;
  if (!w.receipts.length) verdict = 'Пока не с чем сравнивать. Потрать что-нибудь. Ну, или не трать — это тоже статистика';
  else if (!a.total) verdict = `В этом месяце ни одного чека. Подозрительно экономно`;
  else if (!b.total) verdict = `${prevIn[0].toUpperCase() + prevIn.slice(1)} чеков нет, сравнивать не с чем`;
  else if (a.total > b.total) verdict = `Больше, чем ${prevIn}, на ${moneyShort(a.total - b.total)} ${cur.symbol}. Бывает, жизнь дорожает`;
  else if (a.total < b.total) verdict = `Меньше, чем ${prevIn}, на ${moneyShort(b.total - a.total)} ${cur.symbol}. Свинка гордится`;
  else verdict = `Ровно как ${prevIn}. Стабильность — признак мастерства`;

  const pair = (now: number, before: number, unit: number, width: number) => (
    <div className="flex items-end gap-3">
      <div className="flex flex-col items-center gap-1.5">
        <MoneyStack amount={before} unit={unit} cur={cur} width={width} dim />
        <span className="text-[11px] whitespace-nowrap text-ink2">{moneyShort(before)}</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <MoneyStack amount={now} unit={unit} cur={cur} width={width} />
        <span className="text-xs font-semibold whitespace-nowrap">{moneyShort(now)}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {months.map(m => (
          <button
            key={m}
            onClick={() => setMonth(m)}
            className={`h-9 flex-none rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold text-ink ${m === month ? 'border-accent bg-accent-wash' : 'border-line'}`}
          >
            {monthName(m)}
          </button>
        ))}
      </div>

      <div className="flex items-end justify-between gap-4 rounded-2xl bg-field px-4 pt-4 pb-3">
        <div className="flex min-w-0 flex-col gap-1 self-center">
          <span className="text-[13px] text-ink2">
            {monthName(month)} против {MONTHS_OF[monthOf(prev)]}
          </span>
          <span className="text-[26px] leading-tight font-bold tracking-[-0.03em]">
            {moneyShort(a.total)} <span className="text-sm font-medium text-ink2">{cur.symbol}</span>
          </span>
          <span className="text-[13px] leading-snug text-pretty text-ink2">{verdict}</span>
        </div>
        <div className="flex-none">{pair(a.total, b.total, maxTotal / 26, compact ? 56 : 66)}</div>
      </div>

      {sources.length > 0 && (
        <div className="flex flex-col">
          <div className="flex justify-end gap-3 pb-1 text-[11px] text-ink2" style={{ paddingRight: 2 }}>
            <span className="text-center" style={{ width: stackW }}>
              {MONTHS[monthOf(prev)].slice(0, 3)}
            </span>
            <span className="text-center font-semibold text-ink" style={{ width: stackW }}>
              {MONTHS[monthOf(month)].slice(0, 3)}
            </span>
          </div>
          {sources.map(s => {
            const now = a.bySource[s] ?? 0, before = b.bySource[s] ?? 0;
            const d = delta(now, before, prevIn);
            return (
              <div key={s} className="flex items-end justify-between gap-3 border-t border-line py-3">
                <div className="flex min-w-0 flex-col gap-0.5 self-center">
                  <span className="truncate text-[15px] font-semibold">{nameOf(s)}</span>
                  {d && <span className={`text-xs ${now < before ? 'text-accent' : 'text-ink2'}`}>{d}</span>}
                </div>
                {pair(now, before, maxCell / 18, stackW)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Desktop: the stats in a dialog. */
export function StatsDialog() {
  const open = useUnit($statsOpen);
  if (!open) return null;
  const close = () => statsToggled(false);
  return (
    <Modal open onClose={close} title="Статистика" width={620}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[26px] font-bold tracking-[-0.025em]">Куда уходит</span>
          <span className="text-sm text-ink2">Месяц к месяцу, стопками. Без графиков и без осуждения</span>
        </div>
        <button onClick={close} aria-label="Закрыть" className="h-11 w-11 shrink-0 rounded-full bg-btn2 text-base">
          ✕
        </button>
      </div>
      <StatsView />
    </Modal>
  );
}
