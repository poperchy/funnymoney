'use client';

import { useUnit } from 'effector-react';
import { moneyShort } from '@/lib/money/format';
import { sourceLabel } from '@/model/defaults';
import { exchangeOptions } from '@/model/ops';
import { $exchangeAt, exchangeOpened, toastShown } from '@/model/ui';
import { $denoms, $wallet, exchangeMerge, exchangeSplit } from '@/model/wallet';
import { BillImg, CoinFace } from '@/components/money/BillImg';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { play } from '@/sound/sfx';
import { tr } from '@/lib/i18n';

/** A bill or a coin, small. */
function Money({ value }: { value: number }) {
  const denoms = useUnit($denoms);
  return value >= denoms.bills[0] ? <BillImg value={value} scale={0.56} /> : <CoinFace value={value} size={30} />;
}

/** A run of money: shows each piece, collapses long runs of the same value into "×N". */
function Pieces({ values }: { values: number[] }) {
  const groups: { value: number; n: number }[] = [];
  for (const v of values) {
    const last = groups[groups.length - 1];
    if (last?.value === v) last.n++;
    else groups.push({ value: v, n: 1 });
  }
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {groups.map((g, i) => (
        <span key={i} className="flex items-center gap-1">
          <Money value={g.value} />
          {g.n > 1 && <span className="text-xs font-bold text-ink2">×{g.n}</span>}
        </span>
      ))}
    </span>
  );
}

const Arrow = () => <span className="shrink-0 text-lg text-ink2">→</span>;

/** Breaking money into smaller pieces, or gathering small money into a bigger bill, in one cell or the wallet. */
export function ExchangeDialog() {
  const [loc, w] = useUnit([$exchangeAt, $wallet]);
  if (!loc || loc.type === 'piggy') return null;
  const place = sourceLabel(loc.type === 'pile' ? 'pile' : loc.cellId, w.categories, tr.common.wallet, '');
  const { split, merge } = exchangeOptions(w, loc);
  const close = () => exchangeOpened(null);

  return (
    <Modal open onClose={close} title={tr.exchange.title} width={560}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[26px] font-bold tracking-[-0.025em]">{tr.exchange.heading(place)}</span>
          <span className="text-sm text-ink2">{tr.exchange.sub}</span>
        </div>
        <button onClick={close} aria-label={tr.common.close} className="h-11 w-11 shrink-0 rounded-full bg-btn2 text-base">
          ✕
        </button>
      </div>

      <section className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold text-ink2">{tr.exchange.split}</span>
        {split.length === 0 ? (
          <span className="rounded-[14px] bg-field px-4 py-3 text-sm text-ink2">{tr.exchange.splitNone}</span>
        ) : (
          split.map(o => (
            <div key={o.value} className="flex items-center gap-3 rounded-[14px] bg-field px-3.5 py-2.5">
              <Money value={o.value} />
              <Arrow />
              <Pieces values={o.pieces} />
              <Button
                variant="secondary"
                className="ml-auto !h-9 border border-line"
                onClick={() => {
                  exchangeSplit(o.id);
                  play('flutter');
                  toastShown(tr.exchange.splitDone(moneyShort(o.value)));
                }}
              >
                {tr.exchange.splitBtn}
              </Button>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold text-ink2">{tr.exchange.merge}</span>
        {merge.length === 0 ? (
          <span className="rounded-[14px] bg-field px-4 py-3 text-sm text-ink2">{tr.exchange.mergeNone}</span>
        ) : (
          merge.map(o => (
            <div key={o.target} className="flex items-center gap-3 rounded-[14px] bg-field px-3.5 py-2.5">
              <Pieces values={o.parts} />
              <Arrow />
              <Money value={o.target} />
              <Button
                variant="secondary"
                className="ml-auto !h-9 border border-line"
                onClick={() => {
                  exchangeMerge({ loc, target: o.target });
                  play('rustle');
                  toastShown(tr.exchange.mergeDone(moneyShort(o.target)));
                }}
              >
                {tr.exchange.mergeBtn}
              </Button>
            </div>
          ))
        )}
      </section>
    </Modal>
  );
}
