'use client';

import { useUnit } from 'effector-react';
import type { CSSProperties, ReactNode } from 'react';
import { faceLabel } from '@/lib/money/format';
import { BH, BW } from '@/scene/layout';
import { billUrl, coinFaceCss } from '@/scene/paint';
import { $currency } from '@/model/wallet';

/** Bill drawn by the same painter as the wall, so DOM and canvas bills match. */
export function BillImg({ value, scale = 1, className = '', style }: { value: number; scale?: number; className?: string; style?: CSSProperties }) {
  const cur = useUnit($currency);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- generated data URL, nothing to optimise
    <img
      src={billUrl(value, cur)}
      alt={`${faceLabel(value)} ${cur.code}`}
      width={BW * scale}
      height={BH * scale}
      draggable={false}
      className={`block rounded select-none ${className}`}
      style={{ boxShadow: '0 1px 1px rgba(0,0,0,0.22), 0 6px 10px -4px rgba(40,20,0,0.45)', ...style }}
    />
  );
}

/** Bill or coin you click to add (right click or "−" to remove), with a ×N badge. */
export function CountButton({
  label,
  count,
  onAdd,
  onRemove,
  big,
  children,
}: {
  label: string;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  big?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col items-center ${big ? 'gap-2' : 'gap-1.5'}`}>
      <button
        onClick={onAdd}
        onContextMenu={e => {
          e.preventDefault();
          onRemove();
        }}
        aria-label={label}
        className={`relative transition-transform duration-150 active:scale-[0.97] ${big ? 'hover:-translate-y-[5px] hover:-rotate-[1.5deg]' : 'hover:-translate-y-[3px]'}`}
      >
        {children}
        {count > 0 && (
          <span
            className={`absolute z-[2] flex items-center justify-center rounded-full bg-ink font-bold text-page shadow-[0_4px_10px_-4px_rgba(0,0,0,0.5)] ${big ? '-top-3 -left-2.5 h-[30px] min-w-[30px] px-2 text-sm' : '-top-2.5 -left-2 h-6 min-w-6 px-1.5 text-xs'}`}
          >
            ×{count}
          </span>
        )}
      </button>
      <button
        onClick={onRemove}
        aria-label="Убрать"
        className={`rounded-full border border-line leading-none text-ink ${big ? 'h-8 w-8 text-lg' : 'h-[26px] w-[26px] text-[15px]'}`}
        style={{ visibility: count ? 'visible' : 'hidden' }}
      >
        −
      </button>
    </div>
  );
}

export function CoinFace({ value, size = 44 }: { value: number; size?: number }) {
  const cur = useUnit($currency);
  return (
    <span
      className="flex items-center justify-center rounded-full text-[13px] font-bold text-[#3a2a14]"
      style={{ width: size, height: size, ...coinFaceCss(value, cur) }}
    >
      {faceLabel(value)}
    </span>
  );
}
