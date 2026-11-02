'use client';

import { useUnit } from 'effector-react';
import type { Currency } from '@/lib/money/currency';
import { moneyShort } from '@/lib/money/format';
import { sum } from '@/lib/money/math';
import { useFontsReady } from '@/lib/useFontsReady';
import type { Coin } from '@/model/types';
import { $currency } from '@/model/wallet';
import { boardSkin, purseSkin, type BoardSkinId, type PurseSkinId } from '@/scene/skins';
import { billImg } from '@/components/mobile/parts';
import { PigFace } from '@/components/wall/Toast';
import { demoBill, MiniBoard, useInView, type DemoCell } from './MiniBoard';

/** Bills and budgets are indexes into the currency's denominations, so the examples work in any of them. */
type Cell = { id: string; name: string; have: number[]; want: number[]; colSpan: number; rowSpan: number; coins?: number };
type Example = { who: string; skin: BoardSkinId; purse: PurseSkinId; wallet: number[]; pig: string; cells: Cell[] };

const EXAMPLES: Example[] = [
  {
    who: 'Студент, конец месяца',
    skin: 'cork',
    purse: 'leather',
    wallet: [0],
    pig: 'Стипендия держалась героически. Целых четыре дня',
    cells: [
      { id: 's-shaurma', name: 'Шаурма', have: [1, 0], want: [3, 2], colSpan: 2, rowSpan: 2, coins: 3 },
      { id: 's-stip', name: 'Стипендия', have: [], want: [4], colSpan: 2, rowSpan: 2 },
      { id: 's-bus', name: 'Проезд', have: [0], want: [2], colSpan: 2, rowSpan: 1 },
      { id: 's-coffee', name: 'Кофе', have: [], want: [2], colSpan: 2, rowSpan: 1, coins: 2 },
    ],
  },
  {
    who: 'Фрилансер после жирного заказа',
    skin: 'felt',
    purse: 'croc',
    wallet: [5, 4, 3],
    pig: 'Налоги отложил сам? Горжусь. И немного боюсь',
    cells: [
      { id: 'f-tax', name: 'Налоги', have: [5, 5, 4], want: [5, 5, 4], colSpan: 2, rowSpan: 2 },
      { id: 'f-pillow', name: 'Подушка', have: [5, 4, 3], want: [5, 5, 5], colSpan: 2, rowSpan: 2 },
      { id: 'f-mac', name: 'Хотелки', have: [4, 2], want: [5], colSpan: 2, rowSpan: 1 },
      { id: 'f-coffee', name: 'Кофе', have: [2, 1], want: [3], colSpan: 2, rowSpan: 1 },
    ],
  },
  {
    who: 'Семья с котиком',
    skin: 'concrete',
    purse: 'glam',
    wallet: [2, 1],
    pig: 'Котику пачка, себе пусто. Всё верно, иерархия соблюдена',
    cells: [
      { id: 'c-cat', name: 'Котик', have: [5, 4, 3, 2], want: [5, 4, 3, 2], colSpan: 2, rowSpan: 2 },
      { id: 'c-rent', name: 'Аренда', have: [5, 5], want: [5, 5], colSpan: 2, rowSpan: 2 },
      { id: 'c-food', name: 'Еда', have: [3, 2], want: [4], colSpan: 2, rowSpan: 1 },
      { id: 'c-self', name: 'Себе', have: [], want: [3], colSpan: 2, rowSpan: 1 },
    ],
  },
];

const values = (idx: number[], cur: Currency) => idx.map(i => cur.bills[i]);

function ExampleCard({ ex, cur }: { ex: Example; cur: Currency }) {
  const { ref, seen } = useInView(0.35);
  const purse = purseSkin(ex.purse);
  const look = purse.look.light;
  const cells: DemoCell[] = ex.cells.map(c => ({ id: c.id, name: c.name, budget: sum(values(c.want, cur)), colSpan: c.colSpan, rowSpan: c.rowSpan }));
  const bills = ex.cells.flatMap(c => values(c.have, cur).map((v, n) => demoBill(`${c.id}-${n}`, v, c.id, n)));
  const coins: Coin[] = ex.cells.flatMap(c => Array.from({ length: c.coins ?? 0 }, (_, n) => ({ id: `c${c.id}x${n * 41}`, value: cur.coins[(n * 3) % cur.coins.length], location: 'cell' as const, cellId: c.id })));
  const inWallet = values(ex.wallet, cur);

  return (
    <article ref={ref} className="flex w-[min(86vw,380px)] flex-none snap-center flex-col gap-3 transition-transform duration-300 hover:-translate-y-2 hover:-rotate-[0.6deg] lg:w-auto">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h3 className="m-0 text-[19px] leading-tight font-bold tracking-[-0.02em] text-balance">{ex.who}</h3>
      </div>
      <MiniBoard skin={ex.skin} cells={cells} bills={bills} coins={coins} show={seen} />

      <div className="relative rounded-[18px] px-3.5 py-3 text-[#fbf1e1]" style={{ background: `linear-gradient(170deg, ${look.front}, ${look.back})`, boxShadow: '0 14px 26px -16px rgba(30,15,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
        <div className="pointer-events-none absolute inset-[5px] rounded-[14px] border-[1.5px] border-dashed" style={{ borderColor: look.stitch }} />
        <div className="relative flex items-center justify-between gap-2">
          <span className="text-sm whitespace-nowrap">
            В кошельке: <b className="text-[17px]">{moneyShort(sum(inWallet))} {cur.symbol}</b>
          </span>
          <div className="relative h-[30px] flex-none" style={{ width: 46 + (inWallet.length - 1) * 22 }}>
            {seen &&
              inWallet.map((v, i) => (
                <div key={i} className="absolute top-0" style={{ left: i * 22, transform: `rotate(${(i - 1) * 7}deg)`, zIndex: i }}>
                  {billImg(v, cur, 56, { boxShadow: '0 3px 5px -2px rgba(20,8,0,0.6)' })}
                </div>
              ))}
          </div>
        </div>
      </div>

      <p className="m-0 flex items-center gap-2.5 px-1 text-[15px] leading-snug">
        <PigFace />
        <span>{ex.pig}</span>
      </p>
      <span className="px-1 text-[13px] text-ink2">
        {boardSkin(ex.skin).name} + {purse.name.toLowerCase()} · {boardSkin(ex.skin).price + purse.price ? 'скины за донат' : 'бесплатно'}
      </span>
    </article>
  );
}

/** Three walls of three different people, in different skins. */
export function BoardExamples() {
  const ready = useFontsReady();
  const cur = useUnit($currency);
  if (!ready) return <div className="h-[580px]" />;
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pt-3 pb-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
      {EXAMPLES.map(ex => (
        <ExampleCard key={ex.who} ex={ex} cur={cur} />
      ))}
    </div>
  );
}
