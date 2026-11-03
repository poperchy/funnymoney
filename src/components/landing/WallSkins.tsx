'use client';

import { useUnit } from 'effector-react';
import { useEffect, useRef, useState } from 'react';
import { useMobile } from '@/lib/useMobile';
import type { Denoms } from '@/lib/money/denominations';
import { moneyShort } from '@/lib/money/format';
import { sum } from '@/lib/money/math';
import { useFontsReady } from '@/lib/useFontsReady';
import { defaultCategories } from '@/model/defaults';
import { $denoms } from '@/model/wallet';
import { boardSkin, hatSkin, neckSkin, NO_WEAR, purseSkin, SKIN_PACKS, tillSkin, type SkinSet } from '@/scene/skins';
import { TillDock } from '@/components/money/TillArt';
import { purseCss } from '@/scene/skinCss';
import { PurseTrim } from '@/components/money/PurseTrim';
import { billImg, PigArt } from '@/components/mobile/parts';
import './live';
import { demoBill, MiniBoard, useInView, type DemoCell } from './MiniBoard';
import { tr } from '@/lib/i18n';

/** How much of each default budget is still there: a wall in the middle of a month, with one cell already empty. */
const LEFT: Record<string, number> = { podushka: 1, arenda: 0, eda: 0.6, transport: 0.5, fun: 0.4, cafe: 0.15, health: 1, phone: 1, gifts: 0.5 };
const MAX_BILLS = 8;
const WALLET = [3, 2, 1];

/** The slider's slides: the free outfit, then the packs from the shop. A new skin shows up here once a pack wears it. */
const LOOKS: ({ name: string } & SkinSet)[] = [
  { name: tr.demo.classic, board: 'cork', purse: 'leather', till: 'register', hat: NO_WEAR, neck: NO_WEAR },
  ...SKIN_PACKS.map(p => ({ name: p.name, ...p.skins })),
];
type Look = (typeof LOOKS)[number];
const PIG_COINS = 18;


/** Counts an amount out in the largest bills it can. Whatever doesn't make up a bill stays out. */
function billsFor(amount: number, denoms: Denoms) {
  const out: number[] = [];
  let rest = amount;
  for (const bill of [...denoms.bills].reverse()) {
    while (rest >= bill && out.length < MAX_BILLS) {
      out.push(bill);
      rest -= bill;
    }
  }
  return out;
}

function SkinSlide({ outfit, denoms, cols, rowH, show }: { outfit: Look; denoms: Denoms; cols: number; rowH: number; show: boolean }) {
  const wallet = purseSkin(outfit.purse);
  const look = wallet.look.light;
  const categories = defaultCategories(denoms.id);
  const cells: DemoCell[] = categories.map(({ id, name, budget, colSpan, rowSpan }) => ({ id, name, budget, colSpan, rowSpan }));
  // Same ids on every slide: the same money lying the same way, only the skin changes.
  const bills = categories.flatMap(c => billsFor(c.budget * (LEFT[c.id] ?? 1), denoms).map((v, n) => demoBill(`${c.id}-${n}`, v, c.id, n)));
  const inWallet = WALLET.map(i => denoms.bills[i]);
  const coins = Array.from({ length: PIG_COINS }, (_, i) => ({ id: 'cskin' + i * 31, value: denoms.coins[i % denoms.coins.length], location: 'piggy' as const }));

  return (
    <>
      <MiniBoard skin={boardSkin(outfit.board).id} cells={cells} bills={bills} show={show} cols={cols} rowH={rowH} />
      <div className="mt-3 flex items-stretch gap-3">
      <div className="relative flex min-w-0 flex-1 flex-col justify-center rounded-[18px] px-4 py-3" style={purseCss(look)}>
        <PurseTrim skin={wallet} look={look} faceWidth={44} />
        <div className="pointer-events-none absolute inset-[5px] rounded-[14px] border-[1.5px] border-dashed" style={{ borderColor: look.stitch }} />
        <div className="relative flex items-center justify-between gap-2">
          <span className="text-sm whitespace-nowrap">
            {tr.common.inWallet} <b className="text-[17px]">{moneyShort(sum(inWallet))}</b>
          </span>
          <div className="relative h-[30px] flex-none max-[520px]:hidden" style={{ width: 46 + (inWallet.length - 1) * 22, marginRight: wallet.trim ? 64 : 0 }}>
            {show &&
              inWallet.map((v, i) => (
                <div key={i} className="absolute top-0" style={{ left: i * 22, transform: `rotate(${(i - 1) * 7}deg)`, zIndex: i }}>
                  {billImg(v, denoms, 56)}
                </div>
              ))}
          </div>
        </div>
      </div>
      <TillDock skin={tillSkin(outfit.till)} height={86} caption={tr.demo.tillCaption} className="w-[176px] flex-none max-[720px]:hidden" />
      {/* The hat is allowed to stick out over the wall. */}
      <div className="relative h-[86px] w-[110px] flex-none">
        <div className="absolute top-0 left-0 h-[182px] w-[232px] origin-top-left scale-[0.47]">
          <PigArt coins={coins} bills={[]} wear={outfit} />
        </div>
      </div>
      </div>
    </>
  );
}

