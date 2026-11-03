'use client';

import { useUnit } from 'effector-react';
import { useEffect } from 'react';
import { money } from '@/lib/money/format';
import { $pigFlow, pigAgreed, pigClosed, pigShaken, SHAKES_TO_BREAK } from '@/model/ui';
import { $piggyTotal, $wallet, piggyBroken } from '@/model/wallet';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { pigGoalNote } from './PigGoalDialog';
import { tr } from '@/lib/i18n';

/**
 * Taking money out of the piggy is a small ritual: confirm, shake it three times, break it.
 * The card floats at the top without a backdrop so the pig on the shelf stays clickable.
 */
export function PiggyDialog() {
  const [flow, total, w] = useUnit([$pigFlow, $piggyTotal, $wallet]);
  const open = !!flow;
  // The pig stands at the very bottom of the wall, often below the fold — bring it into view,
  // otherwise it shakes and breaks where nobody is looking.
  useEffect(() => {
    if (!open) return;
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const below = canvas.getBoundingClientRect().bottom - window.innerHeight + 24;
    if (below > 0) window.scrollBy({ top: below, behavior: 'smooth' });
  }, [open]);
  if (!flow) return null;
  const left = SHAKES_TO_BREAK - flow.shakes;
  const sum = money(total);

  // Once broken, closing the card still takes the money: you can't un-break a pig.
  const close = () => (flow.step === 'broken' ? piggyBroken() : pigClosed());

  return (
    <Modal open bare onClose={close} title={tr.pig.title} width={520} className="items-center text-center">
      {flow.step === 'ask' && (
        <>
          <span className="text-[26px] leading-[1.15] font-bold tracking-[-0.025em] text-balance">{tr.pig.ask}</span>
          <span className="max-w-[420px] text-[15px] leading-normal text-ink2">
            {tr.pig.whatHappens(sum)} {pigGoalNote(w)}
          </span>
          <div className="flex gap-2.5">
            <Button variant="outline" size="lg" onClick={() => pigClosed()}>
              {tr.common.keepPig}
            </Button>
            <Button variant="primary" size="lg" onClick={() => pigAgreed()}>
              {tr.common.takePig}
            </Button>
          </div>
        </>
      )}
      {flow.step === 'shake' && (
        <>
          <span className="text-[26px] leading-[1.15] font-bold tracking-[-0.025em]">{tr.pig.shakeTitle}</span>
          <span className="text-[15px] leading-normal text-ink2">{tr.pig.shakeDesktop(left)}</span>
          <div className="flex gap-2">
            {Array.from({ length: SHAKES_TO_BREAK }, (_, i) => (
              <span key={i} className="block h-3 w-3 rounded-full" style={{ background: i < flow.shakes ? 'var(--accent)' : 'var(--line)' }} />
            ))}
          </div>
          <Button variant="secondary" onClick={() => pigShaken()}>
            {tr.pig.shakeBtn}
          </Button>
        </>
      )}
      {flow.step === 'broken' && (
        <>
          <span className="text-[26px] leading-[1.15] font-bold tracking-[-0.025em]">{tr.pig.broken(sum)}</span>
          <span className="text-[15px] leading-normal text-ink2">{tr.pig.brokenSub}</span>
          <Button variant="primary" size="lg" onClick={() => piggyBroken()}>
            {tr.pig.take}
          </Button>
        </>
      )}
    </Modal>
  );
}
