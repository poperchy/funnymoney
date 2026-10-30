'use client';

import { useUnit } from 'effector-react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Currency } from '@/lib/money/currency';
import { faceLabel } from '@/lib/money/format';
import { rng } from '@/lib/rng';
import type { Bill, Coin } from '@/model/types';
import { $currency } from '@/model/wallet';
import { billUrl, coinLook } from '@/scene/paint';
import { PIG } from '@/scene/palette';

/** Bill size on the phone wall. */
export const MBW = 72;
export const MBH = 36;
/** Bills keep below the paper tag. */
export const TAG_TOP = 22;

/** Stable pseudo-random numbers per item, so coins and pig bills don't jump between renders. */
export const seeded = (id: string) => rng([...id].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7));

/**
 * Money that appears once the wall is already on screen (income, a move, change) drops in;
 * whatever was there on the first paint just lies still.
 */
let live = false;
export const setLive = (v: boolean) => {
  live = v;
};
export const useArrived = () => useState(() => live)[0];

export function billImg(value: number, cur: Currency, width: number, style?: CSSProperties) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- generated data URL
    <img
      src={billUrl(value, cur)}
      alt={`${faceLabel(value)} ${cur.code}`}
      width={width}
      height={width / 2}
      draggable={false}
      className="pointer-events-none block rounded-[3px] select-none"
      style={style}
    />
  );
}

const BILL_SHADOW = '0 1px 1px rgba(0,0,0,0.24), 0 4px 7px -3px rgba(40,20,0,0.4)';

