'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { changeLocale, landingHref, locale, LOCALES, tr } from '@/lib/i18n';
import { SCALE_LIST, SCALES, type BillScale } from '@/lib/money/denominations';
import { billRange } from '@/lib/money/format';
import { sheetClosed, sheetOpened } from '@/model/mobile';
import { $muted, $theme, incomeOpened, muteToggled, pigGoalToggled, themeToggled, type Theme } from '@/model/ui';
import { shopToggled } from '@/model/skins';
import { boardHasMoney } from '@/model/ops';
import { $denoms, $wallet, boardCleared, scaleChanged } from '@/model/wallet';
import { useArmed } from '@/components/ui/useArmed';
import { Sheet } from './Sheet';

/** "⋯": language, theme, bills, sound and a new salary. */
export function MenuSheet() {
  const [theme, denoms, w, muted] = useUnit([$theme, $denoms, $wallet, $muted]);
  const [pending, setPending] = useState<BillScale | null>(null);
  const hasMoney = w.bills.length > 0 || w.coins.length > 0 || w.receipts.length > 0;
  const reset = useArmed(() => {
    boardCleared();
    sheetClosed();
  });

  const pickScale = (code: BillScale) => {
    if (code === denoms.id) return;
    if (hasMoney) setPending(code);
    else scaleChanged(code);
  };
  const seg = (on: boolean) =>
    `h-11 rounded-xl text-[15px] font-semibold text-ink ${on ? 'bg-modal shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)]' : 'bg-transparent'}`;

  return (
    // shrink-0: taller than a short phone, this sheet scrolls; otherwise flex squashes its buttons to fit.
    <Sheet title={tr.common.settings} onClose={() => sheetClosed()} className="gap-4 px-5 [&>*]:shrink-0">
      <span className="text-2xl font-bold tracking-[-0.025em]">{tr.common.settings}</span>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-ink2">{tr.language.label}</span>
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-field p-1">
          {LOCALES.map(l => (
            <button key={l} onClick={() => changeLocale(l)} className={seg(locale === l)}>
              {tr.language.names[l]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-ink2">{tr.mobile.theme}</span>
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-field p-1">
          {(
            [
              ['light', tr.mobile.themeLight],
              ['dark', tr.mobile.themeDark],
            ] as [Theme, string][]
          ).map(([id, label]) => (
            <button key={id} onClick={() => theme !== id && themeToggled()} className={seg(theme === id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-ink2">{tr.mobile.sound}</span>
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-field p-1">
          <button onClick={() => muted && muteToggled()} className={seg(!muted)}>
            {tr.mobile.soundOn}
          </button>
          <button onClick={() => !muted && muteToggled()} className={seg(muted)}>
            {tr.mobile.soundOff}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-ink2">{tr.scale.label}</span>
        <div className="flex flex-wrap gap-2">
          {SCALE_LIST.map(c => {
            const on = c.id === (pending ?? denoms.id);
            return (
              <button
                key={c.id}
                onClick={() => pickScale(c.id)}
                className="h-[42px] rounded-full border-[1.5px] px-[15px] text-sm font-semibold text-ink"
                style={{ borderColor: on ? 'var(--accent)' : 'var(--line)', background: on ? 'var(--accent-wash)' : 'transparent' }}
              >
                {billRange(c.bills)}
              </button>
            );
          })}
        </div>
        {pending && (
          <div className="flex flex-col gap-2.5 rounded-2xl bg-field p-3.5">
            <span className="text-sm leading-normal text-ink2">{tr.scale.changeWhyShort(billRange(SCALES[pending].bills))}</span>
            <div className="flex gap-2">
              <button onClick={() => setPending(null)} className="h-11 flex-1 rounded-full border border-line text-sm font-medium text-ink">
                {tr.scale.keepShort}
              </button>
              <button
                onClick={() => {
                  scaleChanged(pending);
                  setPending(null);
                  sheetClosed();
                }}
                className="h-11 flex-1 rounded-full bg-accent text-sm font-semibold text-accent-ink"
              >
                {tr.scale.restart}
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => sheetOpened({ type: 'receipts', tab: 'stats' })}
        className="h-[52px] rounded-[18px] border border-line text-[15px] font-medium text-ink"
      >
        {tr.mobile.statsMonthly}
      </button>
      <div className="flex gap-2">
        <button onClick={() => incomeOpened()} className="h-[52px] flex-1 rounded-[18px] border border-line text-[15px] font-medium text-ink">
          {tr.common.addIncome}
        </button>
        <button
          onClick={() => {
            sheetClosed();
            shopToggled(true);
          }}
          className="h-[52px] flex-1 rounded-[18px] border border-line text-[15px] font-medium text-ink"
        >
          {tr.common.skins}
        </button>
      </div>
      <button
        onClick={() => {
          sheetClosed();
          pigGoalToggled(true);
        }}
        className="h-[52px] rounded-[18px] border border-line text-[15px] font-medium text-ink"
      >
        {w.pigGoal ? tr.mobile.pigGoalNamed(w.pigGoal.name) : tr.mobile.pigGoal}
      </button>
      {boardHasMoney(w) && (
        <button onClick={reset.press} className="h-[52px] rounded-[18px] border border-line text-[15px] font-medium text-ink">
          {reset.armed ? tr.mobile.resetSure : tr.mobile.reset}
        </button>
      )}
      <a href={landingHref()} className="self-center text-[13px] text-ink2 underline underline-offset-[3px]">
        {tr.mobile.whatIsThis}
      </a>
    </Sheet>
  );
}
