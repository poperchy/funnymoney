'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { CURRENCY_LIST, type CurrencyCode } from '@/lib/money/currency';
import { pageHref } from '@/lib/paths';
import { sheetClosed, sheetOpened } from '@/model/mobile';
import { $muted, $theme, incomeOpened, muteToggled, themeToggled, type Theme } from '@/model/ui';
import { shopToggled } from '@/model/skins';
import { $currency, $wallet, currencyChanged } from '@/model/wallet';
import { Sheet } from './Sheet';

/** "⋯": theme, currency, sound and a new salary. */
export function MenuSheet() {
  const [theme, cur, w, muted] = useUnit([$theme, $currency, $wallet, $muted]);
  const [pending, setPending] = useState<CurrencyCode | null>(null);
  const hasMoney = w.bills.length > 0 || w.coins.length > 0 || w.receipts.length > 0;

  const pickCurrency = (code: CurrencyCode) => {
    if (code === cur.code) return;
    if (hasMoney) setPending(code);
    else currencyChanged(code);
  };
  const seg = (on: boolean) =>
    `h-11 rounded-xl text-[15px] font-semibold text-ink ${on ? 'bg-modal shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)]' : 'bg-transparent'}`;

  return (
    <Sheet title="Настройки" onClose={() => sheetClosed()} className="gap-4 px-5">
      <span className="text-2xl font-bold tracking-[-0.025em]">Настройки</span>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-ink2">Тема</span>
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-field p-1">
          {(
            [
              ['light', 'Светлая'],
              ['dark', 'Тёмная'],
            ] as [Theme, string][]
          ).map(([id, label]) => (
            <button key={id} onClick={() => theme !== id && themeToggled()} className={seg(theme === id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-ink2">Звук</span>
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-field p-1">
          <button onClick={() => muted && muteToggled()} className={seg(!muted)}>
            Шуршать
          </button>
          <button onClick={() => !muted && muteToggled()} className={seg(muted)}>
            Тихо
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-ink2">Валюта</span>
        <div className="flex flex-wrap gap-2">
          {CURRENCY_LIST.map(c => {
            const on = c.code === (pending ?? cur.code);
            return (
              <button
                key={c.code}
                onClick={() => pickCurrency(c.code)}
                className="h-[42px] rounded-full border-[1.5px] px-[15px] text-sm font-semibold text-ink"
                style={{ borderColor: on ? 'var(--accent)' : 'var(--line)', background: on ? 'var(--accent-wash)' : 'transparent' }}
              >
                {c.code}
              </button>
            );
          })}
        </div>
        {pending && (
          <div className="flex flex-col gap-2.5 rounded-2xl bg-field p-3.5">
            <span className="text-sm leading-normal text-ink2">
              Купюры другой страны на эту стену не повесишь. Сменить на {pending}? Стена, копилка и чеки начнутся с нуля.
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPending(null)} className="h-11 flex-1 rounded-full border border-line text-sm font-medium text-ink">
                Оставить
              </button>
              <button
                onClick={() => {
                  currencyChanged(pending);
                  setPending(null);
                  sheetClosed();
                }}
                className="h-11 flex-1 rounded-full bg-accent text-sm font-semibold text-accent-ink"
              >
                Начать заново
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => sheetOpened({ type: 'receipts', tab: 'stats' })}
        className="h-[52px] rounded-[18px] border border-line text-[15px] font-medium text-ink"
      >
        Статистика по месяцам
      </button>
      <div className="flex gap-2">
        <button onClick={() => incomeOpened()} className="h-[52px] flex-1 rounded-[18px] border border-line text-[15px] font-medium text-ink">
          + Зарплата
        </button>
        <button
          onClick={() => {
            sheetClosed();
            shopToggled(true);
          }}
          className="h-[52px] flex-1 rounded-[18px] border border-line text-[15px] font-medium text-ink"
        >
          ✦ Скины
        </button>
      </div>
      <a href={pageHref('/')} className="self-center text-[13px] text-ink2 underline underline-offset-[3px]">
        Что это вообще такое
      </a>
    </Sheet>
  );
}
