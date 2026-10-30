'use client';

import { useUnit } from 'effector-react';
import { useEffect, useRef, useState } from 'react';
import { money, moneyShort, plural } from '@/lib/money/format';
import { sheetClosed } from '@/model/mobile';
import { billsIn, piggyCoins } from '@/model/ops';
import { toastShown } from '@/model/ui';
import { $currency, $piggyTotal, $wallet, piggyBroken } from '@/model/wallet';
import { play } from '@/sound/sfx';
import { PigArt } from './parts';
import { Sheet } from './Sheet';

const TAPS_TO_ASK = 3;
/** m/s², gravity included: a real shake, not the phone being picked up. */
const SHAKE_FORCE = 25;

type MotionPermission = { requestPermission?: () => Promise<string> };

/** iOS only reports motion after asking, and only from a tap. Call it from the tap that opens the pig. */
export function askMotion() {
  const ask = (globalThis.DeviceMotionEvent as unknown as MotionPermission | undefined)?.requestPermission;
  ask?.call(DeviceMotionEvent).catch(() => undefined);
}

type Stage = 'idle' | 'confirm' | 'broken' | 'done';

/** Taking money out: shake the phone or tap the pig three times, confirm, and it breaks. */
export function PigSheet() {
  const [w, total, cur] = useUnit([$wallet, $piggyTotal, $currency]);
  const [stage, setStage] = useState<Stage>('idle');
  const [taps, setTaps] = useState(0);
  const [shake, setShake] = useState(0);
  const [taken, setTaken] = useState(0);
  const timer = useRef(0);

  useEffect(() => {
    if (stage !== 'idle' || !total) return;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0) < SHAKE_FORCE) return;
      setStage('confirm');
      setShake(n => n + 1);
      play('oink');
      play('clink', 0.08);
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [stage, total]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const tap = () => {
    if (stage === 'idle') {
      if (!total) {
        toastShown('Свинка голодает. Нечего трясти');
        return;
      }
      const n = taps + 1;
      setTaps(n);
      setShake(s => s + 1);
      play('oink');
      play('clink', 0.08);
      if (n >= TAPS_TO_ASK) setStage('confirm');
    } else if (stage === 'confirm') setShake(s => s + 1);
  };
  const yes = () => {
    setStage('broken');
    setTaken(total);
    play('crack');
    timer.current = window.setTimeout(() => {
      piggyBroken();
      setStage('done');
      play('flutter');
    }, 900);
  };
  const no = () => {
    sheetClosed();
    toastShown('Правильно. Пусть копится');
  };
  const close = () => stage !== 'broken' && sheetClosed();

  const left = TAPS_TO_ASK - taps;
  const title =
    stage === 'confirm'
      ? 'Ты точно уверен, что хочешь забрать нажитое непосильным трудом?'
      : stage === 'broken'
        ? 'Хрясь!'
        : stage === 'done'
          ? `Выпало ${moneyShort(taken)} ${cur.symbol}`
          : total
            ? 'Нужная мусорка'
            : 'Свинка голодает';
  const sub =
    stage === 'confirm'
      ? `Внутри ${money(total)} ${cur.symbol}. Свинку придётся разбить`
      : stage === 'broken'
        ? 'Собираем, что выпало…'
        : stage === 'done'
          ? 'Всё в нераспределённом: что разменялось — купюрами, остальное мелочью. Новая свинка уже на полке. Не трать всё сразу'
          : total
            ? `${money(total)} ${cur.symbol} мелочью и не только. Чтобы достать, потряси телефон или тапни по свинке ещё ${left} ${plural(left, 'раз', 'раза', 'раз')}`
            : 'Сюда падает мелочь со сдачи. Купюру тоже можно закинуть: просто перетащи её на свинку';

  return (
    <Sheet title="Копилка" onClose={close} className="items-center gap-3 px-[22px] text-center">
      <div onClick={tap} className="relative h-[206px] w-[260px] cursor-pointer">
        <div key={shake} className="absolute top-0 left-0 h-[182px] w-[232px] origin-[50%_80%]" style={{ animation: shake ? 'pig-shake .5s ease' : undefined }}>
          <div className="absolute top-0 left-0 h-[182px] w-[232px] origin-top-left scale-[1.12]">
            <PigArt coins={piggyCoins(w)} bills={billsIn(w, { type: 'piggy' })} broken={stage === 'broken'} />
          </div>
        </div>
      </div>
      <span className="text-2xl leading-[1.18] font-bold tracking-[-0.025em] text-balance">{title}</span>
      <span className="text-[15px] leading-normal text-pretty text-ink2">{sub}</span>
      {stage === 'confirm' && (
        <div className="mt-1.5 flex w-full flex-col gap-2">
          <button onClick={yes} className="h-[54px] rounded-[18px] bg-accent text-base font-semibold text-accent-ink">
            Да, мне надо
          </button>
          <button onClick={no} className="h-[54px] rounded-[18px] border border-line text-base font-medium text-ink">
            Не, пусть лежит
          </button>
        </div>
      )}
      {stage === 'idle' && (
        <button onClick={() => sheetClosed()} className="mt-1.5 h-[52px] w-full rounded-[18px] border border-line text-[15px] font-medium text-ink">
          Закрыть
        </button>
      )}
      {stage === 'done' && (
        <button onClick={() => sheetClosed()} className="mt-1.5 h-[54px] w-full rounded-[18px] bg-accent text-base font-semibold text-accent-ink">
          Ладно
        </button>
      )}
    </Sheet>
  );
}
