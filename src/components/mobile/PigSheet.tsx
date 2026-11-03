'use client';

import { useUnit } from 'effector-react';
import { useEffect } from 'react';
import { money } from '@/lib/money/format';
import { billsIn, piggyCoins } from '@/model/ops';
import { $pigFlow, pigAgreed, pigClosed, pigShaken, SHAKES_TO_BREAK } from '@/model/ui';
import { $piggyTotal, $wallet, piggyBroken } from '@/model/wallet';
import { play } from '@/sound/sfx';
import { PigArt } from './parts';
import { usePig } from './pig';
import { pigGoalNote } from '@/components/dialogs/PigGoalDialog';
import { Sheet } from './Sheet';
import { tr } from '@/lib/i18n';

/** m/s², gravity included: a real shake, not the phone being picked up. */
const SHAKE_FORCE = 25;
const SHAKE_GAP_MS = 600;

type MotionPermission = { requestPermission?: () => Promise<string> };

/** iOS only reports motion after asking, and only from a tap. Call it from the tap that opens the pig. */
export function askMotion() {
  const ask = (globalThis.DeviceMotionEvent as unknown as MotionPermission | undefined)?.requestPermission;
  ask?.call(DeviceMotionEvent).catch(() => undefined);
}

const shakeIt = () => {
  pigShaken();
  play('oink');
  play('clink', 0.08);
};

/**
 * The same ritual and words as on the desktop (`$pigFlow`): are you sure → shake it three times → broken → take it.
 * On a phone you shake the pig by tapping it or by shaking the phone itself.
 */
export function PigSheet() {
  const [flow, w, total] = useUnit([$pigFlow, $wallet, $piggyTotal]);
  const { ref: pigRef, jolt, poke } = usePig();
  const step = flow?.step;

  useEffect(() => {
    if (step === 'broken') play('crack');
  }, [step]);
  useEffect(() => {
    if (step !== 'shake') return;
    let last = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0) < SHAKE_FORCE || Date.now() - last < SHAKE_GAP_MS) return;
      last = Date.now();
      shakeIt();
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [step]);

  if (!flow) return null;
  const left = SHAKES_TO_BREAK - flow.shakes;
  const sum = money(total);
  // Once broken, closing still takes the money: you can't un-break a pig.
  const close = () => (flow.step === 'broken' ? piggyBroken() : pigClosed());
  const tapPig = () => (flow.step === 'shake' ? shakeIt() : flow.step === 'ask' ? poke() : undefined);

  return (
    <Sheet title={tr.pig.title} onClose={close} className="items-center gap-3 px-[22px] text-center">
      <div onClick={tapPig} className="relative h-[206px] w-[260px] cursor-pointer">
        <div ref={pigRef} className="absolute top-0 left-0 h-[204px] w-[260px] origin-[50%_85%]">
          <div className="absolute top-0 left-0 h-[182px] w-[232px] origin-top-left scale-[1.12]">
            <PigArt coins={piggyCoins(w)} bills={billsIn(w, { type: 'piggy' })} broken={flow.step === 'broken'} jolt={jolt} />
          </div>
        </div>
      </div>

      {flow.step === 'ask' && (
        <>
          <span className="text-2xl leading-[1.18] font-bold tracking-[-0.025em] text-balance">{tr.pig.ask}</span>
          <span className="text-[15px] leading-normal text-pretty text-ink2">{tr.pig.whatHappens(sum)} {pigGoalNote(w)}</span>
          <div className="mt-1.5 flex w-full flex-col gap-2">
            <button onClick={() => pigAgreed()} className="h-[54px] rounded-[18px] bg-accent text-base font-semibold text-accent-ink">
              {tr.common.takePig}
            </button>
            <button onClick={() => pigClosed()} className="h-[54px] rounded-[18px] border border-line text-base font-medium text-ink">
              {tr.common.keepPig}
            </button>
          </div>
        </>
      )}
      {flow.step === 'shake' && (
        <>
          <span className="text-2xl leading-[1.18] font-bold tracking-[-0.025em]">{tr.pig.shakeTitle}</span>
          <span className="text-[15px] leading-normal text-pretty text-ink2">{tr.pig.shakePhone(left)}</span>
          <div className="flex gap-2">
            {Array.from({ length: SHAKES_TO_BREAK }, (_, i) => (
              <span key={i} className="block h-3 w-3 rounded-full" style={{ background: i < flow.shakes ? 'var(--accent)' : 'var(--line)' }} />
            ))}
          </div>
          <button onClick={shakeIt} className="mt-1.5 h-[52px] w-full rounded-[18px] bg-btn2 text-[15px] font-semibold text-ink">
            {tr.pig.shakeBtn}
          </button>
        </>
      )}
      {flow.step === 'broken' && (
        <>
          <span className="text-2xl leading-[1.18] font-bold tracking-[-0.025em] text-balance">{tr.pig.broken(sum)}</span>
          <span className="text-[15px] leading-normal text-ink2">{tr.pig.brokenSub}</span>
          <button onClick={() => piggyBroken()} className="mt-1.5 h-[54px] w-full rounded-[18px] bg-accent text-base font-semibold text-accent-ink">
            {tr.pig.take}
          </button>
        </>
      )}
    </Sheet>
  );
}
