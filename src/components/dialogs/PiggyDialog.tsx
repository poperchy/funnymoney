'use client';

import { useUnit } from 'effector-react';
import { useEffect } from 'react';
import { money, plural } from '@/lib/money/format';
import { $pigFlow, pigAgreed, pigClosed, pigShaken, SHAKES_TO_BREAK } from '@/model/ui';
import { $currency, $piggyTotal, piggyBroken } from '@/model/wallet';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/**
 * Taking money out of the piggy is a small ritual: confirm, shake it three times, break it.
 * The card floats at the top without a backdrop so the pig on the shelf stays clickable.
 */
export function PiggyDialog() {
  const [flow, total, cur] = useUnit([$pigFlow, $piggyTotal, $currency]);
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
  const sum = `${money(total)} ${cur.symbol}`;

  // Once broken, closing the card still takes the money: you can't un-break a pig.
  const close = () => (flow.step === 'broken' ? piggyBroken() : pigClosed());

  return (
    <Modal open bare onClose={close} title="Копилка" width={520} className="items-center text-center">
      {flow.step === 'ask' && (
        <>
          <span className="text-[26px] leading-[1.15] font-bold tracking-[-0.025em] text-balance">
            Ты точно уверен, что хочешь забрать нажитое непосильным трудом?
          </span>
          <span className="max-w-[420px] text-[15px] leading-normal text-ink2">
            Там {sum}. Монеты станут купюрами, а что не разменять — мелочью. Всё ляжет в кошелёк.
          </span>
          <div className="flex gap-2.5">
            <Button variant="outline" size="lg" onClick={() => pigClosed()}>
              Не, пусть лежит
            </Button>
            <Button variant="primary" size="lg" onClick={() => pigAgreed()}>
              Да, мне надо
            </Button>
          </div>
        </>
      )}
      {flow.step === 'shake' && (
        <>
          <span className="text-[26px] leading-[1.15] font-bold tracking-[-0.025em]">Тогда тряси её!</span>
          <span className="text-[15px] leading-normal text-ink2">
            Кликай по свинке внизу. Ещё {left} {plural(left, 'раз', 'раза', 'раз')} — и она сдастся
          </span>
          <div className="flex gap-2">
            {Array.from({ length: SHAKES_TO_BREAK }, (_, i) => (
              <span key={i} className="block h-3 w-3 rounded-full" style={{ background: i < flow.shakes ? 'var(--accent)' : 'var(--line)' }} />
            ))}
          </div>
          <Button variant="secondary" onClick={() => pigShaken()}>
            Тряхнуть отсюда
          </Button>
        </>
      )}
      {flow.step === 'broken' && (
        <>
          <span className="text-[26px] leading-[1.15] font-bold tracking-[-0.025em]">Выпало {sum}. Свинка простит. Наверное</span>
          <span className="text-[15px] leading-normal text-ink2">Забирай. Новая свинка уже на подходе</span>
          <Button variant="primary" size="lg" onClick={() => piggyBroken()}>
            Забрать в кошелёк
          </Button>
        </>
      )}
    </Modal>
  );
}
