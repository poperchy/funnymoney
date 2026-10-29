'use client';

import { useUnit } from 'effector-react';
import { useState, type CSSProperties } from 'react';
import { CURRENCY_LIST, type CurrencyCode } from '@/lib/money/currency';
import { money, plural } from '@/lib/money/format';
import { $muted, $theme, $volume, incomeOpened, manualSpendToggled, muteToggled, themeToggled, volumeChanged } from '@/model/ui';
import { play } from '@/sound/sfx';
import { shopToggled } from '@/model/skins';
import { $balance, $currency, $wallet, currencyChanged } from '@/model/wallet';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

function monthInfo(now = new Date()) {
  const name = now.toLocaleString('ru-RU', { month: 'long' });
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const hint =
    days === 0 ? 'последний день, финишная прямая' : days <= 5 ? `осталось ${days} ${plural(days, 'день', 'дня', 'дней')}, держимся` : `ещё ${days} ${plural(days, 'день', 'дня', 'дней')} впереди`;
  return { title: name[0].toUpperCase() + name.slice(1) + ' ' + now.getFullYear(), hint };
}

export function CurrencySelect({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [cur, w] = useUnit([$currency, $wallet]);
  const [pending, setPending] = useState<CurrencyCode | null>(null);
  const hasMoney = w.bills.length > 0 || w.coins.length > 0 || w.receipts.length > 0;
  return (
    <>
      <select
        aria-label="Валюта"
        value={cur.code}
        onChange={e => {
          const code = e.target.value as CurrencyCode;
          if (hasMoney) setPending(code);
          else currencyChanged(code);
        }}
        className={`${size === 'sm' ? 'h-10' : 'h-11'} cursor-pointer rounded-full border border-line bg-transparent px-3.5 text-sm font-medium text-ink`}
      >
        {CURRENCY_LIST.map(c => (
          <option key={c.code} value={c.code}>
            {c.code} · {c.symbol}
          </option>
        ))}
      </select>
      <Modal open={!!pending} onClose={() => setPending(null)} title="Смена валюты" width={480}>
        <div className="flex flex-col gap-2">
          <span className="text-[26px] leading-tight font-bold tracking-[-0.025em]">Сменить валюту на {pending}?</span>
          <span className="text-[15px] leading-normal text-ink2">
            Купюры другой страны на эту стену не повесишь. Стена, копилка и чеки начнутся с нуля.
          </span>
        </div>
        <div className="flex justify-end gap-2.5">
          <Button variant="outline" size="lg" onClick={() => setPending(null)}>
            Оставить как есть
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              if (pending) currencyChanged(pending);
              setPending(null);
            }}
          >
            Начать заново
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function ThemeButton({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const theme = useUnit($theme);
  return (
    <Button variant="outline" size={size} onClick={() => themeToggled()}>
      {theme === 'dark' ? '☀ Днём' : '☾ Ночью'}
    </Button>
  );
}

/** Speaker icon with 0–2 waves for the current loudness, crossed out when muted. */
function SpeakerIcon({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 20 20" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" stroke="none" />
      {level < 0 ? (
        <path d="M13.5 7.5l5 5m0-5l-5 5" />
      ) : (
        <>
          {level > 0 && <path d="M13 7.5a3.5 3.5 0 010 5" />}
          {level > 0.5 && <path d="M15.5 5a7 7 0 010 10" />}
        </>
      )}
    </svg>
  );
}

/** Mute toggle plus a thin volume slider; releasing the slider plays a sample. */
export function SoundControl({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [muted, volume] = useUnit([$muted, $volume]);
  const silent = muted || volume === 0;
  return (
    <div className={`flex items-center gap-1.5 rounded-full border border-line pr-3.5 pl-1 ${size === 'sm' ? 'h-10' : 'h-11'}`}>
      <button
        onClick={() => {
          if (silent && volume === 0) volumeChanged(0.3);
          else muteToggled();
        }}
        aria-pressed={!silent}
        title={silent ? 'Включить звук' : 'Выключить звук'}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-btn2"
      >
        <SpeakerIcon level={silent ? -1 : volume} />
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        aria-label="Громкость"
        value={silent ? 0 : Math.round(volume * 100)}
        onChange={e => volumeChanged(Number(e.target.value) / 100)}
        onPointerUp={() => play('clink')}
        onKeyUp={() => play('clink')}
        className="volume h-1 w-[74px] cursor-pointer"
        style={{ '--fill': `${silent ? 0 : Math.round(volume * 100)}%` } as CSSProperties}
      />
    </div>
  );
}

export function Header() {
  const [balance, cur] = useUnit([$balance, $currency]);
  const month = monthInfo();
  return (
    <header className="flex h-[84px] items-center justify-between gap-6 px-7">
      <div className="flex items-center gap-10">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-ink2">Всё твоё богатство</span>
          <span className="text-[34px] leading-[1.05] font-semibold tracking-[-0.03em]">
            {money(balance)} <span className="text-lg font-medium text-ink2">{cur.symbol}</span>
          </span>
        </div>
        <div className="h-10 w-px bg-line" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[17px] font-semibold tracking-[-0.01em]">{month.title}</span>
          <span className="text-[13px] text-ink2">{month.hint}</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <CurrencySelect />
        <ThemeButton />
        <SoundControl />
        <Button variant="outline" onClick={() => shopToggled(true)} title="Скины для доски и кошелька">
          ✦ Скины
        </Button>
        <Button variant="secondary" onClick={() => incomeOpened()}>
          + Зарплата
        </Button>
        <Button variant="primary" className="!h-12 !px-7 !text-base" onClick={() => manualSpendToggled(true)}>
          Потратить
        </Button>
      </div>
    </header>
  );
}