/** The default wall on a slider: swipe it or pick a skin below, and the same wall changes clothes. */
export function WallSkins() {
  const ready = useFontsReady();
  const denoms = useUnit($denoms);
  const narrow = useMobile();
  const { ref, seen } = useInView(0.2);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const chips = useRef<HTMLDivElement>(null);

  // With many skins the row scrolls: keep the current one in sight, without moving the page.
  useEffect(() => {
    const row = chips.current;
    const chip = row?.children[active] as HTMLElement | undefined;
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [active]);

  const go = (i: number) => {
    const el = track.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    if (!el || !slide) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  };

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const slides = [...el.children] as HTMLElement[];
    const dist = slides.map(s => Math.abs(s.offsetLeft + s.offsetWidth / 2 - center));
    setActive(dist.indexOf(Math.min(...dist)));
  };

  if (!ready) return <div className="h-[640px]" />;

  const outfit = LOOKS[active];
  const parts = [boardSkin(outfit.board), purseSkin(outfit.purse), tillSkin(outfit.till), hatSkin(outfit.hat), neckSkin(outfit.neck)];
  const worn = parts.filter(p => p.id !== NO_WEAR).map(p => p.name);
  const arrow = 'hidden h-11 w-11 flex-none items-center justify-center rounded-full bg-modal text-lg shadow-[0_0_0_1px_var(--line)] transition-colors hover:bg-accent-wash sm:flex';

  return (
    <div ref={ref} style={{ '--slide': 'min(1060px, 88vw)' } as React.CSSProperties}>
      <div ref={track} onScroll={onScroll} className="no-scrollbar relative flex snap-x snap-mandatory gap-6 overflow-x-auto pt-3 pb-8" style={{ paddingInline: 'calc((100% - var(--slide)) / 2)' }}>
        {LOOKS.map((s, i) => (
          <div
            key={s.name}
            aria-hidden={i !== active}
            onClick={i === active ? undefined : () => go(i)}
            className={`flex-none snap-center transition-opacity duration-300 ${i === active ? '' : 'cursor-pointer opacity-50'}`}
            style={{ width: 'var(--slide)' }}
          >
            <SkinSlide outfit={s} denoms={denoms} cols={narrow ? 4 : 8} rowH={narrow ? 82 : 96} show={seen} />
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-[720px] flex-col items-center gap-3 px-4 text-center">
        <div className="flex max-w-full items-center gap-2">
          <button onClick={() => go((active + LOOKS.length - 1) % LOOKS.length)} aria-label={tr.demo.prevSkin} className={arrow}>
            ←
          </button>
          <div ref={chips} className="no-scrollbar relative flex min-w-0 gap-2 overflow-x-auto py-0.5 pl-0.5">
          {LOOKS.map((s, i) => (
            <button
              key={s.name}
              onClick={() => go(i)}
              aria-pressed={i === active}
              className={`flex h-11 flex-none items-center gap-2 rounded-full px-4 text-[15px] font-medium transition-colors ${i === active ? 'bg-accent text-accent-ink' : 'bg-modal shadow-[0_0_0_1px_var(--line)] hover:bg-accent-wash'}`}
            >
              <span className="h-4 w-4 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]" style={{ background: boardSkin(s.board).swatch }} />
              {s.name}
            </button>
          ))}
          </div>
          <button onClick={() => go((active + 1) % LOOKS.length)} aria-label={tr.demo.nextSkin} className={arrow}>
            →
          </button>
        </div>
        <p className="m-0 min-h-[46px] text-[15px] leading-normal text-balance text-ink2">
          {worn.join(' + ')}. {parts.some(p => p.price) ? tr.demo.forDonation : tr.demo.free}
        </p>
      </div>
    </div>
  );
}
