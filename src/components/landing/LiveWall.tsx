'use client';

import { useUnit } from 'effector-react';
import { animate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { Denoms } from '@/lib/money/denominations';
import { money, moneyShort } from '@/lib/money/format';
import { sum } from '@/lib/money/math';
import { useFontsReady } from '@/lib/useFontsReady';
import { DEFAULT_JOKE, JOKES } from '@/model/defaults';
import type { Bill, Coin } from '@/model/types';
import { toastShown } from '@/model/ui';
import { $denoms } from '@/model/wallet';
import { flyMoney } from '@/components/mobile/fly';
import { PigArt } from '@/components/mobile/parts';
import { usePig } from '@/components/mobile/pig';
import { play } from '@/sound/sfx';
import './live';
import { demoBill, MiniBoard, useInView, type DemoCell } from './MiniBoard';
import { PigBubble } from './PigBubble';
import { tr } from '@/lib/i18n';

/** Bills per cell, as indexes into the denominations, so the demo works on any scale. */
const SALARY: Record<string, number[]> = { podushka: [5, 5, 4, 4, 3, 3], eda: [4, 4, 3, 3, 2, 2, 1], fun: [3, 3, 2, 2, 1], cafe: [2, 2, 1, 1, 0, 0] };
const AUTO_MS = 2600;
/** After a tap the demo holds back: the wall is theirs for a moment. */
const USER_PAUSE_MS = 7000;
const LOW_BILLS = 3;

const cellsFor = (denoms: Denoms): DemoCell[] =>
  Object.entries(SALARY).map(([id, idx]) => ({ id, name: tr.cats[id], budget: sum(idx.map(i => denoms.bills[i])), colSpan: 2, rowSpan: 2 }));

const salary = (denoms: Denoms, round: number): Bill[] =>
  Object.entries(SALARY).flatMap(([cell, idx]) => idx.map((i, n) => demoBill(`${cell}${round}-${n}`, denoms.bills[i], cell, n)));

const pigCoins = (denoms: Denoms): Coin[] => Array.from({ length: 22 }, (_, i) => ({ id: 'cdemo' + i * 37, value: denoms.coins[i % denoms.coins.length], location: 'piggy' }));

/** A number that runs to its new value instead of jumping. */
function useRunning(value: number) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const a = animate(from.current, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: v => {
        from.current = v;
        setShown(v);
      },
    });
    return () => a.stop();
  }, [value]);
  return Math.round(shown);
}

/** The hero: a working little wall. It spends by itself, tapping a cell takes a bill, the pig comments on all of it. */
export function LiveWall() {
  const ready = useFontsReady();
  const denoms = useUnit($denoms);
  const { ref, inView, seen } = useInView(0.3);
  const { ref: pigRef, jolt, poke } = usePig();
  const [bills, setBills] = useState(() => salary(denoms, 0));
  const [spent, setSpent] = useState(0);
  const [line, setLine] = useState({ text: tr.demo.pigStart, key: 0 });
  const round = useRef(0);
  const lastTap = useRef(0);
  const balance = useRunning(sum(bills.map(b => b.value)));
  const shownSpent = useRunning(spent);

  // The pig chatters on `toastShown` (usePig), and the landing page has no toasts to show it twice.
  const say = (text: string) => {
    setLine(l => ({ text, key: l.key + 1 }));
    toastShown(text);
  };

  const spend = (cell: string, byUser: boolean) => {
    const top = bills.filter(b => b.location.type === 'cell' && b.location.cellId === cell).at(-1);
    if (!top) {
      say(tr.common.emptyCell);
      return;
    }
    flyMoney(
      [
        {
          from: 'demo-' + cell,
          to: 'demo-till',
          values: [top.value],
          swallow: true,
          onLand: () => {
            say(byUser ? (JOKES[cell] ?? DEFAULT_JOKE) : Math.random() < 0.4 ? tr.common.goodbye : (JOKES[cell] ?? DEFAULT_JOKE));
            if (byUser) play('till');
          },
        },
      ],
      () => {
        setBills(all => all.filter(b => b.id !== top.id));
        setSpent(s => s + top.value);
      },
    );
  };
  const tap = (cell: string) => {
    lastTap.current = Date.now();
    spend(cell, true);
  };

  // The interval needs the latest bills without restarting on every spend.
  const tick = useRef<() => void>(() => undefined);
  useEffect(() => {
    tick.current = () => {
      if (document.hidden) return;
      if (bills.length <= LOW_BILLS) {
        round.current += 1;
        setBills(salary(denoms, round.current));
        setSpent(0);
        say(tr.demo.salary);
        return;
      }
      if (Date.now() - lastTap.current < USER_PAUSE_MS) return;
      const withMoney = [...new Set(bills.map(b => (b.location.type === 'cell' ? b.location.cellId : '')))];
      spend(withMoney[Math.floor(Math.random() * withMoney.length)], false);
    };
  });
  useEffect(() => {
    if (!ready || !inView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => tick.current(), AUTO_MS);
    return () => clearInterval(t);
  }, [ready, inView]);

  if (!ready) return <div className="h-[590px]" />;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[620px]">
      <div className="mb-2.5 flex items-end justify-between gap-3 px-1 text-left">
        <div className="flex flex-col">
          <span className="text-xs text-ink2">{tr.common.wealth}</span>
          <span className="text-[30px] leading-[1.05] font-bold tracking-[-0.035em] whitespace-nowrap">
            {money(balance)}
          </span>
        </div>
        <span className="pb-1 text-[13px] text-ink2">{tr.demo.tapHint}</span>
      </div>

      <MiniBoard skin="cork" cells={cellsFor(denoms)} bills={bills} show={seen} rowH={94} dropPrefix="demo-" onCell={tap} />

      <div className="relative mt-2.5 flex items-stretch gap-2.5">
        <div data-drop="demo-till" className="relative min-w-0 flex-1 overflow-hidden rounded-[22px] px-4 py-3 text-left text-[#f6efe3]" style={{ height: 84, background: 'var(--till)' }}>
          <div className="absolute inset-x-4 top-[9px] h-1 rounded-sm bg-[rgba(0,0,0,0.5)] shadow-[0_1px_0_rgba(255,255,255,0.1)]" />
          <div className="relative mt-2.5 flex flex-col gap-0.5">
            <span className="text-[17px] font-bold">{tr.common.spent}</span>
            <span className="truncate text-sm text-[rgba(246,239,227,0.75)]">{shownSpent ? `−${moneyShort(Math.round(shownSpent / 100) * 100)}` : tr.demo.nothingSpent}</span>
          </div>
        </div>
        <button onClick={poke} aria-label={tr.common.pokePig} className="relative w-[130px] flex-none overflow-hidden rounded-[22px] bg-panel" style={{ height: 84 }}>
          <div ref={pigRef} className="pointer-events-none absolute bottom-[5px] left-[18px] h-[71px] w-[90px] origin-bottom">
            <div className="absolute top-0 left-0 h-[182px] w-[232px] origin-top-left scale-[0.39]">
              <PigArt coins={pigCoins(denoms)} bills={[]} jolt={jolt} />
            </div>
          </div>
        </button>
        <div className="pointer-events-none absolute right-1 bottom-[92px] z-20 w-max max-w-[min(300px,85%)]">
          <PigBubble line={line} tailRight={48} />
        </div>
      </div>
    </div>
  );
}