/** A bill lying in a cell: its pose is a share of the free space under the tag. */
export function WallBill({
  bill,
  hidden,
  pos,
  onPointerDown,
}: {
  bill: Bill;
  hidden?: boolean;
  /** Overrides the pose: the pile lays bills out in a row. */
  pos?: { left: string; top: string; r: number };
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  const cur = useUnit($currency);
  const arrived = useArrived();
  const [delay] = useState(() => Math.round(seeded(bill.id)() * 250));
  const r = pos?.r ?? bill.pose.r;
  const left = pos?.left ?? `max(0px, calc((100% - ${MBW}px) * ${bill.pose.x}))`;
  const top = pos?.top ?? `calc(${TAG_TOP}px + max(0px, (100% - ${MBH + TAG_TOP + 3}px) * ${bill.pose.y}))`;
  return (
    <div
      data-bill={bill.id}
      onPointerDown={onPointerDown}
      onContextMenu={e => e.preventDefault()}
      aria-label={`${faceLabel(bill.value)} ${cur.code}`}
      className="absolute cursor-grab overflow-hidden rounded-[3px] select-none [-webkit-touch-callout:none]"
      style={
        {
          left,
          top,
          width: MBW,
          height: MBH,
          zIndex: bill.z,
          '--r': `${r}deg`,
          transform: `rotate(${r}deg)`,
          boxShadow: BILL_SHADOW,
          opacity: hidden ? 0 : 1,
          touchAction: 'pan-y',
          transition: 'left .25s ease, top .25s ease, transform .25s ease',
          animation: arrived ? `bill-in .7s cubic-bezier(.22,.8,.3,1) ${delay}ms backwards` : undefined,
        } as CSSProperties
      }
    >
      {billImg(bill.value, cur, MBW)}
    </div>
  );
}

export function coinBg(value: number, cur: Currency) {
  const { bg, edge, bimetal, size } = coinLook(value, cur);
  const background = bimetal
    ? 'radial-gradient(ellipse at 40% 35%, #f6e09a 0 30%, #b8933c 44%, #eeeeea 47%, #9e9e97 80%)'
    : `radial-gradient(ellipse at 35% 30%, ${bg[0]}, ${bg[1]} 72%)`;
  return { background, edge, size };
}

/** A coin lying flat, seen at an angle. */
export function FlatCoin({ coin, style, onPointerDown, fall }: { coin: Coin; style?: CSSProperties; onPointerDown?: (e: React.PointerEvent) => void; fall?: boolean }) {
  const cur = useUnit($currency);
  const arrived = useArrived();
  const { background, edge, size } = coinBg(coin.value, cur);
  return (
    <div
      data-coin={coin.id}
      onPointerDown={onPointerDown}
      onContextMenu={e => e.preventDefault()}
      aria-label={`${faceLabel(coin.value)} ${cur.code}`}
      className={`absolute rounded-[50%] select-none ${onPointerDown ? 'cursor-grab' : ''}`}
      style={{
        width: size,
        height: size * 0.5,
        background,
        boxShadow: `0 ${Math.round(size * 0.12)}px 0 ${edge}, 0 3px 4px rgba(0,0,0,0.25)`,
        touchAction: 'pan-y',
        animation: arrived && fall ? 'coin-fall .9s cubic-bezier(.4,0,.6,1) backwards' : undefined,
        ...style,
      }}
    />
  );
}

const A = ({ s, children }: { s: CSSProperties; children?: ReactNode }) => <div style={{ position: 'absolute', ...s }}>{children}</div>;

const leg = (x: number) => (
  <A key={'leg' + x} s={{ left: x, top: 134, width: 24, height: 30, borderRadius: '6px 6px 10px 10px', background: PIG.fill, border: '3px solid ' + PIG.edge }} />
);

/** The glass piggy, 232×182: coins piling up inside, bills tucked in. Breaks in two halves when asked. */
export function PigArt({ coins, bills, broken, target }: { coins: Coin[]; bills: Bill[]; broken?: boolean; target?: boolean }) {
  const cur = useUnit($currency);
  // A few hundred coins look the same as a thousand.
  const shown = coins.slice(-160);
  const inside = (
    <>
      {shown.map((c, i) => {
        const r = seeded(c.id);
        const s = coinLook(c.value, cur).size;
        return <FlatCoin key={c.id} coin={c} fall style={{ left: 14 + r() * (150 - s), bottom: 6 + Math.floor(i / 8) * 4.4 + r() * 3 }} />;
      })}
      {bills.map(b => {
        const r = seeded(b.id);
        return (
          <A key={b.id} s={{ left: 24 + r() * 70, top: 34 + r() * 46, transform: `rotate(${(r() - 0.5) * 50}deg)`, boxShadow: '0 2px 4px rgba(0,0,0,0.25)', borderRadius: 3 }}>
            {billImg(b.value, cur, 50)}
          </A>
        );
      })}
    </>
  );
  const body = (key: string, clip?: string) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: 16,
        top: 26,
        width: 180,
        height: 124,
        borderRadius: '50%',
        border: '3px solid ' + PIG.edge,
        background: PIG.glass,
        overflow: 'hidden',
        clipPath: clip,
        boxShadow: target ? '0 0 0 8px rgba(255,250,235,0.7)' : 'none',
        transition: 'box-shadow .2s ease',
        zIndex: 2,
      }}
    >
      <A s={{ inset: 0 }}>{clip ? null : inside}</A>
      <A s={{ left: 26, top: 14, width: 70, height: 28, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.7), transparent 70%)' }} />
      <A s={{ right: 30, bottom: 12, width: 40, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
    </div>
  );
  const tail = (
    <A
      key="tail"
      s={{ left: 0, top: 64, width: 24, height: 24, border: '4px solid ' + PIG.edge, borderRadius: '50%', borderRightColor: 'transparent', borderBottomColor: 'transparent', transform: 'rotate(-40deg)' }}
    />
  );
  const head = [
    <A key="e1" s={{ left: 140, top: 20, width: 26, height: 26, background: PIG.fill, border: '3px solid ' + PIG.edge, borderRadius: '4px 70% 4px 70%', transform: 'rotate(-18deg)', zIndex: 3 }} />,
    <A key="e2" s={{ left: 160, top: 32, width: 22, height: 22, background: PIG.fill, border: '3px solid ' + PIG.edge, borderRadius: '4px 70% 4px 70%', transform: 'rotate(8deg)', zIndex: 3 }} />,
    <A key="sn" s={{ left: 186, top: 72, width: 36, height: 42, borderRadius: '50%', background: PIG.fill, border: '3px solid ' + PIG.edge, zIndex: 3 }}>
      <A s={{ left: 8, top: 11, width: 6, height: 11, borderRadius: '50%', background: PIG.dark }} />
      <A s={{ left: 18, top: 11, width: 6, height: 11, borderRadius: '50%', background: PIG.dark }} />
    </A>,
    <A key="eye" s={{ left: 164, top: 60, width: 8, height: 10, borderRadius: '50%', background: PIG.eye, zIndex: 3 }} />,
  ];

  if (!broken) {
    // Coins poking out of the slot once it gets full.
    const stick = Math.min(6, Math.floor(coins.length / 9));
    return (
      <A s={{ inset: 0 }}>
        {tail}
        {[42, 68, 128, 154].map(leg)}
        {Array.from({ length: stick }, (_, i) => {
          const { background, edge, size } = coinBg(coins[coins.length - 1 - i].value, cur);
          return (
            <A
              key={'st' + i}
              s={{ left: 92 + i * 6 - stick * 3, top: 12 - (i % 2) * 5, width: 7, height: size, borderRadius: 3, background, boxShadow: '1px 0 0 ' + edge, transform: `rotate(${(i - stick / 2) * 9}deg)`, zIndex: 1 }}
            />
          );
        })}
        {body('b')}
        <A s={{ left: 84, top: 26, width: 46, height: 8, borderRadius: 4, background: PIG.dark, zIndex: 3 }} />
        {head}
      </A>
    );
  }

  const r = rng(99);
  return (
    <A s={{ inset: 0 }}>
      <A s={{ inset: 0, transform: 'translate(-30px,10px) rotate(-16deg)', transformOrigin: '30% 80%' }}>
        {tail}
        {[42, 68].map(leg)}
        {body('bl', 'inset(0 50% 0 0)')}
      </A>
      <A s={{ inset: 0, transform: 'translate(32px,8px) rotate(14deg)', transformOrigin: '70% 80%' }}>
        {[128, 154].map(leg)}
        {body('br', 'inset(0 0 0 50%)')}
        {head}
      </A>
      {coins.slice(-40).map(c => {
        const { background, edge, size } = coinBg(c.value, cur);
        return <A key={'sp' + c.id} s={{ left: 30 + r() * 170, top: 150 + r() * 22, width: size, height: size * 0.5, borderRadius: '50%', background, boxShadow: '0 2px 0 ' + edge, zIndex: 4 }} />;
      })}
      {bills.map((b, i) => (
        <A key={'spb' + b.id} s={{ left: 60 + i * 30, top: 136 + r() * 10, transform: `rotate(${(r() - 0.5) * 40}deg)`, zIndex: 5 }}>
          {billImg(b.value, cur, 55)}
        </A>
      ))}
    </A>
  );
}
